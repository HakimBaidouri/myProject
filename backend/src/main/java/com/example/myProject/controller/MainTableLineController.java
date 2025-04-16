package com.example.myProject.controller;

import com.example.myProject.dto.MainTableLineRequestDTO;
import com.example.myProject.model.MainTableLine;
import com.example.myProject.repository.MainTableLineRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("myProject/api/main-lines")
public class MainTableLineController {

    private final MainTableLineRepository repository;

    public MainTableLineController(MainTableLineRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/chapter/{chapterId}")
    public List<MainTableLine> getByChapter(@PathVariable Long chapterId) {
        return repository.findByChapterId(chapterId);
    }

    @PostMapping
    public MainTableLine create(@RequestBody MainTableLineRequestDTO dto) {
        return repository.save(
                MainTableLine.builder()
                        .chapterId(dto.getChapterId())
                        .gr(dto.getGr())
                        .num(dto.getNum())
                        .title(dto.getTitle())
                        .nm(dto.getNm())
                        .unit(dto.getUnit())
                        .quantity(dto.getQuantity())
                        .unitPrice(dto.getUnitPrice())
                        .totalPrice(dto.getTotalPrice())
                        .comments(dto.getComments())
                        .position(dto.getPosition())
                        .build()
        );
    }

    @PutMapping("/{id}")
    public MainTableLine update(@PathVariable Long id, @RequestBody MainTableLineRequestDTO dto) {
        MainTableLine line = repository.findById(id).orElseThrow();
        line.setGr(dto.getGr());
        line.setNum(dto.getNum());
        line.setTitle(dto.getTitle());
        line.setNm(dto.getNm());
        line.setUnit(dto.getUnit());
        line.setQuantity(dto.getQuantity());
        line.setUnitPrice(dto.getUnitPrice());
        line.setTotalPrice(dto.getTotalPrice());
        line.setComments(dto.getComments());
        line.setPosition(dto.getPosition());
        return repository.save(line);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
