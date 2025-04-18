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

import java.util.*;

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

    @PutMapping("/{id}/full")
    public void syncProject(@PathVariable Long id, @RequestBody ProjectFullDTO fullDTO) {

        Project project = projectRepository.findById(id).orElseThrow();
        project.setName(fullDTO.getProject().getName());
        project.setUserId(fullDTO.getProject().getUserId());
        project.setCompanyId(fullDTO.getProject().getCompanyId());
        projectRepository.save(project);

        Map<String, Long> tempIdToRealId = new HashMap<>();
        List<Long> sentChapterIds = new ArrayList<>();

        // 1. Enregistrement initial des chapitres sans parentId
        for (ChapterWithLinesDTO chapterDTO : fullDTO.getChapters()) {
            Chapter chapter = chapterDTO.getChapter();
            chapter.setProjectId(id);

            String tempId = chapter.getTempId(); // doit être fourni par le frontend
            chapter.setParentId(null); // temporairement

            Chapter saved = chapterRepository.save(chapter);
            if (tempId != null) {
                tempIdToRealId.put(tempId, saved.getId());
            }

            chapter.setId(saved.getId());
            chapterDTO.setChapter(saved);
            sentChapterIds.add(saved.getId());
        }

        // 2. Mise à jour des parentId après insertion
        for (ChapterWithLinesDTO chapterDTO : fullDTO.getChapters()) {
            Chapter chapter = chapterDTO.getChapter();
            String parentTempId = chapter.getParentTempId();

            if (parentTempId != null && tempIdToRealId.containsKey(parentTempId)) {
                chapter.setParentId(tempIdToRealId.get(parentTempId));
                chapterRepository.save(chapter); // update
            }
        }

        // 3. Traitement des lignes et détails
        for (ChapterWithLinesDTO chapterDTO : fullDTO.getChapters()) {
            Chapter chapter = chapterDTO.getChapter();
            List<Long> sentLineIds = new ArrayList<>();

            for (MainTableLineWithDetailsDTO lineDTO : chapterDTO.getLines()) {
                MainTableLine line = lineDTO.getMainTableLine();
                line.setChapterId(chapter.getId());

                MainTableLine savedLine = mainTableLineRepository.save(line);
                sentLineIds.add(savedLine.getId());

                List<Long> sentDetailIds = new ArrayList<>();

                for (DetailTableLine detail : lineDTO.getDetails()) {
                    detail.setMainTableLineId(savedLine.getId());
                    DetailTableLine savedDetail = detailTableLineRepository.save(detail);
                    sentDetailIds.add(savedDetail.getId());
                }

                // Supprimer les détails retirés
                List<DetailTableLine> existingDetails = detailTableLineRepository.findByMainTableLineId(savedLine.getId());
                for (DetailTableLine existing : existingDetails) {
                    if (!sentDetailIds.contains(existing.getId())) {
                        detailTableLineRepository.delete(existing);
                    }
                }
            }

            // Supprimer les lignes principales retirées
            List<MainTableLine> existingLines = mainTableLineRepository.findByChapterId(chapter.getId());
            for (MainTableLine existing : existingLines) {
                if (!sentLineIds.contains(existing.getId())) {
                    mainTableLineRepository.delete(existing);
                }
            }
        }

        List<Chapter> existingChapters = chapterRepository.findByProjectId(id);
        Set<Long> sentChapterIdSet = new HashSet<>(sentChapterIds);

        for (Chapter existing : existingChapters) {
            if (!sentChapterIdSet.contains(existing.getId())) {
                deleteChapterRecursively(existing.getId());
            }
        }
    }

    private void deleteChapterRecursively(Long chapterId) {
        List<Chapter> children = chapterRepository.findAll().stream()
                .filter(ch -> chapterId.equals(ch.getParentId()))
                .toList();

        for (Chapter child : children) {
            deleteChapterRecursively(child.getId());
        }

        // Supprime les lignes principales + détails
        List<MainTableLine> lines = mainTableLineRepository.findByChapterId(chapterId);
        for (MainTableLine line : lines) {
            List<DetailTableLine> details = detailTableLineRepository.findByMainTableLineId(line.getId());
            detailTableLineRepository.deleteAll(details);
        }
        mainTableLineRepository.deleteAll(lines);

        // Supprime le chapitre lui-même
        chapterRepository.deleteById(chapterId);
    }
}
