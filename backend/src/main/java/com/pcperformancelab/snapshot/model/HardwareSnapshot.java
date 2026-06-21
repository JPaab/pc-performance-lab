package com.pcperformancelab.snapshot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pcperformancelab.build.model.PcBuild;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hardware_snapshots")
public class HardwareSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "build_id", nullable = false)
    private PcBuild build;

    @Column(nullable = false)
    private String name;

    private String cpuOverclock;
    private String ramProfile;
    private String ramTimings;
    private Integer trfc;
    private Integer trefi;
    private String commandRate;
    private String gearMode;
    private String biosVersion;
    private String operatingSystemProfile;
    private String powerPlan;
    private Boolean hagsEnabled;
    private String gpuDriver;

    @ElementCollection
    @CollectionTable(
            name = "hardware_snapshot_tags",
            joinColumns = @JoinColumn(name = "snapshot_id")
    )
    @Column(name = "tag")
    private List<String> tweakTags = new ArrayList<>();

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected HardwareSnapshot() {
    }

    public HardwareSnapshot(
            PcBuild build,
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
        this.build = build;
        this.name = name;
        this.cpuOverclock = cpuOverclock;
        this.ramProfile = ramProfile;
        this.ramTimings = ramTimings;
        this.trfc = trfc;
        this.trefi = trefi;
        this.commandRate = commandRate;
        this.gearMode = gearMode;
        this.biosVersion = biosVersion;
        this.operatingSystemProfile = operatingSystemProfile;
        this.powerPlan = powerPlan;
        this.hagsEnabled = hagsEnabled;
        this.gpuDriver = gpuDriver;
        this.tweakTags = tweakTags == null ? new ArrayList<>() : List.copyOf(tweakTags);
        this.notes = notes;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getBuildId() {
        return build.getId();
    }

    public String getName() {
        return name;
    }

    public String getCpuOverclock() {
        return cpuOverclock;
    }

    public String getRamProfile() {
        return ramProfile;
    }

    public String getRamTimings() {
        return ramTimings;
    }

    public Integer getTrfc() {
        return trfc;
    }

    public Integer getTrefi() {
        return trefi;
    }

    public String getCommandRate() {
        return commandRate;
    }

    public String getGearMode() {
        return gearMode;
    }

    public String getBiosVersion() {
        return biosVersion;
    }

    public String getOperatingSystemProfile() {
        return operatingSystemProfile;
    }

    public String getPowerPlan() {
        return powerPlan;
    }

    public Boolean getHagsEnabled() {
        return hagsEnabled;
    }

    public String getGpuDriver() {
        return gpuDriver;
    }

    public List<String> getTweakTags() {
        return tweakTags;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}