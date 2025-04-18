package com.example.myProject.dto;

import com.example.myProject.model.Project;
import lombok.Data;

import java.util.List;

@Data
public class ProjectFullDTO {
    private Project project;
    private List<ChapterWithLinesDTO> chapters;
}
