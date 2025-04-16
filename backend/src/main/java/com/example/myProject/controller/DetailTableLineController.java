package com.example.myProject.controller;

import com.example.myProject.dto.DetailTableLineRequestDTO;
import com.example.myProject.model.DetailTableLine;
import com.example.myProject.repository.DetailTableLineRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("myProject/api/detail-lines")
public class DetailTableLineController {

    private final DetailTableLineRepository repository;

    public DetailTableLineController(DetailTableLineRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/main-line/{mainLineId}")
    public List<DetailTableLine> getByMainLine(@PathVariable Long mainLineId) {
        return repository.findByMainTableLineId(mainLineId);
    }

    @PostMapping
    public DetailTableLine create(@RequestBody DetailTableLineRequestDTO dto) {
        return repository.save(
                DetailTableLine.builder()
                        .mainTableLineId(dto.getMainTableLineId())
                        .title(dto.getTitle())
                        .number(dto.getNumber())
                        .length(dto.getLength())
                        .width(dto.getWidth())
                        .height(dto.getHeight())
                        .factor(dto.getFactor())
                        .total(dto.getTotal())
                        .comments(dto.getComments())
                        .position(dto.getPosition())
                        .build()
        );
    }

    @PutMapping("/{id}")
    public DetailTableLine update(@PathVariable Long id, @RequestBody DetailTableLineRequestDTO dto) {
        DetailTableLine line = repository.findById(id).orElseThrow();
        line.setTitle(dto.getTitle());
        line.setNumber(dto.getNumber());
        line.setLength(dto.getLength());
        line.setWidth(dto.getWidth());
        line.setHeight(dto.getHeight());
        line.setFactor(dto.getFactor());
        line.setTotal(dto.getTotal());
        line.setComments(dto.getComments());
        line.setPosition(dto.getPosition());
        return repository.save(line);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
