package com.example.myProject.dto;

import lombok.Data;

@Data
public class DetailTableLineRequestDTO {
    private Long mainTableLineId;
    private String title;
    private Double number;
    private Double length;
    private Double width;
    private Double height;
    private Double factor;
    private Double total;
    private String comments;
    private Integer position;
}