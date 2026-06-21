package com.pcperformancelab.performance.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcperformancelab.performance.dto.CreatePerformanceSessionRequest;
import com.pcperformancelab.performance.model.MetricSource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class CapFrameXImportService {

    private final ObjectMapper objectMapper;

    public CapFrameXImportService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public CreatePerformanceSessionRequest parse(MultipartFile file) {
        try {
            JsonNode root = objectMapper.readTree(file.getInputStream());

            JsonNode info = root.path("Info");
            JsonNode runs = root.path("Runs");

            if (!runs.isArray() || runs.isEmpty()) {
                throw new ResponseStatusException(BAD_REQUEST, "CapFrameX file does not contain any run data");
            }

            JsonNode captureData = runs.get(0).path("CaptureData");

            List<Double> frameTimes = readDoubleArray(captureData.path("MsBetweenPresents"));
            List<Double> timeInSeconds = readDoubleArray(captureData.path("TimeInSeconds"));
            List<Double> dropped = readDoubleArray(captureData.path("Dropped"));

            if (frameTimes.isEmpty()) {
                throw new ResponseStatusException(BAD_REQUEST, "CapFrameX file does not contain frame time data");
            }

            double p95 = percentile(frameTimes, 95);
            double p99 = percentile(frameTimes, 99);
            double p999 = percentile(frameTimes, 99.9);

            String gameName = readText(info, "GameName", "Unknown Game");
            String processName = readText(info, "ProcessName", "Unknown Process");
            String gpuDriver = readText(info, "GPUDriverVersion", "Unknown Driver");
            String hags = readText(info, "HAGS", "Unknown");
            String presentationMode = readText(info, "PresentationMode", "Unknown");
            String gameMode = readText(info, "WinGameMode", "Unknown");

            return new CreatePerformanceSessionRequest(
                    gameName,
                    "CapFrameX import - " + processName,
                    MetricSource.CAPFRAMEX_JSON,
                    calculateDurationSeconds(timeInSeconds),
                    round(calculateAverageFps(frameTimes, timeInSeconds)),
                    round(fpsFromFrameTime(p99)),
                    round(fpsFromFrameTime(p999)),
                    round(p95),
                    round(p99),
                    round(p999),
                    countStutters(frameTimes),
                    countDroppedFrames(dropped),
                    List.of(
                            "CAPFRAMEX",
                            "GPU_DRIVER_" + sanitizeTag(gpuDriver),
                            "HAGS_" + sanitizeTag(hags),
                            "GAME_MODE_" + sanitizeTag(gameMode),
                            sanitizeTag(presentationMode)
                    ),
                    "Imported from CapFrameX JSON. Average FPS is calculated from frame count and capture duration. Stutters are estimated using frame time spikes above 3x median frame time."
            );
        } catch (IOException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid CapFrameX JSON file");
        }
    }

    private List<Double> readDoubleArray(JsonNode node) {
        List<Double> values = new ArrayList<>();

        if (!node.isArray()) {
            return values;
        }

        for (JsonNode value : node) {
            if (value.isNumber()) {
                values.add(value.asDouble());
            }
        }

        return values;
    }

    private String readText(JsonNode node, String fieldName, String fallback) {
        JsonNode value = node.path(fieldName);

        if (value.isMissingNode() || value.isNull()) {
            return fallback;
        }

        String text = value.asText();

        if (text == null || text.isBlank()) {
            return fallback;
        }

        return text;
    }

    private Integer calculateDurationSeconds(List<Double> timeInSeconds) {
        if (timeInSeconds.size() < 2) {
            return null;
        }

        double duration = timeInSeconds.get(timeInSeconds.size() - 1) - timeInSeconds.get(0);
        return (int) Math.round(duration);
    }

    private double calculateAverageFps(List<Double> frameTimes, List<Double> timeInSeconds) {
        if (timeInSeconds.size() >= 2) {
            double duration = timeInSeconds.get(timeInSeconds.size() - 1) - timeInSeconds.get(0);

            if (duration > 0) {
                return frameTimes.size() / duration;
            }
        }

        double averageFrameTime = frameTimes.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Unable to calculate average FPS"));

        return 1000.0 / averageFrameTime;
    }

    private double percentile(List<Double> values, double percentile) {
        List<Double> sorted = values.stream()
                .filter(value -> !value.isNaN() && !value.isInfinite())
                .sorted(Comparator.naturalOrder())
                .toList();

        if (sorted.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Unable to calculate percentile");
        }

        double index = (percentile / 100.0) * (sorted.size() - 1);
        int lowerIndex = (int) Math.floor(index);
        int upperIndex = (int) Math.ceil(index);

        if (lowerIndex == upperIndex) {
            return sorted.get(lowerIndex);
        }

        double lowerValue = sorted.get(lowerIndex);
        double upperValue = sorted.get(upperIndex);
        double weight = index - lowerIndex;

        return lowerValue + ((upperValue - lowerValue) * weight);
    }

    private double fpsFromFrameTime(double frameTimeMs) {
        return 1000.0 / frameTimeMs;
    }

    private Integer countStutters(List<Double> frameTimes) {
        double median = percentile(frameTimes, 50);
        double stutterThreshold = median * 3.0;

        return (int) frameTimes.stream()
                .filter(frameTime -> frameTime > stutterThreshold)
                .count();
    }

    private Integer countDroppedFrames(List<Double> droppedFrames) {
        return (int) Math.round(
                droppedFrames.stream()
                        .mapToDouble(Double::doubleValue)
                        .sum()
        );
    }

    private Double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String sanitizeTag(String value) {
        return value
                .toUpperCase()
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }
}