package com.smartshop.service;

import com.smartshop.dto.category.CategoryRequest;
import com.smartshop.dto.category.CategoryResponse;
import com.smartshop.entity.product.Category;
import com.smartshop.repository.CategoryRepository;
import com.smartshop.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository,
                          ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll()
                .stream()
                .map(category -> {
                    // Count products for this category
                    int productCount = productRepository.countByCategoryId(category.getId());
                    return CategoryResponse.fromEntity(category, productCount);
                })
                .collect(Collectors.toList());
    }

    public CategoryResponse getById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        // Count products for this category
        int productCount = productRepository.countByCategoryId(id);
        return CategoryResponse.fromEntity(category, productCount);
    }

    public CategoryResponse create(CategoryRequest req) {
        Category category = Category.builder()
                .name(req.getName())
                .description(req.getDescription())
                .build();

        Category savedCategory = categoryRepository.save(category);
        // Count products for the new category (will be 0 for new category)
        int productCount = productRepository.countByCategoryId(savedCategory.getId());
        return CategoryResponse.fromEntity(savedCategory, productCount);
    }

    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(req.getName());
        category.setDescription(req.getDescription());

        Category savedCategory = categoryRepository.save(category);
        // Count products for the updated category
        int productCount = productRepository.countByCategoryId(savedCategory.getId());
        return CategoryResponse.fromEntity(savedCategory, productCount);
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }
}


