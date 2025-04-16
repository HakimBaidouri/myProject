package com.example.myProject.dto;

import lombok.Data;

@Data
public class ProjectRequestDTO {
    private String name;
    private Long userId;
    private Long companyId;
}
