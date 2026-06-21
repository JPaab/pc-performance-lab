package com.pcperformancelab.comparison.service;

import com.pcperformancelab.comparison.dto.MetricComparison;
import com.pcperformancelab.comparison.dto.PerformanceComparisonResult;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.service.PerformanceSessionService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PerformanceComparisonService {

    private static final double CHANGE_THRESHOLD = 0.01;

    private final PerformanceSessionService performanceSessionService;

    public PerformanceComparisonService(PerformanceSessionService performanceSessionService) {
        this.performanceSessionService = performanceSessionService;
    }

    public PerformanceComparisonResult compare(Long baselineSessionId, Long comparisonSessionId) {
        PerformanceSession baseline = performanceSessionService.findById(baselineSessionId);
        PerformanceSession comparison = performanceSessionService.findById(comparisonSessionId);

        List<MetricComparison> metrics = new ArrayList<>();

        metrics.add(compareHigherIsBetter("Average FPS", baseline.averageFps(), comparison.averageFps(), "fps"));
        metrics.add(compareHigherIsBetter("1% Low FPS", baseline.onePercentLowFps(), comparison.onePercentLowFps(), "fps"));
        metrics.add(compareHigherIsBetter("0.1% Low FPS", baseline.zeroPointOnePercentLowFps(), comparison.zeroPointOnePercentLowFps(), "fps"));

        metrics.add(compareLowerIsBetter("P95 Frame Time", baseline.p95FrameTimeMs(), comparison.p95FrameTimeMs(), "ms"));
        metrics.add(compareLowerIsBetter("P99 Frame Time", baseline.p99FrameTimeMs(), comparison.p99FrameTimeMs(), "ms"));
        metrics.add(compareLowerIsBetter("P99.9 Frame Time", baseline.p999FrameTimeMs(), comparison.p999FrameTimeMs(), "ms"));

        metrics.add(compareLowerIsBetter("Stutter Count", toDouble(baseline.stutterCount()), toDouble(comparison.stutterCount()), "count"));
        metrics.add(compareLowerIsBetter("Dropped Frames", toDouble(baseline.droppedFrames()), toDouble(comparison.droppedFrames()), "frames"));

        return new PerformanceComparisonResult(
                baseline.id(),
                comparison.id(),
                buildLabel(baseline),
                buildLabel(comparison),
                metrics,
                buildSummary(metrics)
        );
    }

    private MetricComparison compareHigherIsBetter(String metricName, Double baselineValue, Double comparisonValue, String unit) {
        return compare(metricName, baselineValue, comparisonValue, unit, true);
    }

    private MetricComparison compareLowerIsBetter(String metricName, Double baselineValue, Double comparisonValue, String unit) {
        return compare(metricName, baselineValue, comparisonValue, unit, false);
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
        if (session.scenario() == null || session.scenario().isBlank()) {
            return session.gameName();
        }

        return session.gameName() + " - " + session.scenario();
    }

    private String buildSummary(List<MetricComparison> metrics) {
        long improved = metrics.stream()
                .filter(metric -> "IMPROVED".equals(metric.verdict()))
                .count();

        long regressed = metrics.stream()
                .filter(metric -> "REGRESSED".equals(metric.verdict()))
                .count();

        if (improved > regressed) {
            return "The comparison session shows an overall improvement.";
        }

        if (regressed > improved) {
            return "The comparison session shows an overall regression.";
        }

        return "The comparison session shows mixed or neutral results.";
    }

    private Double toDouble(Integer value) {
        return value == null ? null : value.doubleValue();
    }
}