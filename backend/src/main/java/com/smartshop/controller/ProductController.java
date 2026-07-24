package com.smartshop.controller;

import com.smartshop.dto.product.ProductRequest;
import com.smartshop.dto.product.ProductResponse;
import com.smartshop.service.ProductExportService;
import com.smartshop.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/products")
@CrossOrigin
public class ProductController {

    private final ProductService productService;
    private final ProductExportService productExportService;

    public ProductController(ProductService productService,
                            ProductExportService productExportService) {
        this.productService = productService;
        this.productExportService = productExportService;
    }

    // ✅ Danh sách sản phẩm với phân trang và lọc (public)
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAll(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) Long category,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "minPrice", required = false) Double minPrice,
            @RequestParam(value = "maxPrice", required = false) Double maxPrice,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "12") int size,
            @RequestParam(value = "sort", defaultValue = "createdAt") String sort,
            @RequestParam(value = "direction", defaultValue = "desc") String direction,
            // Legacy parameters for backward compatibility
            @RequestParam(value = "q", required = false) String q,
            // Admin parameter: include inactive products
            @RequestParam(value = "includeInactive", defaultValue = "false") boolean includeInactive
    ) {
        // Support both "category" and "categoryId" parameters
        Long finalCategoryId = category != null ? category : categoryId;
        
        // Support both "keyword" and "q" parameters
        String finalKeyword = keyword != null ? keyword : q;
        
        // Use paginated search - admin can see all products including inactive
        Page<ProductResponse> result;
        if (includeInactive) {
            result = productService.searchAndFilterAll(
                    finalKeyword,
                    finalCategoryId,
                    minPrice,
                    maxPrice,
                    page,
                    size,
                    sort,
                    direction
            );
        } else {
            result = productService.searchAndFilter(
                    finalKeyword,
                    finalCategoryId,
                    minPrice,
                    maxPrice,
                    page,
                    size,
                    sort,
                    direction
            );
        }
        
        return ResponseEntity.ok(result);
    }

    // ✅ Chi tiết sản phẩm
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    // ✅ CRUD sản phẩm (Admin)

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> create(@RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id,
                                                  @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Upload ảnh Cloudinary cho sản phẩm
    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> uploadImage(@PathVariable Long id,
                                                       @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(productService.uploadImage(id, file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ✅ Toggle product status (Active/Inactive)
    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleStatus(id));
    }

    // ✅ Export to Excel
    @GetMapping("/export/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportToExcel() throws IOException {
        byte[] excelData = productExportService.exportToExcel().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "products.xlsx");
        headers.setContentLength(excelData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // ✅ Export to PDF
    @GetMapping("/export/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportToPdf() throws IOException {
        byte[] pdfData = productExportService.exportToPdf().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "products.pdf");
        headers.setContentLength(pdfData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfData);
    }
}


