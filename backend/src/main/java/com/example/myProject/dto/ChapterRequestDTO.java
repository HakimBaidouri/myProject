package com.example.myProject.dto;

import lombok.Data;

@Data
public class ChapterRequestDTO {
    private Long projectId;
    private Long parentId; // peut être null
    private String num;
    private String label;
    private String content; // contenu HTML du chapitre
}