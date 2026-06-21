package com.pcperformancelab.performance.service;

import com.pcperformancelab.performance.dto.CreatePerformanceSessionRequest;
import com.pcperformancelab.performance.model.MetricSource;
import com.pcperformancelab.performance.model.PerformanceSession;
import com.pcperformancelab.snapshot.service.HardwareSnapshotService;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PerformanceSessionService {

    private final Map<Long, PerformanceSession> sessions = new LinkedHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);
    private final HardwareSnapshotService hardwareSnapshotService;

    public PerformanceSessionService(HardwareSnapshotService hardwareSnapshotService) {
        this.hardwareSnapshotService = hardwareSnapshotService;
    }

    public List<PerformanceSession> findAllBySnapshotId(Long snapshotId) {
        hardwareSnapshotService.findById(snapshotId);

        return sessions.values()
                .stream()
                .filter(session -> session.snapshotId().equals(snapshotId))
                .toList();
    }

    public PerformanceSession findById(Long id) {
        PerformanceSession session = sessions.get(id);

        if (session == null) {
            throw new ResponseStatusException(NOT_FOUND, "Performance session not found");
        }

        return session;
    }

    public PerformanceSession create(Long snapshotId, CreatePerformanceSessionRequest request) {
        hardwareSnapshotService.findById(snapshotId);

        Long id = idGenerator.getAndIncrement();

        PerformanceSession session = new PerformanceSession(
                id,
                snapshotId,
                request.gameName(),
                request.scenario(),
                request.sourceType() == null ? MetricSource.MANUAL : request.sourceType(),
                request.durationSeconds(),
                request.averageFps(),
                request.onePercentLowFps(),
                request.zeroPointOnePercentLowFps(),
                request.p95FrameTimeMs(),
                request.p99FrameTimeMs(),
                request.p999FrameTimeMs(),
                request.stutterCount(),
                request.droppedFrames(),
                request.tags() == null ? new ArrayList<>() : List.copyOf(request.tags()),
                request.notes(),
                Instant.now()
        );

        sessions.put(id, session);
        return session;
    }
}