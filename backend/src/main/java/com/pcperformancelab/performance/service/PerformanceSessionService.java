package com.pcperformancelab.performance.service;

import com.pcperformancelab.performance.dto.CreatePerformanceSessionRequest;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.performance.repository.PerformanceSessionRepository;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import com.pcperformancelab.snapshot.service.HardwareSnapshotService;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PerformanceSessionService {

    private final PerformanceSessionRepository performanceSessionRepository;
    private final HardwareSnapshotService hardwareSnapshotService;

    public PerformanceSessionService(
            PerformanceSessionRepository performanceSessionRepository,
            HardwareSnapshotService hardwareSnapshotService
    ) {
        this.performanceSessionRepository = performanceSessionRepository;
        this.hardwareSnapshotService = hardwareSnapshotService;
    }

    public List<PerformanceSession> findAll() {
        return performanceSessionRepository.findAll();
    }

    public List<PerformanceSession> findAllBySnapshotId(Long snapshotId) {
        hardwareSnapshotService.findById(snapshotId);

        return performanceSessionRepository.findAllBySnapshot_Id(snapshotId);
    }

    public PerformanceSession findById(Long id) {
        return performanceSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Performance session not found"));
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
}