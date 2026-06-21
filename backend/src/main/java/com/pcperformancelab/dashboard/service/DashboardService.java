package com.pcperformancelab.dashboard.service;

import com.pcperformancelab.build.model.PcBuild;
import com.pcperformancelab.build.repository.PcBuildRepository;
import com.pcperformancelab.dashboard.dto.DashboardSummary;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.repository.PerformanceSessionRepository;
import com.pcperformancelab.sensor.model.SensorSummary;
import com.pcperformancelab.sensor.repository.SensorSummaryRepository;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import com.pcperformancelab.snapshot.repository.HardwareSnapshotRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final PcBuildRepository pcBuildRepository;
    private final HardwareSnapshotRepository hardwareSnapshotRepository;
    private final PerformanceSessionRepository performanceSessionRepository;
    private final SensorSummaryRepository sensorSummaryRepository;

    public DashboardService(
            PcBuildRepository pcBuildRepository,
            HardwareSnapshotRepository hardwareSnapshotRepository,
            PerformanceSessionRepository performanceSessionRepository,
            SensorSummaryRepository sensorSummaryRepository
    ) {
        this.pcBuildRepository = pcBuildRepository;
        this.hardwareSnapshotRepository = hardwareSnapshotRepository;
        this.performanceSessionRepository = performanceSessionRepository;
        this.sensorSummaryRepository = sensorSummaryRepository;
    }

    public DashboardSummary getSummary() {
        return new DashboardSummary(
                pcBuildRepository.count(),
                hardwareSnapshotRepository.count(),
                performanceSessionRepository.count(),
                sensorSummaryRepository.count(),
                pcBuildRepository.findTopByOrderByCreatedAtDesc()
                        .map(this::toBuildSummary)
                        .orElse(null),
                hardwareSnapshotRepository.findTopByOrderByCreatedAtDesc()
                        .map(this::toSnapshotSummary)
                        .orElse(null),
                performanceSessionRepository.findTopByOrderByCreatedAtDesc()
                        .map(this::toSessionSummary)
                        .orElse(null),
                sensorSummaryRepository.findTopByOrderByCreatedAtDesc()
                        .map(this::toSensorSummaryInfo)
                        .orElse(null),
                performanceSessionRepository.findFirstByAverageFpsIsNotNullOrderByAverageFpsDesc()
                        .map(this::toSessionSummary)
                        .orElse(null)
        );
    }

    private DashboardSummary.BuildSummary toBuildSummary(PcBuild build) {
        return new DashboardSummary.BuildSummary(
                build.getId(),
                build.getName(),
                build.getCpu(),
                build.getGpu(),
                build.getRamGb(),
                build.getCreatedAt()
        );
    }

    private DashboardSummary.SnapshotSummary toSnapshotSummary(HardwareSnapshot snapshot) {
        return new DashboardSummary.SnapshotSummary(
                snapshot.getId(),
                snapshot.getBuildId(),
                snapshot.getName(),
                snapshot.getCpuOverclock(),
                snapshot.getRamProfile(),
                snapshot.getOperatingSystemProfile(),
                snapshot.getGpuDriver(),
                snapshot.getCreatedAt()
        );
    }

    private DashboardSummary.SessionSummary toSessionSummary(PerformanceSession session) {
        return new DashboardSummary.SessionSummary(
                session.getId(),
                session.getSnapshotId(),
                session.getGameName(),
                session.getScenario(),
                session.getSourceType().name(),
                session.getAverageFps(),
                session.getOnePercentLowFps(),
                session.getP99FrameTimeMs(),
                session.getStutterCount(),
                session.getDroppedFrames(),
                session.getCreatedAt()
        );
    }

    private DashboardSummary.SensorSummaryInfo toSensorSummaryInfo(SensorSummary summary) {
        return new DashboardSummary.SensorSummaryInfo(
                summary.getId(),
                summary.getSessionId(),
                summary.getSourceType(),
                summary.getSampleCount(),
                summary.getCpuPackageTempAvg(),
                summary.getCpuPackageTempMax(),
                summary.getGpuTemperatureAvg(),
                summary.getGpuTemperatureMax(),
                summary.getGpuPowerAvg(),
                summary.getGpuPowerMax(),
                summary.getCreatedAt()
        );
    }
}