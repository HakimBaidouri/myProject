package com.example.myProject.repository;

import com.example.myProject.model.MainTableLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MainTableLineRepository extends JpaRepository<MainTableLine, Long> {
    List<MainTableLine> findByChapterId(Long chapterId);
}
