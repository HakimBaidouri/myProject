package com.example.myProject.dto;

import lombok.Data;

@Data
public class ProjectResponseDTO {
    private Long id;
    private String name;
    private Long userId;
    private Long companyId;
}