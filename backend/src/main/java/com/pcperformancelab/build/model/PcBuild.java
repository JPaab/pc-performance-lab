package com.pcperformancelab.build.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "pc_builds")
public class PcBuild {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String cpu;

    @Column(nullable = false)
    private String gpu;

    @Column(nullable = false)
    private Integer ramGb;

    private String motherboard;
    private String storage;
    private String monitor;
    private String operatingSystem;
    private String gpuDriver;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected PcBuild() {
    }

    public PcBuild(
            String name,
            String cpu,
            String gpu,
            Integer ramGb,
            String motherboard,
            String storage,
            String monitor,
            String operatingSystem,
            String gpuDriver
    ) {
        this.name = name;
        this.cpu = cpu;
        this.gpu = gpu;
        this.ramGb = ramGb;
        this.motherboard = motherboard;
        this.storage = storage;
        this.monitor = monitor;
        this.operatingSystem = operatingSystem;
        this.gpuDriver = gpuDriver;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCpu() {
        return cpu;
    }

    public String getGpu() {
        return gpu;
    }

    public Integer getRamGb() {
        return ramGb;
    }

    public String getMotherboard() {
        return motherboard;
    }

    public String getStorage() {
        return storage;
    }

    public String getMonitor() {
        return monitor;
    }

    public String getOperatingSystem() {
        return operatingSystem;
    }

    public String getGpuDriver() {
        return gpuDriver;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}