package com.pcperformancelab.build.repository;

import com.pcperformancelab.build.model.PcBuild;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PcBuildRepository extends JpaRepository<PcBuild, Long> {
}