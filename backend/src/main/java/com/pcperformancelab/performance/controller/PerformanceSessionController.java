package com.pcperformancelab.performance.controller;

import com.pcperformancelab.performance.dto.CreatePerformanceSessionRequest;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.service.PerformanceSessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PerformanceSessionController {

    private final PerformanceSessionService performanceSessionService;

    public PerformanceSessionController(PerformanceSessionService performanceSessionService) {
        this.performanceSessionService = performanceSessionService;
    }

    @GetMapping("/snapshots/{snapshotId}/sessions")
    public List<PerformanceSession> findAllBySnapshotId(@PathVariable Long snapshotId) {
        return performanceSessionService.findAllBySnapshotId(snapshotId);
    }

    @GetMapping("/sessions/{id}")
    public PerformanceSession findById(@PathVariable Long id) {
        return performanceSessionService.findById(id);
    }

    @PostMapping("/snapshots/{snapshotId}/sessions")
    public ResponseEntity<PerformanceSession> create(
            @PathVariable Long snapshotId,
            @Valid @RequestBody CreatePerformanceSessionRequest request
    ) {
        PerformanceSession createdSession = performanceSessionService.create(snapshotId, request);

        return ResponseEntity
                .created(URI.create("/api/sessions/" + createdSession.getId()))
                .body(createdSession);
    }
}