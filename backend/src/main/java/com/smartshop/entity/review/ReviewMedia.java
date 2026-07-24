package com.smartshop.entity.review;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.smartshop.entity.enums.MediaType;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(nullable = false)
    private String url;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private MediaType type = MediaType.IMAGE;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}