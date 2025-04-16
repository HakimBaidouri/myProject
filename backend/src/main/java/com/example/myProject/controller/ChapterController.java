package com.example.myProject.controller;

import com.example.myProject.dto.ChapterRequestDTO;
import com.example.myProject.model.Chapter;
import com.example.myProject.repository.ChapterRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("myProject/api/chapters")
public class ChapterController {

    private final ChapterRepository chapterRepository;

    public ChapterController(ChapterRepository chapterRepository) {
        this.chapterRepository = chapterRepository;
    }

    @GetMapping
    public List<Chapter> getAll() {
        return chapterRepository.findAll();
    }

    @GetMapping("/project/{projectId}")
    public List<Chapter> getByProject(@PathVariable Long projectId) {
        return chapterRepository.findByProjectId(projectId);
    }

    @PostMapping
    public Chapter create(@RequestBody ChapterRequestDTO dto) {
        Chapter chapter = Chapter.builder()
                .projectId(dto.getProjectId())
                .parentId(dto.getParentId())
                .num(dto.getNum())
                .label(dto.getLabel())
                .build();
        return chapterRepository.save(chapter);
    }

    @PutMapping("/{id}")
    public Chapter update(@PathVariable Long id, @RequestBody ChapterRequestDTO dto) {
        Chapter chapter = chapterRepository.findById(id).orElseThrow();
        chapter.setProjectId(dto.getProjectId());
        chapter.setParentId(dto.getParentId());
        chapter.setNum(dto.getNum());
        chapter.setLabel(dto.getLabel());
        return chapterRepository.save(chapter);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        chapterRepository.deleteById(id);
    }
}
