package com.smartshop.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.smartshop.dto.product.ProductRequest;
import com.smartshop.dto.product.ProductResponse;
import com.smartshop.entity.product.Category;
import com.smartshop.entity.product.Product;
import com.smartshop.repository.CategoryRepository;
import com.smartshop.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final Cloudinary cloudinary;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          Cloudinary cloudinary) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.cloudinary = cloudinary;
    }

    // ✅ CRUD sản phẩm (Admin)

    public ProductResponse create(ProductRequest req) {
        Category category = req.getCategoryId() != null
                ? categoryRepository.findById(req.getCategoryId())
                .orElse(null)
                : null;

        Product product = Product.builder()
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .stockQuantity(req.getStockQuantity() != null ? req.getStockQuantity() : 0)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .category(category)
                .build();

        // Set createdAt if provided (before first save)
        // Note: @CreationTimestamp will auto-set if createdAt is null
        if (req.getCreatedAt() != null) {
            // Use reflection or direct field access to set before @CreationTimestamp runs
            // Since updatable=false, we need to set it before the first save
            product.setCreatedAt(req.getCreatedAt());
        }

        return ProductResponse.fromEntity(productRepository.save(product));
    }

    public ProductResponse update(Long id, ProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        if (req.getStockQuantity() != null) product.setStockQuantity(req.getStockQuantity());
        if (req.getIsActive() != null) product.setActive(req.getIsActive());

        if (req.getCategoryId() != null) {
            Category category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }

        return ProductResponse.fromEntity(productRepository.save(product));
    }

    public ProductResponse toggleStatus(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setActive(!product.isActive());
        return ProductResponse.fromEntity(productRepository.save(product));
    }

    public void delete(Long id) {
        productRepository.deleteById(id);
    }

    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return ProductResponse.fromEntity(p);
    }

    public List<ProductResponse> getAll() {
        return productRepository.findAll()
                .stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ✅ Upload ảnh Cloudinary cho sản phẩm

    public ProductResponse uploadImage(Long productId, MultipartFile file) throws IOException {
        // Validate product exists
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Validate file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be less than 10MB");
        }

        try {
            // Upload to Cloudinary
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "smartshop/products",
                            "resource_type", "image",
                            "format", "jpg"
                    ));

            String url = (String) uploadResult.get("secure_url");
            if (url == null) {
                throw new RuntimeException("Failed to get image URL from Cloudinary");
            }

            product.setImageUrl(url);
            return ProductResponse.fromEntity(productRepository.save(product));
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload image to Cloudinary: " + e.getMessage(), e);
        }
    }

    // ✅ Tìm kiếm sản phẩm + không dấu

    public List<ProductResponse> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getAll();
        }
        return productRepository.searchByNameIgnoreAccent(keyword)
                .stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ✅ Lọc theo danh mục

    public List<ProductResponse> getByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId)
                .stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ✅ Tìm kiếm và lọc với phân trang, sắp xếp
    public Page<ProductResponse> searchAndFilter(
            String keyword,
            Long categoryId,
            Double minPrice,
            Double maxPrice,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        // Tạo Sort object
        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC,
                getSortField(sortBy)
        );

        // Tạo Pageable
        Pageable pageable = PageRequest.of(page, size, sort);

        // Gọi repository method
        Page<Product> productPage = productRepository.searchAndFilter(
                keyword,
                categoryId,
                minPrice,
                maxPrice,
                pageable
        );

        // Convert to ProductResponse Page
        return productPage.map(ProductResponse::fromEntity);
    }

    // ✅ Tìm kiếm và lọc với phân trang, sắp xếp - lấy TẤT CẢ sản phẩm (cho admin)
    public Page<ProductResponse> searchAndFilterAll(
            String keyword,
            Long categoryId,
            Double minPrice,
            Double maxPrice,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        // Tạo Sort object
        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC,
                getSortField(sortBy)
        );

        // Tạo Pageable
        Pageable pageable = PageRequest.of(page, size, sort);

        // Gọi repository method (lấy tất cả, kể cả inactive)
        Page<Product> productPage = productRepository.searchAndFilterAll(
                keyword,
                categoryId,
                minPrice,
                maxPrice,
                pageable
        );

        // Convert to ProductResponse Page
        return productPage.map(ProductResponse::fromEntity);
    }

    // Helper method để map sort field từ frontend sang entity field
    private String getSortField(String sortBy) {
        if (sortBy == null || sortBy.isEmpty()) {
            return "id";
        }
        return switch (sortBy.toLowerCase()) {
            case "id" -> "id";
            case "price" -> "price";
            case "name" -> "name";
            case "stockquantity" -> "stockQuantity";
            case "createdat" -> "createdAt";
            default -> "id";
        };
    }
}


