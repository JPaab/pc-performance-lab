package com.pcperformancelab.comparison.service;

import com.pcperformancelab.comparison.dto.MetricComparison;
import com.pcperformancelab.comparison.dto.PerformanceComparisonResult;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.service.PerformanceSessionService;
import com.pcperformancelab.sensor.model.SensorSummary;
import com.pcperformancelab.sensor.service.SensorSummaryService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PerformanceComparisonService {

    private static final double CHANGE_THRESHOLD = 0.01;

    private final PerformanceSessionService performanceSessionService;
    private final SensorSummaryService sensorSummaryService;

    public PerformanceComparisonService(
            PerformanceSessionService performanceSessionService,
            SensorSummaryService sensorSummaryService
    ) {
        this.performanceSessionService = performanceSessionService;
        this.sensorSummaryService = sensorSummaryService;
    }

    public PerformanceComparisonResult compare(Long baselineSessionId, Long comparisonSessionId) {
        PerformanceSession baseline = performanceSessionService.findById(baselineSessionId);
        PerformanceSession comparison = performanceSessionService.findById(comparisonSessionId);

        List<MetricComparison> performanceMetrics = buildPerformanceMetrics(baseline, comparison);
        List<MetricComparison> sensorMetrics = buildSensorMetrics(baselineSessionId, comparisonSessionId);

        return new PerformanceComparisonResult(
                baseline.getId(),
                comparison.getId(),
                buildLabel(baseline),
                buildLabel(comparison),
                performanceMetrics,
                sensorMetrics,
                buildSummary(performanceMetrics, sensorMetrics)
        );
    }

    private List<MetricComparison> buildPerformanceMetrics(
            PerformanceSession baseline,
            PerformanceSession comparison
    ) {
        List<MetricComparison> metrics = new ArrayList<>();

        metrics.add(compareHigherIsBetter("Average FPS", baseline.getAverageFps(), comparison.getAverageFps(), "fps"));
        metrics.add(compareHigherIsBetter("1% Low FPS", baseline.getOnePercentLowFps(), comparison.getOnePercentLowFps(), "fps"));
        metrics.add(compareHigherIsBetter("0.1% Low FPS", baseline.getZeroPointOnePercentLowFps(), comparison.getZeroPointOnePercentLowFps(), "fps"));

        metrics.add(compareLowerIsBetter("P95 Frame Time", baseline.getP95FrameTimeMs(), comparison.getP95FrameTimeMs(), "ms"));
        metrics.add(compareLowerIsBetter("P99 Frame Time", baseline.getP99FrameTimeMs(), comparison.getP99FrameTimeMs(), "ms"));
        metrics.add(compareLowerIsBetter("P99.9 Frame Time", baseline.getP999FrameTimeMs(), comparison.getP999FrameTimeMs(), "ms"));

        metrics.add(compareLowerIsBetter("Stutter Count", toDouble(baseline.getStutterCount()), toDouble(comparison.getStutterCount()), "count"));
        metrics.add(compareLowerIsBetter("Dropped Frames", toDouble(baseline.getDroppedFrames()), toDouble(comparison.getDroppedFrames()), "frames"));

        return metrics;
    }

    private List<MetricComparison> buildSensorMetrics(Long baselineSessionId, Long comparisonSessionId) {
        Optional<SensorSummary> baselineSummary = sensorSummaryService.findLatestBySessionId(baselineSessionId);
        Optional<SensorSummary> comparisonSummary = sensorSummaryService.findLatestBySessionId(comparisonSessionId);

        if (baselineSummary.isEmpty() || comparisonSummary.isEmpty()) {
            return List.of();
        }

        SensorSummary baseline = baselineSummary.get();
        SensorSummary comparison = comparisonSummary.get();

        List<MetricComparison> metrics = new ArrayList<>();

        metrics.add(compareLowerIsBetter("CPU Package Temp Avg", baseline.getCpuPackageTempAvg(), comparison.getCpuPackageTempAvg(), "°C"));
        metrics.add(compareLowerIsBetter("CPU Package Temp Max", baseline.getCpuPackageTempMax(), comparison.getCpuPackageTempMax(), "°C"));
        metrics.add(compareLowerIsBetter("CPU Package Power Avg", baseline.getCpuPackagePowerAvg(), comparison.getCpuPackagePowerAvg(), "W"));
        metrics.add(compareLowerIsBetter("CPU Package Power Max", baseline.getCpuPackagePowerMax(), comparison.getCpuPackagePowerMax(), "W"));

        metrics.add(compareLowerIsBetter("GPU Temp Avg", baseline.getGpuTemperatureAvg(), comparison.getGpuTemperatureAvg(), "°C"));
        metrics.add(compareLowerIsBetter("GPU Temp Max", baseline.getGpuTemperatureMax(), comparison.getGpuTemperatureMax(), "°C"));
        metrics.add(compareLowerIsBetter("GPU Hotspot Temp Avg", baseline.getGpuHotSpotTemperatureAvg(), comparison.getGpuHotSpotTemperatureAvg(), "°C"));
        metrics.add(compareLowerIsBetter("GPU Hotspot Temp Max", baseline.getGpuHotSpotTemperatureMax(), comparison.getGpuHotSpotTemperatureMax(), "°C"));
        metrics.add(compareLowerIsBetter("GPU Power Avg", baseline.getGpuPowerAvg(), comparison.getGpuPowerAvg(), "W"));
        metrics.add(compareLowerIsBetter("GPU Power Max", baseline.getGpuPowerMax(), comparison.getGpuPowerMax(), "W"));

        metrics.add(compareInformational("GPU Clock Avg", baseline.getGpuClockAvg(), comparison.getGpuClockAvg(), "MHz"));
        metrics.add(compareInformational("GPU Core Load Avg", baseline.getGpuCoreLoadAvg(), comparison.getGpuCoreLoadAvg(), "%"));
        metrics.add(compareInformational("Physical Memory Load Avg", baseline.getPhysicalMemoryLoadAvg(), comparison.getPhysicalMemoryLoadAvg(), "%"));

        return metrics;
    }

    private MetricComparison compareHigherIsBetter(String metricName, Double baselineValue, Double comparisonValue, String unit) {
        return compare(metricName, baselineValue, comparisonValue, unit, true);
    }

    private MetricComparison compareLowerIsBetter(String metricName, Double baselineValue, Double comparisonValue, String unit) {
        return compare(metricName, baselineValue, comparisonValue, unit, false);
    }

    private MetricComparison compareInformational(String metricName, Double baselineValue, Double comparisonValue, String unit) {
        if (baselineValue == null || comparisonValue == null) {
            return new MetricComparison(
                    metricName,
                    baselineValue,
                    comparisonValue,
                    null,
                    null,
                    unit,
                    "NO_DATA"
            );
        }

        double absoluteChange = comparisonValue - baselineValue;
        Double percentageChange = baselineValue == 0
                ? null
                : (absoluteChange / baselineValue) * 100;

        return new MetricComparison(
                metricName,
                baselineValue,
                comparisonValue,
                absoluteChange,
                percentageChange,
                unit,
                "INFO"
        );
    }

    private MetricComparison compare(
            String metricName,
            Double baselineValue,
            Double comparisonValue,
            String unit,
            boolean higherIsBetter
    ) {
        if (baselineValue == null || comparisonValue == null) {
            return new MetricComparison(
                    metricName,
                    baselineValue,
                    comparisonValue,
                    null,
                    null,
                    unit,
                    "NO_DATA"
            );
        }

        double absoluteChange = comparisonValue - baselineValue;
        Double percentageChange = baselineValue == 0
                ? null
                : (absoluteChange / baselineValue) * 100;

        String verdict = calculateVerdict(absoluteChange, higherIsBetter);

        return new MetricComparison(
                metricName,
                baselineValue,
                comparisonValue,
                absoluteChange,
                percentageChange,
                unit,
                verdict
        );
    }

    private String calculateVerdict(double absoluteChange, boolean higherIsBetter) {
        if (Math.abs(absoluteChange) < CHANGE_THRESHOLD) {
            return "UNCHANGED";
        }

        if (higherIsBetter) {
            return absoluteChange > 0 ? "IMPROVED" : "REGRESSED";
        }

        return absoluteChange < 0 ? "IMPROVED" : "REGRESSED";
    }

    private String buildLabel(PerformanceSession session) {
        if (session.getScenario() == null || session.getScenario().isBlank()) {
            return session.getGameName();
        }

        return session.getGameName() + " - " + session.getScenario();
    }

    private String buildSummary(
            List<MetricComparison> performanceMetrics,
            List<MetricComparison> sensorMetrics
    ) {
        long performanceImproved = countVerdict(performanceMetrics, "IMPROVED");
        long performanceRegressed = countVerdict(performanceMetrics, "REGRESSED");

        long sensorImproved = countVerdict(sensorMetrics, "IMPROVED");
        long sensorRegressed = countVerdict(sensorMetrics, "REGRESSED");

        if (performanceImproved > performanceRegressed && sensorRegressed > sensorImproved) {
            return "The comparison session improves performance, but sensor data shows higher temperatures or power usage.";
        }

        if (performanceImproved > performanceRegressed) {
            return "The comparison session shows an overall performance improvement.";
        }

        if (performanceRegressed > performanceImproved) {
            return "The comparison session shows an overall performance regression.";
        }

        return "The comparison session shows mixed or neutral performance results.";
    }

    private long countVerdict(List<MetricComparison> metrics, String verdict) {
        return metrics.stream()
                .filter(metric -> verdict.equals(metric.verdict()))
                .count();
    }

    private Double toDouble(Integer value) {
        return value == null ? null : value.doubleValue();
    }
}