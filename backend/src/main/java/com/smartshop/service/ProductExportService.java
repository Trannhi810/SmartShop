package com.smartshop.service;

import com.smartshop.dto.product.ProductResponse;
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
public class ProductExportService {

    private final ProductRepository productRepository;

    public ProductExportService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ByteArrayOutputStream exportToExcel() throws IOException {
        List<ProductResponse> products = productRepository.findAll()
                .stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());

        String[] headers = {
            "ID", "Tên sản phẩm", "Mô tả", "Giá (VNĐ)", "Số lượng tồn kho",
            "Danh mục", "Trạng thái", "Ngày tạo", "Ngày cập nhật"
        };

        List<Map<String, Object>> data = new ArrayList<>();
        for (ProductResponse product : products) {
            Map<String, Object> row = new HashMap<>();
            row.put("ID", product.getId());
            row.put("Tên sản phẩm", product.getName());
            row.put("Mô tả", product.getDescription() != null ? product.getDescription() : "");
            row.put("Giá (VNĐ)", product.getPrice() != null ? product.getPrice() : 0);
            row.put("Số lượng tồn kho", product.getStockQuantity() != null ? product.getStockQuantity() : 0);
            row.put("Danh mục", product.getCategoryName() != null ? product.getCategoryName() : "");
            row.put("Trạng thái", product.isActive() ? "Hoạt động" : "Đã vô hiệu");
            row.put("Ngày tạo", product.getCreatedAt());
            row.put("Ngày cập nhật", product.getUpdatedAt());
            data.add(row);
        }

        return ExcelExportUtil.createExcelFile("Sản phẩm", headers, data);
    }

    public ByteArrayOutputStream exportToPdf() throws IOException {
        try {
            List<ProductResponse> products = productRepository.findAll()
                    .stream()
                    .map(ProductResponse::fromEntity)
                    .collect(Collectors.toList());

            String[] headers = {
                "ID", "Tên sản phẩm", "Giá (VNĐ)", "Số lượng", "Danh mục", "Trạng thái", "Ngày tạo"
            };

            List<Map<String, Object>> data = new ArrayList<>();
            for (ProductResponse product : products) {
                Map<String, Object> row = new HashMap<>();
                row.put("ID", product.getId());
                row.put("Tên sản phẩm", product.getName() != null ? product.getName() : "");
                row.put("Giá (VNĐ)", product.getPrice() != null ? product.getPrice() : 0);
                row.put("Số lượng", product.getStockQuantity() != null ? product.getStockQuantity() : 0);
                row.put("Danh mục", product.getCategoryName() != null ? product.getCategoryName() : "");
                row.put("Trạng thái", product.isActive() ? "Hoạt động" : "Đã vô hiệu");
                row.put("Ngày tạo", product.getCreatedAt());
                data.add(row);
            }

            return PdfExportUtil.createPdfFile("BÁO CÁO SẢN PHẨM", headers, data);
        } catch (com.itextpdf.text.DocumentException e) {
            throw new IOException("Error creating PDF: " + e.getMessage(), e);
        }
    }
}

