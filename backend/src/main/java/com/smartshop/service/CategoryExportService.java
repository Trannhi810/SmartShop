package com.smartshop.service;

import com.smartshop.dto.category.CategoryResponse;
import com.smartshop.repository.CategoryRepository;
import com.smartshop.repository.ProductRepository;
import com.smartshop.util.ExcelExportUtil;
import com.smartshop.util.PdfExportUtil;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryExportService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryExportService(CategoryRepository categoryRepository,
                                 ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public ByteArrayOutputStream exportToExcel() throws IOException {
        List<CategoryResponse> categories = categoryRepository.findAll()
                .stream()
                .map(category -> {
                    int productCount = productRepository.countByCategoryId(category.getId());
                    return CategoryResponse.fromEntity(category, productCount);
                })
                .collect(Collectors.toList());

        String[] headers = {
            "ID", "Tên danh mục", "Mô tả", "Số sản phẩm"
        };

        List<Map<String, Object>> data = new ArrayList<>();
        for (CategoryResponse category : categories) {
            Map<String, Object> row = new HashMap<>();
            row.put("ID", category.getId());
            row.put("Tên danh mục", category.getName());
            row.put("Mô tả", category.getDescription() != null ? category.getDescription() : "");
            row.put("Số sản phẩm", category.getProductCount() != null ? category.getProductCount() : 0);
            data.add(row);
        }

        return ExcelExportUtil.createExcelFile("Danh mục", headers, data);
    }

    public ByteArrayOutputStream exportToPdf() throws IOException {
        try {
            List<CategoryResponse> categories = categoryRepository.findAll()
                    .stream()
                    .map(category -> {
                        int productCount = productRepository.countByCategoryId(category.getId());
                        return CategoryResponse.fromEntity(category, productCount);
                    })
                    .collect(Collectors.toList());

            String[] headers = {
                "ID", "Tên danh mục", "Mô tả", "Số sản phẩm"
            };

            List<Map<String, Object>> data = new ArrayList<>();
            for (CategoryResponse category : categories) {
                Map<String, Object> row = new HashMap<>();
                row.put("ID", category.getId());
                row.put("Tên danh mục", category.getName() != null ? category.getName() : "");
                row.put("Mô tả", category.getDescription() != null ? category.getDescription() : "");
                row.put("Số sản phẩm", category.getProductCount() != null ? category.getProductCount() : 0);
                data.add(row);
            }

            return PdfExportUtil.createPdfFile("BÁO CÁO DANH MỤC", headers, data);
        } catch (com.itextpdf.text.DocumentException e) {
            throw new IOException("Error creating PDF: " + e.getMessage(), e);
        }
    }
}

