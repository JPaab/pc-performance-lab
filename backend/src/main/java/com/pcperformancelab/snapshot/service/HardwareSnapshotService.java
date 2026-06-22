package com.pcperformancelab.snapshot.service;

import com.pcperformancelab.build.model.PcBuild;
import com.pcperformancelab.build.service.PcBuildService;
import com.pcperformancelab.snapshot.dto.CreateHardwareSnapshotRequest;
import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import com.pcperformancelab.snapshot.repository.HardwareSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class HardwareSnapshotService {

    private final HardwareSnapshotRepository hardwareSnapshotRepository;
    private final PcBuildService pcBuildService;

    public HardwareSnapshotService(
            HardwareSnapshotRepository hardwareSnapshotRepository,
            PcBuildService pcBuildService
    ) {
        this.hardwareSnapshotRepository = hardwareSnapshotRepository;
        this.pcBuildService = pcBuildService;
    }

    public List<HardwareSnapshot> findAll() {
        return hardwareSnapshotRepository.findAll();
    }

    public List<HardwareSnapshot> findAllByBuildId(Long buildId) {
        pcBuildService.findById(buildId);

        return hardwareSnapshotRepository.findAllByBuild_Id(buildId);
    }

    public HardwareSnapshot findById(Long id) {
        return hardwareSnapshotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Hardware snapshot not found"));
    }

    public HardwareSnapshot create(Long buildId, CreateHardwareSnapshotRequest request) {
        PcBuild build = pcBuildService.findById(buildId);

        HardwareSnapshot snapshot = new HardwareSnapshot(
                build,
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
                request.tweakTags(),
                request.notes()
        );

        return hardwareSnapshotRepository.save(snapshot);
    }
}