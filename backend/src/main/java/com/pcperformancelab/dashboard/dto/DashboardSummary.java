package com.pcperformancelab.dashboard.dto;

import java.time.Instant;

public record DashboardSummary(
        long buildCount,
        long snapshotCount,
        long sessionCount,
        long sensorSummaryCount,
        BuildSummary latestBuild,
        SnapshotSummary latestSnapshot,
        SessionSummary latestSession,
        SensorSummaryInfo latestSensorSummary,
        SessionSummary bestAverageFpsSession
) {

    public record BuildSummary(
            Long id,
            String name,
            String cpu,
            String gpu,
            Integer ramGb,
            Instant createdAt
    ) {
    }

    public record SnapshotSummary(
            Long id,
            Long buildId,
            String name,
            String cpuOverclock,
            String ramProfile,
            String operatingSystemProfile,
            String gpuDriver,
            Instant createdAt
    ) {
    }

    public record SessionSummary(
            Long id,
            Long snapshotId,
            String gameName,
            String scenario,
            String sourceType,
            Double averageFps,
            Double onePercentLowFps,
            Double p99FrameTimeMs,
            Integer stutterCount,
            Integer droppedFrames,
            Instant createdAt
    ) {
    }

    public record SensorSummaryInfo(
            Long id,
            Long sessionId,
            String sourceType,
            Integer sampleCount,
            Double cpuPackageTempAvg,
            Double cpuPackageTempMax,
            Double gpuTemperatureAvg,
            Double gpuTemperatureMax,
            Double gpuPowerAvg,
            Double gpuPowerMax,
            Instant createdAt
    ) {
    }
}