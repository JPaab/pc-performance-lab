package com.pcperformancelab.snapshot.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateHardwareSnapshotRequest(
        @NotBlank(message = "Snapshot name is required")
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
        String notes
) {
}