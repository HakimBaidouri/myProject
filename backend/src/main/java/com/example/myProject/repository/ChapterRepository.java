package com.example.myProject.repository;

import com.example.myProject.model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByProjectId(Long projectId);
    List<Chapter> findByParentId(Long parentId);
}

