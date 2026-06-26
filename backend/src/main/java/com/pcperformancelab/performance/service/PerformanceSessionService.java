package com.pcperformancelab.performance.service;

import com.pcperformancelab.performance.dto.CreatePerformanceSessionRequest;
import com.pcperformancelab.performance.dto.PerformanceSessionResponse;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.repository.PerformanceSessionRepository;
import com.pcperformancelab.sensor.repository.SensorSummaryRepository;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import com.pcperformancelab.snapshot.service.HardwareSnapshotService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PerformanceSessionService {

    private final PerformanceSessionRepository performanceSessionRepository;
    private final HardwareSnapshotService hardwareSnapshotService;
    private final SensorSummaryRepository sensorSummaryRepository;

    public PerformanceSessionService(
            PerformanceSessionRepository performanceSessionRepository,
            HardwareSnapshotService hardwareSnapshotService,
            SensorSummaryRepository sensorSummaryRepository
    ) {
        this.performanceSessionRepository = performanceSessionRepository;
        this.hardwareSnapshotService = hardwareSnapshotService;
        this.sensorSummaryRepository = sensorSummaryRepository;
    }

    public List<PerformanceSession> findAll() {
        return performanceSessionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<PerformanceSessionResponse> findAllResponses() {
        return performanceSessionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PerformanceSession> findAllBySnapshotId(Long snapshotId) {
        hardwareSnapshotService.findById(snapshotId);

        return performanceSessionRepository.findAllBySnapshot_Id(snapshotId);
    }

    @Transactional(readOnly = true)
    public List<PerformanceSessionResponse> findAllResponsesBySnapshotId(Long snapshotId) {
        hardwareSnapshotService.findById(snapshotId);

        return performanceSessionRepository.findAllBySnapshot_Id(snapshotId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PerformanceSession findById(Long id) {
        return performanceSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Performance session not found"));
    }

    @Transactional(readOnly = true)
    public PerformanceSessionResponse findResponseById(Long id) {
        PerformanceSession session = findById(id);

        return toResponse(session);
    }

    public PerformanceSession create(Long snapshotId, CreatePerformanceSessionRequest request) {
        HardwareSnapshot snapshot = hardwareSnapshotService.findById(snapshotId);

        PerformanceSession session = new PerformanceSession(
                snapshot,
                request.gameName(),
                request.scenario(),
                request.sourceType(),
                request.durationSeconds(),
                request.averageFps(),
                request.onePercentLowFps(),
                request.zeroPointOnePercentLowFps(),
                request.p95FrameTimeMs(),
                request.p99FrameTimeMs(),
                request.p999FrameTimeMs(),
                request.stutterCount(),
                request.droppedFrames(),
                request.tags(),
                request.notes()
        );

        return performanceSessionRepository.save(session);
    }

    public PerformanceSessionResponse toResponse(PerformanceSession session) {
        return new PerformanceSessionResponse(
                session.getId(),
                session.getSnapshotId(),
                session.getSnapshotName(),
                session.getBuildId(),
                session.getBuildName(),
                session.getGameName(),
                session.getScenario(),
                session.getSourceType(),
                session.getDurationSeconds(),
                session.getAverageFps(),
                session.getOnePercentLowFps(),
                session.getZeroPointOnePercentLowFps(),
                session.getP95FrameTimeMs(),
                session.getP99FrameTimeMs(),
                session.getP999FrameTimeMs(),
                session.getStutterCount(),
                session.getDroppedFrames(),
                sensorSummaryRepository.existsBySession_Id(session.getId()),
                session.getTags(),
                session.getNotes(),
                session.getCreatedAt()
        );
    }
}