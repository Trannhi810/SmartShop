package com.smartshop.repository;

import com.smartshop.entity.product.Product;
import com.smartshop.entity.review.Review;
import com.smartshop.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductOrderByCreatedAtDesc(Product product);

    Optional<Review> findByProductAndUser(Product product, User user);

    // Tính rating trung bình
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product = :product")
    Double findAverageRatingByProduct(@Param("product") Product product);

    // Admin: Lọc theo sản phẩm
    Page<Review> findByProduct(Product product, Pageable pageable);

    // Admin: Lọc theo user
    Page<Review> findByUser(User user, Pageable pageable);

    // Admin: Lọc theo rating
    Page<Review> findByRating(Integer rating, Pageable pageable);

    // Admin: Lọc theo khoảng thời gian
    Page<Review> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // Lấy review mới nhất theo product
    @Query("SELECT r FROM Review r WHERE r.product = :product ORDER BY r.createdAt DESC")
    Page<Review> findLatestByProduct(@Param("product") Product product, Pageable pageable);
}


