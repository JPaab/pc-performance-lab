package com.pcperformancelab.hardware.dto;

public record DetectedHardwareResponse(
        String name,
        String cpu,
        String gpu,
        Integer ramGb,
        String motherboard,
        String storage,
        String monitor,
        String operatingSystem,
        String gpuDriver,
        String biosVersion
) {
}