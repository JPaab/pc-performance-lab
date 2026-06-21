package com.pcperformancelab.snapshot.repository;

import com.pcperformancelab.snapshot.model.HardwareSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HardwareSnapshotRepository extends JpaRepository<HardwareSnapshot, Long> {

    List<HardwareSnapshot> findAllByBuild_Id(Long buildId);

    Optional<HardwareSnapshot> findTopByOrderByCreatedAtDesc();
}