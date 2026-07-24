package com.smartshop.repository;

import com.smartshop.entity.product.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryId(Long categoryId);

    // Count products by category ID
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId")
    int countByCategoryId(@Param("categoryId") Long categoryId);

    // Tìm kiếm không dấu: dùng hàm LOWER + REPLACE trong SQL (MySQL)
    @Query("""
           SELECT p FROM Product p
           WHERE
             LOWER(FUNCTION('REPLACE', FUNCTION('REPLACE', FUNCTION('REPLACE', p.name, 'đ', 'd'), 'Đ', 'D'), ' ', ''))
             LIKE LOWER(CONCAT('%', FUNCTION('REPLACE', FUNCTION('REPLACE', :keyword, 'đ', 'd'), 'Đ', 'D'), '%'))
           """)
    List<Product> searchByNameIgnoreAccent(@Param("keyword") String keyword);

    // Tìm kiếm và lọc với phân trang - chỉ lấy sản phẩm active
    @Query("""
           SELECT p FROM Product p
           WHERE p.isActive = true
             AND (:keyword IS NULL OR :keyword = '' OR 
                  LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
             AND (:categoryId IS NULL OR p.category.id = :categoryId)
             AND (:minPrice IS NULL OR p.price >= :minPrice)
             AND (:maxPrice IS NULL OR p.price <= :maxPrice)
           """)
    Page<Product> searchAndFilter(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            Pageable pageable
    );

    // Tìm kiếm và lọc với phân trang - lấy TẤT CẢ sản phẩm (cho admin)
    @Query("""
           SELECT p FROM Product p
           WHERE (:keyword IS NULL OR :keyword = '' OR 
                  LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
             AND (:categoryId IS NULL OR p.category.id = :categoryId)
             AND (:minPrice IS NULL OR p.price >= :minPrice)
             AND (:maxPrice IS NULL OR p.price <= :maxPrice)
           """)
    Page<Product> searchAndFilterAll(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            Pageable pageable
    );
}


