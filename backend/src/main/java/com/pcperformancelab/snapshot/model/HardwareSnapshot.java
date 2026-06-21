package com.pcperformancelab.snapshot.model;

import java.time.Instant;
import java.util.List;

public record HardwareSnapshot(
        Long id,
        Long buildId,
        String name,
        String cpuOverclock,
        String ramProfile,
        String ramTimings,
        Integer trfc,
        Integer trefi,
        String commandRate,
        String gearMode,
        String biosVersion,
        String operatingSystemProfile,
        String powerPlan,
        Boolean hagsEnabled,
        String gpuDriver,
        List<String> tweakTags,
        String notes,
        Instant createdAt
) {
}