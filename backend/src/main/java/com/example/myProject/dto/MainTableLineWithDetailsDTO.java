package com.example.myProject.dto;

import com.example.myProject.model.MainTableLine;
import com.example.myProject.model.DetailTableLine;
import lombok.Data;

import java.util.List;

@Data
public class MainTableLineWithDetailsDTO {
    private MainTableLine mainTableLine;
    private List<DetailTableLine> details;
}