package com.pcperformancelab.snapshot.controller;

import com.pcperformancelab.snapshot.dto.CreateHardwareSnapshotRequest;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import com.pcperformancelab.snapshot.service.HardwareSnapshotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class HardwareSnapshotController {

    private final HardwareSnapshotService hardwareSnapshotService;

    public HardwareSnapshotController(HardwareSnapshotService hardwareSnapshotService) {
        this.hardwareSnapshotService = hardwareSnapshotService;
    }

    @GetMapping("/builds/{buildId}/snapshots")
    public List<HardwareSnapshot> findAllByBuildId(@PathVariable Long buildId) {
        return hardwareSnapshotService.findAllByBuildId(buildId);
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
}