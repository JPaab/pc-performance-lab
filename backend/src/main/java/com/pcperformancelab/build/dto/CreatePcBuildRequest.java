package com.pcperformancelab.build.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreatePcBuildRequest(
        @NotBlank(message = "Build name is required")
        String name,

        @NotBlank(message = "CPU is required")
        String cpu,

        @NotBlank(message = "GPU is required")
        String gpu,

        @Positive(message = "RAM amount must be greater than zero")
        Integer ramGb,

        String motherboard,
        String storage,
        String monitor,
        String operatingSystem,
        String gpuDriver
) {
}