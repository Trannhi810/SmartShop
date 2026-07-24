package com.smartshop.dto.product;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProductRequest {
    private String name;
    private String description;
    private Double price;
    private Integer stockQuantity;
    private Long categoryId;
    private Boolean isActive;
    private LocalDateTime createdAt;
}


