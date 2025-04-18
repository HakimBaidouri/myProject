package com.example.myProject.controller;

import com.example.myProject.dto.*;
import com.example.myProject.model.Chapter;
import com.example.myProject.model.DetailTableLine;
import com.example.myProject.model.MainTableLine;
import com.example.myProject.model.Project;
import com.example.myProject.repository.ChapterRepository;
import com.example.myProject.repository.DetailTableLineRepository;
import com.example.myProject.repository.MainTableLineRepository;
import com.example.myProject.repository.ProjectRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/myProject/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final ChapterRepository chapterRepository;
    private final MainTableLineRepository mainTableLineRepository;
    private final DetailTableLineRepository detailTableLineRepository;

    public ProjectController(
            ProjectRepository projectRepository,
            ChapterRepository chapterRepository,
            MainTableLineRepository mainTableLineRepository,
            DetailTableLineRepository detailTableLineRepository
    ) {
        this.projectRepository = projectRepository;
        this.chapterRepository = chapterRepository;
        this.mainTableLineRepository = mainTableLineRepository;
        this.detailTableLineRepository = detailTableLineRepository;
    }

    @GetMapping
    public List<Project> getAll() {
        return projectRepository.findAll();
    }

    @GetMapping("/{id}")
    public Project getById(@PathVariable Long id) {
        return projectRepository.findById(id).orElseThrow();
    }

    @PostMapping
    public Project create(@RequestBody ProjectRequestDTO dto) {
        Project project = Project.builder()
                .name(dto.getName())
                .userId(dto.getUserId())
                .companyId(dto.getCompanyId())
                .build();
        return projectRepository.save(project);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable Long id, @RequestBody ProjectRequestDTO dto) {
        Project project = projectRepository.findById(id).orElseThrow();
        project.setName(dto.getName());
        project.setUserId(dto.getUserId());
        project.setCompanyId(dto.getCompanyId());
        return projectRepository.save(project);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        projectRepository.deleteById(id);
    }

    @GetMapping("/{id}/full")
    public ProjectFullDTO getFullProject(@PathVariable Long id) {
        Project project = projectRepository.findById(id).orElseThrow();
        List<Chapter> chapters = chapterRepository.findByProjectId(id);

        List<ChapterWithLinesDTO> chapterDTOs = chapters.stream().map(ch -> {
            List<MainTableLine> lines = mainTableLineRepository.findByChapterId(ch.getId());

            List<MainTableLineWithDetailsDTO> lineDTOs = lines.stream().map(line -> {
                List<DetailTableLine> details = detailTableLineRepository.findByMainTableLineId(line.getId());
                MainTableLineWithDetailsDTO dto = new MainTableLineWithDetailsDTO();
                dto.setMainTableLine(line);
                dto.setDetails(details);
                return dto;
            }).toList();

            ChapterWithLinesDTO chapterDTO = new ChapterWithLinesDTO();
            chapterDTO.setChapter(ch);
            chapterDTO.setLines(lineDTOs);
            return chapterDTO;
        }).toList();

        ProjectFullDTO fullDTO = new ProjectFullDTO();
        fullDTO.setProject(project);
        fullDTO.setChapters(chapterDTOs);

        return fullDTO;
    }
}
