package com.pcperformancelab.build.controller;

import com.pcperformancelab.build.dto.CreatePcBuildRequest;
import com.pcperformancelab.build.model.PcBuild;
import com.pcperformancelab.build.service.PcBuildService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/builds")
public class PcBuildController {

    private final PcBuildService pcBuildService;

    public PcBuildController(PcBuildService pcBuildService) {
        this.pcBuildService = pcBuildService;
    }

    @GetMapping
    public List<PcBuild> findAll() {
        return pcBuildService.findAll();
    }

    @GetMapping("/{id}")
    public PcBuild findById(@PathVariable Long id) {
        return pcBuildService.findById(id);
    }

    @PostMapping
    public ResponseEntity<PcBuild> create(@Valid @RequestBody CreatePcBuildRequest request) {
        PcBuild createdBuild = pcBuildService.create(request);

        return ResponseEntity
                .created(URI.create("/api/builds/" + createdBuild.id()))
                .body(createdBuild);
    }
}