package com.pcperformancelab.sensor.repository;

import com.pcperformancelab.sensor.model.SensorSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SensorSummaryRepository extends JpaRepository<SensorSummary, Long> {

    List<SensorSummary> findAllBySession_Id(Long sessionId);

    Optional<SensorSummary> findTopBySession_IdOrderByCreatedAtDesc(Long sessionId);
}