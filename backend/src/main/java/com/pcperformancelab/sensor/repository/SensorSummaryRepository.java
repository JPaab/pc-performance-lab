package com.pcperformancelab.sensor.repository;

import com.pcperformancelab.sensor.model.SensorSummary;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SensorSummaryRepository extends JpaRepository<SensorSummary, Long> {

    List<SensorSummary> findAllBySession_Id(Long sessionId);

    void deleteAllBySession_Id(Long sessionId);

    Optional<SensorSummary> findTopBySession_IdOrderByCreatedAtDesc(Long sessionId);

    Optional<SensorSummary> findTopByOrderByCreatedAtDesc();
}