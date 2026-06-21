package com.pcperformancelab.sensor.service;

import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.service.PerformanceSessionService;
import com.pcperformancelab.sensor.dto.SensorSummaryData;
import com.pcperformancelab.sensor.importer.HwInfoCsvImportService;
import com.pcperformancelab.sensor.model.SensorSummary;
import com.pcperformancelab.sensor.repository.SensorSummaryRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class SensorSummaryService {

    private final SensorSummaryRepository sensorSummaryRepository;
    private final PerformanceSessionService performanceSessionService;
    private final HwInfoCsvImportService hwInfoCsvImportService;

    public SensorSummaryService(
            SensorSummaryRepository sensorSummaryRepository,
            PerformanceSessionService performanceSessionService,
            HwInfoCsvImportService hwInfoCsvImportService
    ) {
        this.sensorSummaryRepository = sensorSummaryRepository;
        this.performanceSessionService = performanceSessionService;
        this.hwInfoCsvImportService = hwInfoCsvImportService;
    }

    public List<SensorSummary> findAllBySessionId(Long sessionId) {
        performanceSessionService.findById(sessionId);

        return sensorSummaryRepository.findAllBySession_Id(sessionId);
    }

    public SensorSummary importHwInfoCsv(Long sessionId, MultipartFile file) {
        PerformanceSession session = performanceSessionService.findById(sessionId);
        SensorSummaryData data = hwInfoCsvImportService.parse(file);

        SensorSummary summary = new SensorSummary(session, "HWINFO_CSV", data);

        return sensorSummaryRepository.save(summary);
    }
}