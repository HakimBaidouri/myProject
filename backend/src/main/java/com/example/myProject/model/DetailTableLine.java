package com.example.myProject.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "detail_table_line")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetailTableLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "main_table_line_id", nullable = false)
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