package com.pcperformancelab.build.service;

import com.pcperformancelab.build.dto.CreatePcBuildRequest;
import com.pcperformancelab.build.model.PcBuild;
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
public class PcBuildService {

    private final Map<Long, PcBuild> builds = new LinkedHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public List<PcBuild> findAll() {
        return new ArrayList<>(builds.values());
    }

    public PcBuild findById(Long id) {
        PcBuild build = builds.get(id);

        if (build == null) {
            throw new ResponseStatusException(NOT_FOUND, "PC build not found");
        }

        return build;
    }

    public PcBuild create(CreatePcBuildRequest request) {
        Long id = idGenerator.getAndIncrement();

        PcBuild build = new PcBuild(
                id,
                request.name(),
                request.cpu(),
                request.gpu(),
                request.ramGb(),
                request.motherboard(),
                request.storage(),
                request.monitor(),
                request.operatingSystem(),
                request.gpuDriver(),
                Instant.now()
        );

        builds.put(id, build);
        return build;
    }
}