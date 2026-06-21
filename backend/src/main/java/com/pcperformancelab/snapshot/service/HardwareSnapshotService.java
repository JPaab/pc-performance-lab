package com.pcperformancelab.snapshot.service;

import com.pcperformancelab.build.service.PcBuildService;
import com.pcperformancelab.snapshot.dto.CreateHardwareSnapshotRequest;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
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
public class HardwareSnapshotService {

    private final Map<Long, HardwareSnapshot> snapshots = new LinkedHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);
    private final PcBuildService pcBuildService;

    public HardwareSnapshotService(PcBuildService pcBuildService) {
        this.pcBuildService = pcBuildService;
    }

    public List<HardwareSnapshot> findAllByBuildId(Long buildId) {
        pcBuildService.findById(buildId);

        return snapshots.values()
                .stream()
                .filter(snapshot -> snapshot.buildId().equals(buildId))
                .toList();
    }

    public HardwareSnapshot findById(Long id) {
        HardwareSnapshot snapshot = snapshots.get(id);

        if (snapshot == null) {
            throw new ResponseStatusException(NOT_FOUND, "Hardware snapshot not found");
        }

        return snapshot;
    }

    public HardwareSnapshot create(Long buildId, CreateHardwareSnapshotRequest request) {
        pcBuildService.findById(buildId);

        Long id = idGenerator.getAndIncrement();

        HardwareSnapshot snapshot = new HardwareSnapshot(
                id,
                buildId,
                request.name(),
                request.cpuOverclock(),
                request.ramProfile(),
                request.ramTimings(),
                request.trfc(),
                request.trefi(),
                request.commandRate(),
                request.gearMode(),
                request.biosVersion(),
                request.operatingSystemProfile(),
                request.powerPlan(),
                request.hagsEnabled(),
                request.gpuDriver(),
                request.tweakTags() == null ? new ArrayList<>() : List.copyOf(request.tweakTags()),
                request.notes(),
                Instant.now()
        );

        snapshots.put(id, snapshot);
        return snapshot;
    }
}