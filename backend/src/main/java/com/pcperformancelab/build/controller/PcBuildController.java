package com.pcperformancelab.build.controller;

import com.pcperformancelab.build.dto.CreatePcBuildRequest;
import com.pcperformancelab.build.model.PcBuild;
import com.pcperformancelab.build.repository.PcBuildRepository;
import com.pcperformancelab.build.service.PcBuildService;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.repository.PerformanceSessionRepository;
import com.pcperformancelab.sensor.repository.SensorSummaryRepository;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import com.pcperformancelab.snapshot.repository.HardwareSnapshotRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/builds")
public class PcBuildController {

    private final PcBuildService pcBuildService;
    private final PcBuildRepository pcBuildRepository;
    private final HardwareSnapshotRepository hardwareSnapshotRepository;
    private final PerformanceSessionRepository performanceSessionRepository;
    private final SensorSummaryRepository sensorSummaryRepository;

    public PcBuildController(
            PcBuildService pcBuildService,
            PcBuildRepository pcBuildRepository,
            HardwareSnapshotRepository hardwareSnapshotRepository,
            PerformanceSessionRepository performanceSessionRepository,
            SensorSummaryRepository sensorSummaryRepository
    ) {
        this.pcBuildService = pcBuildService;
        this.pcBuildRepository = pcBuildRepository;
        this.hardwareSnapshotRepository = hardwareSnapshotRepository;
        this.performanceSessionRepository = performanceSessionRepository;
        this.sensorSummaryRepository = sensorSummaryRepository;
    }

    @GetMapping
    public List<PcBuild> findAll() {
        return pcBuildService.findAll();
    }

    @GetMapping("/{id}")
    public PcBuild findById(@PathVariable Long id) {
        return pcBuildService.findById(id);
    }

    @PostMapping
    public ResponseEntity<PcBuild> create(@Valid @RequestBody CreatePcBuildRequest request) {
        PcBuild createdBuild = pcBuildService.create(request);

        return ResponseEntity
                .created(URI.create("/api/builds/" + createdBuild.getId()))
                .body(createdBuild);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        PcBuild build = pcBuildService.findById(id);

        List<PerformanceSession> sessions = performanceSessionRepository.findAllBySnapshot_Build_Id(id);

        for (PerformanceSession session : sessions) {
            sensorSummaryRepository.deleteAllBySession_Id(session.getId());
        }

        performanceSessionRepository.deleteAll(sessions);

        List<HardwareSnapshot> snapshots = hardwareSnapshotRepository.findAllByBuild_Id(id);
        hardwareSnapshotRepository.deleteAll(snapshots);

        pcBuildRepository.delete(build);

        return ResponseEntity.noContent().build();
    }
}