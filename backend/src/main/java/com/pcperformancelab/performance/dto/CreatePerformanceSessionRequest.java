package com.pcperformancelab.performance.dto;

import com.pcperformancelab.performance.model.MetricSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record CreatePerformanceSessionRequest(
        @NotBlank(message = "Game name is required")
        String gameName,

        String scenario,

        MetricSource sourceType,

        @Positive(message = "Duration must be greater than zero")
        Integer durationSeconds,

        @Positive(message = "Average FPS must be greater than zero")
        Double averageFps,

        @Positive(message = "1% low FPS must be greater than zero")
        Double onePercentLowFps,

        @Positive(message = "0.1% low FPS must be greater than zero")
        Double zeroPointOnePercentLowFps,

        @Positive(message = "P95 frame time must be greater than zero")
        Double p95FrameTimeMs,

        @Positive(message = "P99 frame time must be greater than zero")
        Double p99FrameTimeMs,

        @Positive(message = "P99.9 frame time must be greater than zero")
        Double p999FrameTimeMs,

        @PositiveOrZero(message = "Stutter count cannot be negative")
        Integer stutterCount,

        @PositiveOrZero(message = "Dropped frames cannot be negative")
        Integer droppedFrames,

        List<String> tags,

        String notes
) {
}