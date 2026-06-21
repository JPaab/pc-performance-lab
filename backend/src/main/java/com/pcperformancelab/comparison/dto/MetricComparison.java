package com.pcperformancelab.comparison.dto;

public record MetricComparison(
        String metricName,
        Double baselineValue,
        Double comparisonValue,
        Double absoluteChange,
        Double percentageChange,
        String unit,
        String verdict
) {
}

