package com.pcperformancelab.performance.dto;

import com.pcperformancelab.performance.model.MetricSource;

import java.time.Instant;
import java.util.List;

public record PerformanceSessionResponse(
        Long id,
        Long snapshotId,
        String snapshotName,
        Long buildId,
        String buildName,
        String gameName,
        String scenario,
        MetricSource sourceType,
        Integer durationSeconds,
        Double averageFps,
        Double onePercentLowFps,
        Double zeroPointOnePercentLowFps,
        Double p95FrameTimeMs,
        Double p99FrameTimeMs,
        Double p999FrameTimeMs,
        Integer stutterCount,
        Integer droppedFrames,
        Boolean hasSensorSummary,
        List<String> tags,
        String notes,
        Instant createdAt
) {
}