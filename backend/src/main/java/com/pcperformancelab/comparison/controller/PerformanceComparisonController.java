package com.pcperformancelab.comparison.controller;

import com.pcperformancelab.comparison.dto.PerformanceComparisonResult;
import com.pcperformancelab.comparison.service.PerformanceComparisonService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PerformanceComparisonController {

    private final PerformanceComparisonService performanceComparisonService;

    public PerformanceComparisonController(PerformanceComparisonService performanceComparisonService) {
        this.performanceComparisonService = performanceComparisonService;
    }

    @GetMapping("/api/compare")
    public PerformanceComparisonResult compare(
            @RequestParam Long s1,
            @RequestParam Long s2
    ) {
        return performanceComparisonService.compare(s1, s2);
    }
}