package com.example.myProject.dto;

import lombok.Data;

@Data
public class MainTableLineRequestDTO {
    private Long chapterId;
    private String gr;
    private String num;
    private String title;
    private String nm;
    private String unit;
    private Double quantity;
    private Double unitPrice;
    private Double totalPrice;
    private String comments;
    private Integer position;
}
