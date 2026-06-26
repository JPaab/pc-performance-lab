package com.pcperformancelab.performance.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "performance_sessions")
public class PerformanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private HardwareSnapshot snapshot;

    @Column(nullable = false)
    private String gameName;

    private String scenario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetricSource sourceType;

    private Integer durationSeconds;
    private Double averageFps;
    private Double onePercentLowFps;
    private Double zeroPointOnePercentLowFps;
    private Double p95FrameTimeMs;
    private Double p99FrameTimeMs;
    private Double p999FrameTimeMs;
    private Integer stutterCount;
    private Integer droppedFrames;

    @ElementCollection
    @CollectionTable(
            name = "performance_session_tags",
            joinColumns = @JoinColumn(name = "session_id")
    )
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected PerformanceSession() {
    }

    public PerformanceSession(
            HardwareSnapshot snapshot,
            String gameName,
            String scenario,
            MetricSource sourceType,
            Integer durationSeconds,
            Double averageFps,
            Double onePercentLowFps,
            Double zeroPointOnePercentLowFps,
            Double p95FrameTimeMs,
            Double p99FrameTimeMs,
            Double p999FrameTimeMs,
            Integer stutterCount,
            Integer droppedFrames,
            List<String> tags,
            String notes
    ) {
        this.snapshot = snapshot;
        this.gameName = gameName;
        this.scenario = scenario;
        this.sourceType = sourceType == null ? MetricSource.MANUAL : sourceType;
        this.durationSeconds = durationSeconds;
        this.averageFps = averageFps;
        this.onePercentLowFps = onePercentLowFps;
        this.zeroPointOnePercentLowFps = zeroPointOnePercentLowFps;
        this.p95FrameTimeMs = p95FrameTimeMs;
        this.p99FrameTimeMs = p99FrameTimeMs;
        this.p999FrameTimeMs = p999FrameTimeMs;
        this.stutterCount = stutterCount;
        this.droppedFrames = droppedFrames;
        this.tags = tags == null ? new ArrayList<>() : new ArrayList<>(tags);
        this.notes = notes;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getSnapshotId() {
        return snapshot.getId();
    }

    public String getSnapshotName() {
        return snapshot.getName();
    }

    public Long getBuildId() {
        return snapshot.getBuildId();
    }

    public String getBuildName() {
        return snapshot.getBuildName();
    }

    public String getGameName() {
        return gameName;
    }

    public String getScenario() {
        return scenario;
    }

    public MetricSource getSourceType() {
        return sourceType;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public Double getAverageFps() {
        return averageFps;
    }

    public Double getOnePercentLowFps() {
        return onePercentLowFps;
    }

    public Double getZeroPointOnePercentLowFps() {
        return zeroPointOnePercentLowFps;
    }

    public Double getP95FrameTimeMs() {
        return p95FrameTimeMs;
    }

    public Double getP99FrameTimeMs() {
        return p99FrameTimeMs;
    }

    public Double getP999FrameTimeMs() {
        return p999FrameTimeMs;
    }

    public Integer getStutterCount() {
        return stutterCount;
    }

    public Integer getDroppedFrames() {
        return droppedFrames;
    }

    public List<String> getTags() {
        return tags;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}