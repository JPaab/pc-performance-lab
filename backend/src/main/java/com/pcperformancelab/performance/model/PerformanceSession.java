package com.pcperformancelab.performance.model;

import java.time.Instant;
import java.util.List;

public record PerformanceSession(
        Long id,
        Long snapshotId,
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
        List<String> tags,
        String notes,
        Instant createdAt
) {
}