package com.pcperformancelab.performance.repository;

import com.pcperformancelab.performance.model.PerformanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerformanceSessionRepository extends JpaRepository<PerformanceSession, Long> {

    List<PerformanceSession> findAllBySnapshot_Id(Long snapshotId);
}