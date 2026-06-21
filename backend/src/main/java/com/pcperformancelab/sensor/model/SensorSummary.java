package com.pcperformancelab.sensor.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.sensor.dto.SensorSummaryData;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "sensor_summaries")
public class SensorSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PerformanceSession session;

    @Column(nullable = false)
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

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected SensorSummary() {
    }

    public SensorSummary(PerformanceSession session, String sourceType, SensorSummaryData data) {
        this.session = session;
        this.sourceType = sourceType;
        this.sampleCount = data.sampleCount();

        this.cpuPackageTempAvg = data.cpuPackageTempAvg();
        this.cpuPackageTempMax = data.cpuPackageTempMax();
        this.cpuCoreMaxTempMax = data.cpuCoreMaxTempMax();
        this.cpuPackagePowerAvg = data.cpuPackagePowerAvg();
        this.cpuPackagePowerMax = data.cpuPackagePowerMax();
        this.totalCpuUsageAvg = data.totalCpuUsageAvg();
        this.physicalMemoryLoadAvg = data.physicalMemoryLoadAvg();
        this.physicalMemoryLoadMax = data.physicalMemoryLoadMax();

        this.gpuTemperatureAvg = data.gpuTemperatureAvg();
        this.gpuTemperatureMax = data.gpuTemperatureMax();
        this.gpuHotSpotTemperatureAvg = data.gpuHotSpotTemperatureAvg();
        this.gpuHotSpotTemperatureMax = data.gpuHotSpotTemperatureMax();
        this.gpuPowerAvg = data.gpuPowerAvg();
        this.gpuPowerMax = data.gpuPowerMax();
        this.gpuClockAvg = data.gpuClockAvg();
        this.gpuClockMax = data.gpuClockMax();
        this.gpuMemoryClockAvg = data.gpuMemoryClockAvg();
        this.gpuCoreLoadAvg = data.gpuCoreLoadAvg();
        this.gpuCoreLoadMax = data.gpuCoreLoadMax();
        this.gpuMemoryUsageAvg = data.gpuMemoryUsageAvg();
        this.gpuMemoryUsageMax = data.gpuMemoryUsageMax();
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getSessionId() {
        return session.getId();
    }

    public String getSourceType() {
        return sourceType;
    }

    public Integer getSampleCount() {
        return sampleCount;
    }

    public Double getCpuPackageTempAvg() {
        return cpuPackageTempAvg;
    }

    public Double getCpuPackageTempMax() {
        return cpuPackageTempMax;
    }

    public Double getCpuCoreMaxTempMax() {
        return cpuCoreMaxTempMax;
    }

    public Double getCpuPackagePowerAvg() {
        return cpuPackagePowerAvg;
    }

    public Double getCpuPackagePowerMax() {
        return cpuPackagePowerMax;
    }

    public Double getTotalCpuUsageAvg() {
        return totalCpuUsageAvg;
    }

    public Double getPhysicalMemoryLoadAvg() {
        return physicalMemoryLoadAvg;
    }

    public Double getPhysicalMemoryLoadMax() {
        return physicalMemoryLoadMax;
    }

    public Double getGpuTemperatureAvg() {
        return gpuTemperatureAvg;
    }

    public Double getGpuTemperatureMax() {
        return gpuTemperatureMax;
    }

    public Double getGpuHotSpotTemperatureAvg() {
        return gpuHotSpotTemperatureAvg;
    }

    public Double getGpuHotSpotTemperatureMax() {
        return gpuHotSpotTemperatureMax;
    }

    public Double getGpuPowerAvg() {
        return gpuPowerAvg;
    }

    public Double getGpuPowerMax() {
        return gpuPowerMax;
    }

    public Double getGpuClockAvg() {
        return gpuClockAvg;
    }

    public Double getGpuClockMax() {
        return gpuClockMax;
    }

    public Double getGpuMemoryClockAvg() {
        return gpuMemoryClockAvg;
    }

    public Double getGpuCoreLoadAvg() {
        return gpuCoreLoadAvg;
    }

    public Double getGpuCoreLoadMax() {
        return gpuCoreLoadMax;
    }

    public Double getGpuMemoryUsageAvg() {
        return gpuMemoryUsageAvg;
    }

    public Double getGpuMemoryUsageMax() {
        return gpuMemoryUsageMax;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}