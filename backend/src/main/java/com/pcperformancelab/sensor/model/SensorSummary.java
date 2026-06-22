package com.pcperformancelab.sensor.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pcperformancelab.performance.model.PerformanceSession;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class SensorSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private PerformanceSession session;

    private String sourceType;

    private Integer sampleCount;

    private Double cpuPackageTempAvg;
    private Double cpuPackageTempMax;
    private Double cpuCoreMaxTempMax;

    private Double cpuPackagePowerAvg;
    private Double cpuPackagePowerMax;

    private Double totalCpuUsageAvg;

    private Double physicalMemoryLoadAvg;
    private Double physicalMemoryLoadMax;

    private Double gpuTemperatureAvg;
    private Double gpuTemperatureMax;

    private Double gpuHotSpotTemperatureAvg;
    private Double gpuHotSpotTemperatureMax;

    private Double gpuPowerAvg;
    private Double gpuPowerMax;

    private Double gpuClockAvg;
    private Double gpuClockMax;

    private Double gpuMemoryClockAvg;

    private Double gpuCoreLoadAvg;
    private Double gpuCoreLoadMax;

    private Double gpuMemoryUsageAvg;
    private Double gpuMemoryUsageMax;

    private Double gpuMemoryJunctionTemperatureAvg;
    private Double gpuMemoryJunctionTemperatureMax;

    private Double gpuEffectiveClockAvg;
    private Double gpuEffectiveClockMax;

    private Double cpuAverageEffectiveClockAvg;
    private Double cpuAverageEffectiveClockMax;

    private Boolean cpuThermalThrottlingDetected = false;
    private Boolean cpuPowerLimitDetected = false;
    private Boolean cpuLimitReasonsDetected = false;

    private Boolean gpuPerformanceLimitDetected = false;
    private Boolean gpuPowerLimitDetected = false;
    private Boolean gpuThermalLimitDetected = false;
    private Boolean gpuReliabilityVoltageLimitDetected = false;
    private Boolean gpuMaxOperatingVoltageLimitDetected = false;
    private Boolean gpuUtilizationLimitDetected = false;

    private Instant createdAt;

    public Long getSessionId() {
        return session != null ? session.getId() : null;
    }

    @PrePersist
    void onCreate() {
        if (sourceType == null || sourceType.isBlank()) {
            sourceType = "HWINFO_CSV";
        }

        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}