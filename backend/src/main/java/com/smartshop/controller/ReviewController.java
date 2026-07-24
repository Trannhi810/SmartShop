package com.smartshop.controller;

import com.smartshop.dto.review.ReviewRequest;
import com.smartshop.dto.review.ReviewResponse;
import com.smartshop.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // ✅ 1. Tạo bình luận mới (chỉ user đã đăng nhập)
    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> createReview(
            @RequestParam("productId") Long productId,
            @RequestParam("rating") Integer rating,
            @RequestParam(value = "comment", required = false) String comment,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws IOException {

        ReviewRequest req = new ReviewRequest();
        req.setProductId(productId);
        req.setRating(rating != null ? rating : 5);
        req.setComment(comment);
        req.setFiles(files);

        return ResponseEntity.ok(reviewService.createReview(req));
    }

    // ✅ 3. Sửa bình luận (chỉ user sở hữu)
    @PutMapping(value = "/{reviewId}", consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @RequestParam("rating") Integer rating,
            @RequestParam(value = "comment", required = false) String comment,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws IOException {

        ReviewRequest req = new ReviewRequest();
        req.setRating(rating != null ? rating : 5);
        req.setComment(comment);
        req.setFiles(files);

        return ResponseEntity.ok(reviewService.updateReview(reviewId, req));
    }

    // ✅ 4. Xóa bình luận (user sở hữu hoặc admin)
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Xóa bình luận thành công");
        return ResponseEntity.ok(response);
    }

    // ✅ 2. Xem danh sách bình luận theo sản phẩm
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviewsByProduct(productId));
    }

    // ✅ 6. Lấy rating trung bình và thống kê cho sản phẩm
    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<Map<String, Object>> getProductRatingStats(@PathVariable Long productId) {
        ReviewService.ProductRatingStats stats = reviewService.getProductRatingStats(productId);
        Map<String, Object> response = new HashMap<>();
        response.put("total", stats.getTotal());
        response.put("average", stats.getAverage());
        response.put("rating1", stats.getRating1());
        response.put("rating2", stats.getRating2());
        response.put("rating3", stats.getRating3());
        response.put("rating4", stats.getRating4());
        response.put("rating5", stats.getRating5());
        return ResponseEntity.ok(response);
    }

    // ✅ 5. Admin: Xem tất cả bình luận (có phân trang và lọc)
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ReviewResponse>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getAllReviews(pageable, productId, userId, rating, startDate, endDate));
    }

    // Admin: Xóa bình luận vi phạm
    @DeleteMapping("/admin/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminDeleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin đã xóa bình luận thành công");
        return ResponseEntity.ok(response);
    }

    // Admin: Trả lời bình luận
    @PostMapping("/{reviewId}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> replyToReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> request) {
        String replyComment = request.get("replyComment");
        if (replyComment == null || replyComment.trim().isEmpty()) {
            throw new RuntimeException("Nội dung trả lời không được để trống");
        }
        return ResponseEntity.ok(reviewService.replyToReview(reviewId, replyComment));
    }
}


