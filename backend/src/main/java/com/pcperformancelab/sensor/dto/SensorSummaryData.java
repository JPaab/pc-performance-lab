package com.pcperformancelab.sensor.dto;

public record SensorSummaryData(
        Integer sampleCount,

        Double cpuPackageTempAvg,
        Double cpuPackageTempMax,
        Double cpuCoreMaxTempMax,
        Double cpuPackagePowerAvg,
        Double cpuPackagePowerMax,
        Double totalCpuUsageAvg,
        Double physicalMemoryLoadAvg,
        Double physicalMemoryLoadMax,

        Double gpuTemperatureAvg,
        Double gpuTemperatureMax,
        Double gpuHotSpotTemperatureAvg,
        Double gpuHotSpotTemperatureMax,
        Double gpuPowerAvg,
        Double gpuPowerMax,
        Double gpuClockAvg,
        Double gpuClockMax,
        Double gpuMemoryClockAvg,
        Double gpuCoreLoadAvg,
        Double gpuCoreLoadMax,
        Double gpuMemoryUsageAvg,
        Double gpuMemoryUsageMax
) {
}