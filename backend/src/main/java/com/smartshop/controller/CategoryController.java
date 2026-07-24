package com.smartshop.controller;

import com.smartshop.dto.category.CategoryRequest;
import com.smartshop.dto.category.CategoryResponse;
import com.smartshop.service.CategoryExportService;
import com.smartshop.service.CategoryService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin
public class CategoryController {

    private final CategoryService categoryService;
    private final CategoryExportService categoryExportService;

    public CategoryController(CategoryService categoryService,
                              CategoryExportService categoryExportService) {
        this.categoryService = categoryService;
        this.categoryExportService = categoryExportService;
    }

    // ✅ Danh sách danh mục (public)
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    // ✅ Chi tiết danh mục (public)
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getById(id));
    }

    // ✅ CRUD danh mục (Admin)

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> create(@RequestBody CategoryRequest req) {
        return ResponseEntity.ok(categoryService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> update(@PathVariable Long id,
                                                   @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(categoryService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Export to Excel
    @GetMapping("/export/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportToExcel() throws IOException {
        byte[] excelData = categoryExportService.exportToExcel().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "categories.xlsx");
        headers.setContentLength(excelData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // ✅ Export to PDF
    @GetMapping("/export/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportToPdf() throws IOException {
        byte[] pdfData = categoryExportService.exportToPdf().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "categories.pdf");
        headers.setContentLength(pdfData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfData);
    }
}


