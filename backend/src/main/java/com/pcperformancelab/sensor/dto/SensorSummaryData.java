package com.pcperformancelab.sensor.dto;

public record SensorSummaryData(
        int sampleCount,

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
        Double gpuMemoryUsageMax,

        Double gpuMemoryJunctionTemperatureAvg,
        Double gpuMemoryJunctionTemperatureMax,
        Double gpuEffectiveClockAvg,
        Double gpuEffectiveClockMax,

        Double cpuAverageEffectiveClockAvg,
        Double cpuAverageEffectiveClockMax,
        Double cpuPcoreClockAvg,
        Double cpuPcoreClockMax,
        Double cpuEcoreClockAvg,
        Double cpuEcoreClockMax,
        Double cpuRingClockAvg,
        Double cpuRingClockMax,

        Boolean cpuThermalThrottlingDetected,
        Boolean cpuPowerLimitDetected,
        Boolean cpuLimitReasonsDetected,

        Boolean gpuPerformanceLimitDetected,
        Boolean gpuPowerLimitDetected,
        Boolean gpuThermalLimitDetected,
        Boolean gpuReliabilityVoltageLimitDetected,
        Boolean gpuMaxOperatingVoltageLimitDetected,
        Boolean gpuUtilizationLimitDetected
) {
}