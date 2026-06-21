package com.pcperformancelab.comparison.dto;

import java.util.List;

public record PerformanceComparisonResult(
        Long baselineSessionId,
        Long comparisonSessionId,
        String baselineLabel,
        String comparisonLabel,
        List<MetricComparison> metrics,
        String summary
) {
}