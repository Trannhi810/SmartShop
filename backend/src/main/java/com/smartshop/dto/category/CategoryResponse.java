package com.smartshop.dto.category;

import com.smartshop.entity.product.Category;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private Integer productCount;

    public static CategoryResponse fromEntity(Category c) {
        return fromEntity(c, 0);
    }

    public static CategoryResponse fromEntity(Category c, Integer productCount) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .productCount(productCount)
                .build();
    }
}


