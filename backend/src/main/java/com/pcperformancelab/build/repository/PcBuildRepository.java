package com.pcperformancelab.build.repository;

import com.pcperformancelab.build.model.PcBuild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PcBuildRepository extends JpaRepository<PcBuild, Long> {

    Optional<PcBuild> findTopByOrderByCreatedAtDesc();
}