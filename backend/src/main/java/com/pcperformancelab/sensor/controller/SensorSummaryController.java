package com.pcperformancelab.sensor.controller;

import com.pcperformancelab.sensor.model.SensorSummary;
import com.pcperformancelab.sensor.service.SensorSummaryService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api")
public class SensorSummaryController {

    private final SensorSummaryService sensorSummaryService;

    public SensorSummaryController(SensorSummaryService sensorSummaryService) {
        this.sensorSummaryService = sensorSummaryService;
    }

    @GetMapping("/sessions/{sessionId}/sensor-summaries")
    public List<SensorSummary> findAllBySessionId(@PathVariable Long sessionId) {
        return sensorSummaryService.findAllBySessionId(sessionId);
    }

    @PostMapping(
            value = "/sessions/{sessionId}/sensor-summaries/import/hwinfo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<SensorSummary> importHwInfoCsv(
            @PathVariable Long sessionId,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "HWiNFO CSV file is required");
        }

        SensorSummary createdSummary = sensorSummaryService.importHwInfoCsv(sessionId, file);

        return ResponseEntity
                .created(URI.create("/api/sessions/" + sessionId + "/sensor-summaries/" + createdSummary.getId()))
                .body(createdSummary);
    }
}