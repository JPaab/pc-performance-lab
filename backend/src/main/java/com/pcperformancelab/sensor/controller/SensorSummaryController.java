package com.pcperformancelab.sensor.controller;

import com.pcperformancelab.sensor.model.SensorSummary;
import com.pcperformancelab.sensor.service.SensorSummaryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SensorSummaryController {

    private final SensorSummaryService sensorSummaryService;

    @GetMapping("/sessions/{sessionId}/sensor-summaries")
    public List<SensorSummary> findAllBySessionId(@PathVariable Long sessionId) {
        return sensorSummaryService.findAllBySessionId(sessionId);
    }

    @PostMapping(
            value = "/sessions/{sessionId}/sensor-summaries/import/hwinfo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public SensorSummary importHwInfoCsv(
            @PathVariable Long sessionId,
            @RequestParam("file") MultipartFile file
    ) {
        return sensorSummaryService.importHwInfoCsv(sessionId, file);
    }
}