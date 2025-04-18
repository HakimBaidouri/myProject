package com.example.myProject.dto;

import com.example.myProject.model.Chapter;
import lombok.Data;

import java.util.List;

@Data
public class ChapterWithLinesDTO {
    private Chapter chapter;
    private List<MainTableLineWithDetailsDTO> lines;
}
