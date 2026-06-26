package com.pcperformancelab.performance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcperformancelab.performance.dto.CreatePerformanceSessionRequest;
import com.pcperformancelab.performance.dto.PerformanceSessionResponse;
import com.pcperformancelab.performance.importer.CapFrameXImportService;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.repository.PerformanceSessionRepository;
import com.pcperformancelab.performance.service.PerformanceSessionService;
import com.pcperformancelab.sensor.repository.SensorSummaryRepository;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api")
public class PerformanceSessionController {

    private final CapFrameXImportService capFrameXImportService;
    private final PerformanceSessionService performanceSessionService;
    private final PerformanceSessionRepository performanceSessionRepository;
    private final SensorSummaryRepository sensorSummaryRepository;
    private final ObjectMapper objectMapper;

    public PerformanceSessionController(
            PerformanceSessionService performanceSessionService,
            PerformanceSessionRepository performanceSessionRepository,
            SensorSummaryRepository sensorSummaryRepository,
            ObjectMapper objectMapper,
            CapFrameXImportService capFrameXImportService
    ) {
        this.performanceSessionService = performanceSessionService;
        this.performanceSessionRepository = performanceSessionRepository;
        this.sensorSummaryRepository = sensorSummaryRepository;
        this.objectMapper = objectMapper;
        this.capFrameXImportService = capFrameXImportService;
    }

    @GetMapping("/snapshots/{snapshotId}/sessions")
    public List<PerformanceSessionResponse> findAllBySnapshotId(@PathVariable Long snapshotId) {
        return performanceSessionService.findAllResponsesBySnapshotId(snapshotId);
    }

    @GetMapping("/sessions")
    public List<PerformanceSessionResponse> findAll() {
        return performanceSessionService.findAllResponses();
    }

    @GetMapping("/sessions/{id}")
    public PerformanceSessionResponse findById(@PathVariable Long id) {
        return performanceSessionService.findResponseById(id);
    }

    @PostMapping("/snapshots/{snapshotId}/sessions")
    public ResponseEntity<PerformanceSessionResponse> create(
            @PathVariable Long snapshotId,
            @Valid @RequestBody CreatePerformanceSessionRequest request
    ) {
        PerformanceSession createdSession = performanceSessionService.create(snapshotId, request);

        return ResponseEntity
                .created(URI.create("/api/sessions/" + createdSession.getId()))
                .body(performanceSessionService.toResponse(createdSession));
    }

    @PostMapping(
            value = "/snapshots/{snapshotId}/sessions/import/json",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<PerformanceSessionResponse> importFromJson(
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
                .body(performanceSessionService.toResponse(createdSession));
    }

    @PostMapping(
            value = "/snapshots/{snapshotId}/sessions/import/capframex",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<PerformanceSessionResponse> importFromCapFrameX(
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
                .body(performanceSessionService.toResponse(createdSession));
    }

    @DeleteMapping("/sessions/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        PerformanceSession session = performanceSessionService.findById(id);

        sensorSummaryRepository.deleteAllBySession_Id(id);
        performanceSessionRepository.delete(session);

        return ResponseEntity.noContent().build();
    }

    private CreatePerformanceSessionRequest readSessionRequest(MultipartFile file) {
        try {
            return objectMapper.readValue(file.getInputStream(), CreatePerformanceSessionRequest.class);
        } catch (IOException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid performance session JSON file");
        }
    }
}