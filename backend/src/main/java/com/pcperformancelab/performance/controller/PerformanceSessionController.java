package com.pcperformancelab.performance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcperformancelab.performance.dto.CreatePerformanceSessionRequest;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.service.PerformanceSessionService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.pcperformancelab.performance.importer.CapFrameXImportService;

import java.io.IOException;
import java.net.URI;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api")
public class PerformanceSessionController {

    private final CapFrameXImportService capFrameXImportService;
    private final PerformanceSessionService performanceSessionService;
    private final ObjectMapper objectMapper;

    public PerformanceSessionController(
            PerformanceSessionService performanceSessionService,
            ObjectMapper objectMapper,
            CapFrameXImportService capFrameXImportService
    ) {
        this.performanceSessionService = performanceSessionService;
        this.objectMapper = objectMapper;
        this.capFrameXImportService = capFrameXImportService;
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

    @PostMapping(
            value = "/snapshots/{snapshotId}/sessions/import/json",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<PerformanceSession> importFromJson(
            @PathVariable Long snapshotId,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "JSON file is required");
        }

        CreatePerformanceSessionRequest request = readSessionRequest(file);
        PerformanceSession createdSession = performanceSessionService.create(snapshotId, request);

        return ResponseEntity
                .created(URI.create("/api/sessions/" + createdSession.getId()))
                .body(createdSession);
    }

    @PostMapping(
            value = "/snapshots/{snapshotId}/sessions/import/capframex",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<PerformanceSession> importFromCapFrameX(
            @PathVariable Long snapshotId,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "CapFrameX JSON file is required");
        }

        CreatePerformanceSessionRequest request = capFrameXImportService.parse(file);
        PerformanceSession createdSession = performanceSessionService.create(snapshotId, request);

        return ResponseEntity
                .created(URI.create("/api/sessions/" + createdSession.getId()))
                .body(createdSession);
    }

    private CreatePerformanceSessionRequest readSessionRequest(MultipartFile file) {
        try {
            return objectMapper.readValue(file.getInputStream(), CreatePerformanceSessionRequest.class);
        } catch (IOException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid performance session JSON file");
        }
    }
}