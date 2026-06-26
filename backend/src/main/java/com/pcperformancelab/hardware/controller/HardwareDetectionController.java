package com.pcperformancelab.hardware.controller;

import com.pcperformancelab.hardware.dto.DetectedHardwareResponse;
import com.pcperformancelab.hardware.service.HardwareDetectionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HardwareDetectionController {

    private final HardwareDetectionService hardwareDetectionService;

    public HardwareDetectionController(HardwareDetectionService hardwareDetectionService) {
        this.hardwareDetectionService = hardwareDetectionService;
    }

    @GetMapping("/api/hardware/local")
    public DetectedHardwareResponse detectLocalHardware() {
        return hardwareDetectionService.detectLocalHardware();
    }
}