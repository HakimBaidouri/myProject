package com.example.myProject.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chapter")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "parent_id")
    private Long parentId;

    private String num;

    private String label;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Transient
    private String parentTempId;

    @Transient
    private String tempId;
}
