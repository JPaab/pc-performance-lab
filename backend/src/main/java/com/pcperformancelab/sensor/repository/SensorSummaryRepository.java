package com.pcperformancelab.sensor.repository;

import com.pcperformancelab.sensor.model.SensorSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SensorSummaryRepository extends JpaRepository<SensorSummary, Long> {

    List<SensorSummary> findAllBySession_Id(Long sessionId);
}