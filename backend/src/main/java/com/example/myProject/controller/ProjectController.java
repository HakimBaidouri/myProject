package com.example.myProject.controller;

import com.example.myProject.dto.ProjectRequestDTO;
import com.example.myProject.dto.ProjectResponseDTO;
import com.example.myProject.model.Project;
import com.example.myProject.repository.ProjectRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/myProject/api/projects")
public class ProjectController {

    private final ProjectRepository repository;

    public ProjectController(ProjectRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Project> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Project getById(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    public Project create(@RequestBody ProjectRequestDTO dto) {
        Project project = Project.builder()
                .name(dto.getName())
                .userId(dto.getUserId())
                .companyId(dto.getCompanyId())
                .build();
        return repository.save(project);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable Long id, @RequestBody ProjectRequestDTO dto) {
        Project project = repository.findById(id).orElseThrow();
        project.setName(dto.getName());
        project.setUserId(dto.getUserId());
        project.setCompanyId(dto.getCompanyId());
        return repository.save(project);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
