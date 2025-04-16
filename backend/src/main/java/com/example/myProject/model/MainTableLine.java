package com.example.myProject.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "main_table_line")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MainTableLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chapter_id", nullable = false)
    private Long chapterId;

    private String gr;

    private String num;

    private String title;

    private String nm;

    private String unit;

    private Double quantity;

    @Column(name = "up")
    private Double unitPrice;

    @Column(name = "total_price")
    private Double totalPrice;

    private String comments;

    private Integer position;
}
