package com.example.myProject.repository;

import com.example.myProject.model.DetailTableLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetailTableLineRepository extends JpaRepository<DetailTableLine, Long> {
    List<DetailTableLine> findByMainTableLineId(Long mainTableLineId);
}
