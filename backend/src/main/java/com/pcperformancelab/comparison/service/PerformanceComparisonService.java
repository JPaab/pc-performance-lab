package com.pcperformancelab.comparison.service;

import com.pcperformancelab.comparison.dto.MetricComparison;
import com.pcperformancelab.comparison.dto.PerformanceComparisonResult;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.service.PerformanceSessionService;
import com.pcperformancelab.sensor.model.SensorSummary;
import com.pcperformancelab.sensor.service.SensorSummaryService;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class PerformanceComparisonService {

    private static final double FPS_MIN_ABSOLUTE_CHANGE = 1.0;
    private static final double FPS_MIN_PERCENTAGE_CHANGE = 1.0;

    private static final double LOW_FPS_MIN_ABSOLUTE_CHANGE = 1.0;
    private static final double LOW_FPS_MIN_PERCENTAGE_CHANGE = 2.0;

    private static final double FRAME_TIME_MIN_ABSOLUTE_CHANGE = 0.15;
    private static final double FRAME_TIME_MIN_PERCENTAGE_CHANGE = 2.0;

    private static final double TEMP_MIN_ABSOLUTE_CHANGE = 2.0;
    private static final double TEMP_MIN_PERCENTAGE_CHANGE = 0.0;

    private static final double POWER_MIN_ABSOLUTE_CHANGE = 3.0;
    private static final double POWER_MIN_PERCENTAGE_CHANGE = 2.0;

    private static final double CLOCK_MIN_ABSOLUTE_CHANGE = 50.0;
    private static final double CLOCK_MIN_PERCENTAGE_CHANGE = 1.0;

    private static final double LOAD_MIN_ABSOLUTE_CHANGE = 3.0;
    private static final double LOAD_MIN_PERCENTAGE_CHANGE = 0.0;

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

        metrics.add(compareHigherIsBetter(
                "Average FPS",
                baseline.getAverageFps(),
                comparison.getAverageFps(),
                "fps",
                FPS_MIN_ABSOLUTE_CHANGE,
                FPS_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareHigherIsBetter(
                "1% Low FPS",
                baseline.getOnePercentLowFps(),
                comparison.getOnePercentLowFps(),
                "fps",
                LOW_FPS_MIN_ABSOLUTE_CHANGE,
                LOW_FPS_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareHigherIsBetter(
                "0.1% Low FPS",
                baseline.getZeroPointOnePercentLowFps(),
                comparison.getZeroPointOnePercentLowFps(),
                "fps",
                LOW_FPS_MIN_ABSOLUTE_CHANGE,
                LOW_FPS_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "P95 Frame Time",
                baseline.getP95FrameTimeMs(),
                comparison.getP95FrameTimeMs(),
                "ms",
                FRAME_TIME_MIN_ABSOLUTE_CHANGE,
                FRAME_TIME_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "P99 Frame Time",
                baseline.getP99FrameTimeMs(),
                comparison.getP99FrameTimeMs(),
                "ms",
                FRAME_TIME_MIN_ABSOLUTE_CHANGE,
                FRAME_TIME_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "P99.9 Frame Time",
                baseline.getP999FrameTimeMs(),
                comparison.getP999FrameTimeMs(),
                "ms",
                FRAME_TIME_MIN_ABSOLUTE_CHANGE,
                FRAME_TIME_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "Stutter / Hitch Events",
                toDouble(baseline.getStutterCount()),
                toDouble(comparison.getStutterCount()),
                "count",
                1.0,
                0.0
        ));

        metrics.add(compareLowerIsBetter(
                "Dropped Frames",
                toDouble(baseline.getDroppedFrames()),
                toDouble(comparison.getDroppedFrames()),
                "frames",
                1.0,
                0.0
        ));

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

        metrics.add(compareLowerIsBetter(
                "CPU Package Temp Max",
                baseline.getCpuPackageTempMax(),
                comparison.getCpuPackageTempMax(),
                "°C",
                TEMP_MIN_ABSOLUTE_CHANGE,
                TEMP_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "CPU Core Max Temp",
                baseline.getCpuCoreMaxTempMax(),
                comparison.getCpuCoreMaxTempMax(),
                "°C",
                TEMP_MIN_ABSOLUTE_CHANGE,
                TEMP_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "CPU Package Power Avg",
                baseline.getCpuPackagePowerAvg(),
                comparison.getCpuPackagePowerAvg(),
                "W",
                POWER_MIN_ABSOLUTE_CHANGE,
                POWER_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "CPU Package Power Max",
                baseline.getCpuPackagePowerMax(),
                comparison.getCpuPackagePowerMax(),
                "W",
                POWER_MIN_ABSOLUTE_CHANGE,
                POWER_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareInformational(
                "CPU P-core Clock Avg",
                baseline.getCpuPcoreClockAvg(),
                comparison.getCpuPcoreClockAvg(),
                "MHz"
        ));

        metrics.add(compareInformational(
                "CPU E-core Clock Avg",
                baseline.getCpuEcoreClockAvg(),
                comparison.getCpuEcoreClockAvg(),
                "MHz"
        ));

        metrics.add(compareInformational(
                "CPU Ring Clock Avg",
                baseline.getCpuRingClockAvg(),
                comparison.getCpuRingClockAvg(),
                "MHz"
        ));

        metrics.add(compareInformational(
                "CPU Effective Clock Avg",
                baseline.getCpuAverageEffectiveClockAvg(),
                comparison.getCpuAverageEffectiveClockAvg(),
                "MHz"
        ));

        metrics.add(compareInformational(
                "CPU Usage Avg",
                baseline.getTotalCpuUsageAvg(),
                comparison.getTotalCpuUsageAvg(),
                "%"
        ));

        metrics.add(compareLowerIsBetter(
                "GPU Temp Max",
                baseline.getGpuTemperatureMax(),
                comparison.getGpuTemperatureMax(),
                "°C",
                TEMP_MIN_ABSOLUTE_CHANGE,
                TEMP_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "GPU Hotspot Temp Max",
                baseline.getGpuHotSpotTemperatureMax(),
                comparison.getGpuHotSpotTemperatureMax(),
                "°C",
                TEMP_MIN_ABSOLUTE_CHANGE,
                TEMP_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "GPU Memory Junction Temp Max",
                baseline.getGpuMemoryJunctionTemperatureMax(),
                comparison.getGpuMemoryJunctionTemperatureMax(),
                "°C",
                TEMP_MIN_ABSOLUTE_CHANGE,
                TEMP_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "GPU Power Avg",
                baseline.getGpuPowerAvg(),
                comparison.getGpuPowerAvg(),
                "W",
                POWER_MIN_ABSOLUTE_CHANGE,
                POWER_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareLowerIsBetter(
                "GPU Power Max",
                baseline.getGpuPowerMax(),
                comparison.getGpuPowerMax(),
                "W",
                POWER_MIN_ABSOLUTE_CHANGE,
                POWER_MIN_PERCENTAGE_CHANGE
        ));

        metrics.add(compareInformational(
                "GPU Effective Clock Avg",
                baseline.getGpuEffectiveClockAvg(),
                comparison.getGpuEffectiveClockAvg(),
                "MHz"
        ));

        metrics.add(compareInformational(
                "GPU Core Clock Avg",
                baseline.getGpuClockAvg(),
                comparison.getGpuClockAvg(),
                "MHz"
        ));

        metrics.add(compareInformational(
                "GPU Core Load Avg",
                baseline.getGpuCoreLoadAvg(),
                comparison.getGpuCoreLoadAvg(),
                "%"
        ));

        metrics.add(compareInformational(
                "RAM Load Avg",
                baseline.getPhysicalMemoryLoadAvg(),
                comparison.getPhysicalMemoryLoadAvg(),
                "%"
        ));

        metrics.add(compareLowerIsBetter(
                "CPU Thermal Throttling",
                toFlagValue(baseline.getCpuThermalThrottlingDetected()),
                toFlagValue(comparison.getCpuThermalThrottlingDetected()),
                "",
                1.0,
                0.0
        ));

        metrics.add(compareLowerIsBetter(
                "CPU Power Limit",
                toFlagValue(baseline.getCpuPowerLimitDetected()),
                toFlagValue(comparison.getCpuPowerLimitDetected()),
                "",
                1.0,
                0.0
        ));

        metrics.add(compareLowerIsBetter(
                "CPU Limit Reasons",
                toFlagValue(baseline.getCpuLimitReasonsDetected()),
                toFlagValue(comparison.getCpuLimitReasonsDetected()),
                "",
                1.0,
                0.0
        ));

        metrics.add(compareLowerIsBetter(
                "GPU Thermal Limit",
                toFlagValue(baseline.getGpuThermalLimitDetected()),
                toFlagValue(comparison.getGpuThermalLimitDetected()),
                "",
                1.0,
                0.0
        ));

        metrics.add(compareInformational(
                "GPU Power Limit",
                toFlagValue(baseline.getGpuPowerLimitDetected()),
                toFlagValue(comparison.getGpuPowerLimitDetected()),
                ""
        ));

        metrics.add(compareInformational(
                "GPU Reliability Voltage Limit",
                toFlagValue(baseline.getGpuReliabilityVoltageLimitDetected()),
                toFlagValue(comparison.getGpuReliabilityVoltageLimitDetected()),
                ""
        ));

        metrics.add(compareInformational(
                "GPU Max Operating Voltage Limit",
                toFlagValue(baseline.getGpuMaxOperatingVoltageLimitDetected()),
                toFlagValue(comparison.getGpuMaxOperatingVoltageLimitDetected()),
                ""
        ));

        metrics.add(compareInformational(
                "GPU Utilization Limit",
                toFlagValue(baseline.getGpuUtilizationLimitDetected()),
                toFlagValue(comparison.getGpuUtilizationLimitDetected()),
                ""
        ));

        return metrics;
    }

    private MetricComparison compareHigherIsBetter(
            String metricName,
            Double baselineValue,
            Double comparisonValue,
            String unit,
            double minimumAbsoluteChange,
            double minimumPercentageChange
    ) {
        return compare(
                metricName,
                baselineValue,
                comparisonValue,
                unit,
                true,
                minimumAbsoluteChange,
                minimumPercentageChange
        );
    }

    private MetricComparison compareLowerIsBetter(
            String metricName,
            Double baselineValue,
            Double comparisonValue,
            String unit,
            double minimumAbsoluteChange,
            double minimumPercentageChange
    ) {
        return compare(
                metricName,
                baselineValue,
                comparisonValue,
                unit,
                false,
                minimumAbsoluteChange,
                minimumPercentageChange
        );
    }

    private MetricComparison compareInformational(
            String metricName,
            Double baselineValue,
            Double comparisonValue,
            String unit
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
        Double percentageChange = calculatePercentageChange(baselineValue, absoluteChange);

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
            boolean higherIsBetter,
            double minimumAbsoluteChange,
            double minimumPercentageChange
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
        Double percentageChange = calculatePercentageChange(baselineValue, absoluteChange);

        String verdict = calculateVerdict(
                absoluteChange,
                percentageChange,
                higherIsBetter,
                minimumAbsoluteChange,
                minimumPercentageChange
        );

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

    private String calculateVerdict(
            double absoluteChange,
            Double percentageChange,
            boolean higherIsBetter,
            double minimumAbsoluteChange,
            double minimumPercentageChange
    ) {
        if (Math.abs(absoluteChange) < minimumAbsoluteChange) {
            return "UNCHANGED";
        }

        if (
                percentageChange != null
                        && minimumPercentageChange > 0
                        && Math.abs(percentageChange) < minimumPercentageChange
        ) {
            return "UNCHANGED";
        }

        if (higherIsBetter) {
            return absoluteChange > 0 ? "IMPROVED" : "REGRESSED";
        }

        return absoluteChange < 0 ? "IMPROVED" : "REGRESSED";
    }

    private Double calculatePercentageChange(Double baselineValue, double absoluteChange) {
        if (baselineValue == null || baselineValue == 0) {
            return null;
        }

        return (absoluteChange / baselineValue) * 100;
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

        MetricComparison onePercentLow = findMetric(performanceMetrics, "1% Low FPS");
        MetricComparison zeroPointOneLow = findMetric(performanceMetrics, "0.1% Low FPS");
        MetricComparison p99 = findMetric(performanceMetrics, "P99 Frame Time");
        MetricComparison droppedFrames = findMetric(performanceMetrics, "Dropped Frames");

        boolean lowsImproved = isImproved(onePercentLow) || isImproved(zeroPointOneLow);
        boolean lowsRegressed = isRegressed(onePercentLow) || isRegressed(zeroPointOneLow);
        boolean pacingImproved = isImproved(p99);
        boolean pacingRegressed = isRegressed(p99);
        boolean dropsRegressed = isRegressed(droppedFrames);

        if (dropsRegressed) {
            return "The candidate introduces dropped frames. Treat it as worse unless another capture proves otherwise.";
        }

        if ((lowsImproved || pacingImproved) && sensorRegressed > sensorImproved) {
            return "The candidate improves feel metrics, but it costs more heat, power or limiter risk.";
        }

        if (lowsImproved && pacingImproved) {
            return "The candidate improves lows and frame pacing. This is the strongest kind of win.";
        }

        if (lowsImproved || pacingImproved) {
            return "The candidate improves at least one key feel metric. Validate with another run.";
        }

        if (lowsRegressed || pacingRegressed) {
            return "The candidate regresses lows or frame pacing. The baseline looks safer.";
        }

        if (performanceImproved > performanceRegressed) {
            return "The candidate shows a small performance advantage.";
        }

        if (performanceRegressed > performanceImproved) {
            return "The candidate shows a small performance regression.";
        }

        return "The result is mixed or close enough that another run is needed.";
    }

    private MetricComparison findMetric(List<MetricComparison> metrics, String metricName) {
        return metrics.stream()
                .filter(metric -> metricName.equals(metric.metricName()))
                .findFirst()
                .orElse(null);
    }

    private boolean isImproved(MetricComparison metric) {
        return metric != null && "IMPROVED".equals(metric.verdict());
    }

    private boolean isRegressed(MetricComparison metric) {
        return metric != null && "REGRESSED".equals(metric.verdict());
    }

    private long countVerdict(List<MetricComparison> metrics, String verdict) {
        return metrics.stream()
                .filter(metric -> verdict.equals(metric.verdict()))
                .count();
    }

    private Double toDouble(Integer value) {
        return value == null ? null : value.doubleValue();
    }

    private Double toFlagValue(Boolean value) {
        return Boolean.TRUE.equals(value) ? 1.0 : 0.0;
    }
}