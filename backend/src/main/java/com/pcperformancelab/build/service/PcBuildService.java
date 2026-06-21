package com.pcperformancelab.build.service;

import com.pcperformancelab.build.dto.CreatePcBuildRequest;
import com.pcperformancelab.build.model.PcBuild;
import com.pcperformancelab.build.repository.PcBuildRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PcBuildService {

    private final PcBuildRepository pcBuildRepository;

    public PcBuildService(PcBuildRepository pcBuildRepository) {
        this.pcBuildRepository = pcBuildRepository;
    }

    public List<PcBuild> findAll() {
        return pcBuildRepository.findAll();
    }

    public PcBuild findById(Long id) {
        return pcBuildRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PC build not found"));
    }

    public PcBuild create(CreatePcBuildRequest request) {
        PcBuild build = new PcBuild(
                request.name(),
                request.cpu(),
                request.gpu(),
                request.ramGb(),
                request.motherboard(),
                request.storage(),
                request.monitor(),
                request.operatingSystem(),
                request.gpuDriver()
        );

        return pcBuildRepository.save(build);
    }
}