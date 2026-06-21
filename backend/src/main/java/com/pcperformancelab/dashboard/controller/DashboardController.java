package com.pcperformancelab.dashboard.controller;

import com.pcperformancelab.dashboard.dto.DashboardSummary;
import com.pcperformancelab.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/api/dashboard/summary")
    public DashboardSummary getSummary() {
        return dashboardService.getSummary();
    }
}