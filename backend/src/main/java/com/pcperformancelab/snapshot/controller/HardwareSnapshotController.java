package com.pcperformancelab.snapshot.controller;

import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.repository.PerformanceSessionRepository;
import com.pcperformancelab.sensor.repository.SensorSummaryRepository;
import com.pcperformancelab.snapshot.dto.CreateHardwareSnapshotRequest;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import com.pcperformancelab.snapshot.repository.HardwareSnapshotRepository;
import com.pcperformancelab.snapshot.service.HardwareSnapshotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class HardwareSnapshotController {

    private final HardwareSnapshotService hardwareSnapshotService;
    private final HardwareSnapshotRepository hardwareSnapshotRepository;
    private final PerformanceSessionRepository performanceSessionRepository;
    private final SensorSummaryRepository sensorSummaryRepository;

    public HardwareSnapshotController(
            HardwareSnapshotService hardwareSnapshotService,
            HardwareSnapshotRepository hardwareSnapshotRepository,
            PerformanceSessionRepository performanceSessionRepository,
            SensorSummaryRepository sensorSummaryRepository
    ) {
        this.hardwareSnapshotService = hardwareSnapshotService;
        this.hardwareSnapshotRepository = hardwareSnapshotRepository;
        this.performanceSessionRepository = performanceSessionRepository;
        this.sensorSummaryRepository = sensorSummaryRepository;
    }

    @GetMapping("/builds/{buildId}/snapshots")
    public List<HardwareSnapshot> findAllByBuildId(@PathVariable Long buildId) {
        return hardwareSnapshotService.findAllByBuildId(buildId);
    }

    @GetMapping("/snapshots")
    public List<HardwareSnapshot> findAll() {
        return hardwareSnapshotService.findAll();
    }

    @GetMapping("/snapshots/{id}")
    public HardwareSnapshot findById(@PathVariable Long id) {
        return hardwareSnapshotService.findById(id);
    }

    @PostMapping("/builds/{buildId}/snapshots")
    public ResponseEntity<HardwareSnapshot> create(
            @PathVariable Long buildId,
            @Valid @RequestBody CreateHardwareSnapshotRequest request
    ) {
        HardwareSnapshot createdSnapshot = hardwareSnapshotService.create(buildId, request);

        return ResponseEntity
                .created(URI.create("/api/snapshots/" + createdSnapshot.getId()))
                .body(createdSnapshot);
    }

    @DeleteMapping("/snapshots/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        HardwareSnapshot snapshot = hardwareSnapshotService.findById(id);

        List<PerformanceSession> sessions = performanceSessionRepository.findAllBySnapshot_Id(id);

        for (PerformanceSession session : sessions) {
            sensorSummaryRepository.deleteAll(sensorSummaryRepository.findAllBySession_Id(session.getId()));
        }

        performanceSessionRepository.deleteAll(sessions);
        hardwareSnapshotRepository.delete(snapshot);

        return ResponseEntity.noContent().build();
    }
}