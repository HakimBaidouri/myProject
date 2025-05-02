package com.example.myProject.dto;

import lombok.Data;

@Data
public class ChapterResponseDTO {
    private Long id;
    private Long projectId;
    private Long parentId;
    private String num;
    private String label;
    private String content;
}
