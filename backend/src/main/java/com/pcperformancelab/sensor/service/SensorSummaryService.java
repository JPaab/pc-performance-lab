package com.pcperformancelab.sensor.service;

import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.repository.PerformanceSessionRepository;
import com.pcperformancelab.sensor.dto.SensorSummaryData;
import com.pcperformancelab.sensor.importer.HwInfoCsvImportService;
import com.pcperformancelab.sensor.model.SensorSummary;
import com.pcperformancelab.sensor.repository.SensorSummaryRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class SensorSummaryService {

    private final SensorSummaryRepository sensorSummaryRepository;
    private final PerformanceSessionRepository performanceSessionRepository;
    private final HwInfoCsvImportService hwInfoCsvImportService;

    @Transactional(readOnly = true)
    public List<SensorSummary> findAllBySessionId(Long sessionId) {
        return sensorSummaryRepository.findAllBySession_Id(sessionId);
    }

    @Transactional(readOnly = true)
    public List<SensorSummary> getSensorSummariesForSession(Long sessionId) {
        return findAllBySessionId(sessionId);
    }

    @Transactional(readOnly = true)
    public Optional<SensorSummary> findLatestBySessionId(Long sessionId) {
        return sensorSummaryRepository.findTopBySession_IdOrderByCreatedAtDesc(sessionId);
    }

    @Transactional(readOnly = true)
    public Optional<SensorSummary> findLatest() {
        return sensorSummaryRepository.findTopByOrderByCreatedAtDesc();
    }

    public SensorSummary importHwInfoCsv(Long sessionId, MultipartFile file) {
        return importHwInfoCsvForSession(sessionId, file);
    }

    public SensorSummary importHwInfoCsvForSession(Long sessionId, MultipartFile file) {
        PerformanceSession session = performanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Performance session not found: " + sessionId));

        SensorSummaryData data = hwInfoCsvImportService.parse(file);

        SensorSummary summary = new SensorSummary();
        summary.setSession(session);
        summary.setSourceType("HWINFO_CSV");

        applyData(summary, data);

        return sensorSummaryRepository.save(summary);
    }

    private void applyData(SensorSummary summary, SensorSummaryData data) {
        summary.setSampleCount(data.sampleCount());

        summary.setCpuPackageTempAvg(data.cpuPackageTempAvg());
        summary.setCpuPackageTempMax(data.cpuPackageTempMax());
        summary.setCpuCoreMaxTempMax(data.cpuCoreMaxTempMax());

        summary.setCpuPackagePowerAvg(data.cpuPackagePowerAvg());
        summary.setCpuPackagePowerMax(data.cpuPackagePowerMax());

        summary.setTotalCpuUsageAvg(data.totalCpuUsageAvg());

        summary.setPhysicalMemoryLoadAvg(data.physicalMemoryLoadAvg());
        summary.setPhysicalMemoryLoadMax(data.physicalMemoryLoadMax());

        summary.setGpuTemperatureAvg(data.gpuTemperatureAvg());
        summary.setGpuTemperatureMax(data.gpuTemperatureMax());

        summary.setGpuHotSpotTemperatureAvg(data.gpuHotSpotTemperatureAvg());
        summary.setGpuHotSpotTemperatureMax(data.gpuHotSpotTemperatureMax());

        summary.setGpuPowerAvg(data.gpuPowerAvg());
        summary.setGpuPowerMax(data.gpuPowerMax());

        summary.setGpuClockAvg(data.gpuClockAvg());
        summary.setGpuClockMax(data.gpuClockMax());

        summary.setGpuMemoryClockAvg(data.gpuMemoryClockAvg());

        summary.setGpuCoreLoadAvg(data.gpuCoreLoadAvg());
        summary.setGpuCoreLoadMax(data.gpuCoreLoadMax());

        summary.setGpuMemoryUsageAvg(data.gpuMemoryUsageAvg());
        summary.setGpuMemoryUsageMax(data.gpuMemoryUsageMax());

        summary.setGpuMemoryJunctionTemperatureAvg(data.gpuMemoryJunctionTemperatureAvg());
        summary.setGpuMemoryJunctionTemperatureMax(data.gpuMemoryJunctionTemperatureMax());

        summary.setGpuEffectiveClockAvg(data.gpuEffectiveClockAvg());
        summary.setGpuEffectiveClockMax(data.gpuEffectiveClockMax());

        summary.setCpuAverageEffectiveClockAvg(data.cpuAverageEffectiveClockAvg());
        summary.setCpuAverageEffectiveClockMax(data.cpuAverageEffectiveClockMax());

        summary.setCpuThermalThrottlingDetected(Boolean.TRUE.equals(data.cpuThermalThrottlingDetected()));
        summary.setCpuPowerLimitDetected(Boolean.TRUE.equals(data.cpuPowerLimitDetected()));
        summary.setCpuLimitReasonsDetected(Boolean.TRUE.equals(data.cpuLimitReasonsDetected()));

        summary.setGpuPerformanceLimitDetected(Boolean.TRUE.equals(data.gpuPerformanceLimitDetected()));
        summary.setGpuPowerLimitDetected(Boolean.TRUE.equals(data.gpuPowerLimitDetected()));
        summary.setGpuThermalLimitDetected(Boolean.TRUE.equals(data.gpuThermalLimitDetected()));
        summary.setGpuReliabilityVoltageLimitDetected(Boolean.TRUE.equals(data.gpuReliabilityVoltageLimitDetected()));
        summary.setGpuMaxOperatingVoltageLimitDetected(Boolean.TRUE.equals(data.gpuMaxOperatingVoltageLimitDetected()));
        summary.setGpuUtilizationLimitDetected(Boolean.TRUE.equals(data.gpuUtilizationLimitDetected()));
    }
}