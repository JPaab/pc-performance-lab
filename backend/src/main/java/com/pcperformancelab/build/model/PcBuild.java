package com.pcperformancelab.build.model;

import java.time.Instant;

public record PcBuild(
        Long id,
        String name,
        String cpu,
        String gpu,
        Integer ramGb,
        String motherboard,
        String storage,
        String monitor,
        String operatingSystem,
        String gpuDriver,
        Instant createdAt
) {
}