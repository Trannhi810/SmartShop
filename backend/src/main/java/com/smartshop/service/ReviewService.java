package com.smartshop.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.smartshop.dto.review.ReviewRequest;
import com.smartshop.dto.review.ReviewResponse;
import com.smartshop.entity.enums.MediaType;
import com.smartshop.entity.order.Order;
import com.smartshop.entity.product.Product;
import com.smartshop.entity.review.Review;
import com.smartshop.entity.review.ReviewMedia;
import com.smartshop.entity.user.User;
import com.smartshop.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewMediaRepository reviewMediaRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final Cloudinary cloudinary;

    // Cấu hình: có yêu cầu đã mua sản phẩm mới được bình luận không?
    @Value("${app.review.require-purchase:false}")
    private boolean requirePurchase;

    public ReviewService(ReviewRepository reviewRepository,
                         ReviewMediaRepository reviewMediaRepository,
                         ProductRepository productRepository,
                         OrderRepository orderRepository,
                         Cloudinary cloudinary) {
        this.reviewRepository = reviewRepository;
        this.reviewMediaRepository = reviewMediaRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.cloudinary = cloudinary;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() instanceof String) {
            return null;
        }
        return (User) auth.getPrincipal();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    // Kiểm tra user đã mua sản phẩm chưa
    private boolean hasPurchasedProduct(User user, Product product) {
        if (user == null) return false;
        List<Order> orders = orderRepository.findByUser(user);
        return orders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()) || "DELIVERED".equals(o.getStatus()))
                .flatMap(o -> o.getItems().stream())
                .anyMatch(oi -> oi.getProduct() != null && oi.getProduct().getId().equals(product.getId()));
    }

    // Tạo đánh giá mới
    public ReviewResponse createReview(ReviewRequest req) throws IOException {
        User user = getCurrentUser();
        if (user == null) {
            throw new RuntimeException("Bạn cần đăng nhập để bình luận");
        }

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        // Kiểm tra quy tắc: nếu yêu cầu đã mua thì phải kiểm tra
        if (requirePurchase && !hasPurchasedProduct(user, product)) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá sản phẩm đã mua");
        }

        // Kiểm tra đã bình luận chưa (mỗi user chỉ được bình luận 1 lần cho 1 sản phẩm)
        if (reviewRepository.findByProductAndUser(product, user).isPresent()) {
            throw new RuntimeException("Bạn đã bình luận sản phẩm này rồi. Vui lòng sửa bình luận hiện có.");
        }

        int rating = req.getRating();
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Đánh giá phải từ 1 đến 5 sao");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(rating)
                .comment(req.getComment())
                .build();

        review = reviewRepository.save(review);

        // Upload ảnh/video review (nếu có)
        if (req.getFiles() != null && !req.getFiles().isEmpty()) {
            for (MultipartFile file : req.getFiles()) {
                String contentType = file.getContentType();
                MediaType mediaType = (contentType != null && contentType.startsWith("video/")) 
                    ? MediaType.VIDEO 
                    : MediaType.IMAGE;

                var uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap("folder", "smartshop/reviews"));
                String url = (String) uploadResult.get("secure_url");

                ReviewMedia media = ReviewMedia.builder()
                        .review(review)
                        .url(url)
                        .type(mediaType)
                        .build();
                reviewMediaRepository.save(media);
            }
        }

        Review saved = reviewRepository.findById(review.getId()).orElse(review);
        return ReviewResponse.fromEntity(saved);
    }

    // Sửa bình luận (chỉ user sở hữu)
    public ReviewResponse updateReview(Long reviewId, ReviewRequest req) throws IOException {
        User user = getCurrentUser();
        if (user == null) {
            throw new RuntimeException("Bạn cần đăng nhập");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        // Chỉ user sở hữu mới được sửa
        if (!review.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền sửa bình luận này");
        }

        int rating = req.getRating();
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Đánh giá phải từ 1 đến 5 sao");
        }

        review.setRating(rating);
        review.setComment(req.getComment());
        review = reviewRepository.save(review);

        // Xóa media cũ nếu có file mới
        if (req.getFiles() != null && !req.getFiles().isEmpty()) {
            review.getMedia().clear();
            reviewMediaRepository.deleteAll(review.getMedia());

            // Upload media mới
            for (MultipartFile file : req.getFiles()) {
                String contentType = file.getContentType();
                MediaType mediaType = (contentType != null && contentType.startsWith("video/")) 
                    ? MediaType.VIDEO 
                    : MediaType.IMAGE;

                var uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap("folder", "smartshop/reviews"));
                String url = (String) uploadResult.get("secure_url");

                ReviewMedia media = ReviewMedia.builder()
                        .review(review)
                        .url(url)
                        .type(mediaType)
                        .build();
                reviewMediaRepository.save(media);
            }
        }

        Review saved = reviewRepository.findById(review.getId()).orElse(review);
        return ReviewResponse.fromEntity(saved);
    }

    // Xóa bình luận (user sở hữu hoặc admin)
    public void deleteReview(Long reviewId) {
        User user = getCurrentUser();
        if (user == null) {
            throw new RuntimeException("Bạn cần đăng nhập");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        // Chỉ user sở hữu hoặc admin mới được xóa
        if (!review.getUser().getId().equals(user.getId()) && !isAdmin()) {
            throw new RuntimeException("Bạn không có quyền xóa bình luận này");
        }

        reviewRepository.delete(review);
    }

    // Xem danh sách review theo sản phẩm
    public List<ReviewResponse> getReviewsByProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        return reviewRepository.findByProductOrderByCreatedAtDesc(product).stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Tính rating trung bình cho sản phẩm
    public Double getAverageRating(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        return reviewRepository.findAverageRatingByProduct(product);
    }

    // Lấy thống kê rating cho sản phẩm (số lượng theo từng sao)
    public ProductRatingStats getProductRatingStats(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        List<Review> reviews = reviewRepository.findByProductOrderByCreatedAtDesc(product);
        long total = reviews.size();
        if (total == 0) {
            return ProductRatingStats.builder()
                    .total(0)
                    .average(0.0)
                    .rating1(0)
                    .rating2(0)
                    .rating3(0)
                    .rating4(0)
                    .rating5(0)
                    .build();
        }

        double average = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        long rating1 = reviews.stream().filter(r -> r.getRating() == 1).count();
        long rating2 = reviews.stream().filter(r -> r.getRating() == 2).count();
        long rating3 = reviews.stream().filter(r -> r.getRating() == 3).count();
        long rating4 = reviews.stream().filter(r -> r.getRating() == 4).count();
        long rating5 = reviews.stream().filter(r -> r.getRating() == 5).count();

        return ProductRatingStats.builder()
                .total(total)
                .average(Math.round(average * 10.0) / 10.0)
                .rating1(rating1)
                .rating2(rating2)
                .rating3(rating3)
                .rating4(rating4)
                .rating5(rating5)
                .build();
    }

    // Admin: Xem tất cả review (có phân trang và lọc)
    public Page<ReviewResponse> getAllReviews(Pageable pageable, Long productId, Long userId, 
                                               Integer rating, LocalDateTime startDate, LocalDateTime endDate) {
        Page<Review> reviews;
        
        if (productId != null) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
            reviews = reviewRepository.findByProduct(product, pageable);
        } else if (userId != null) {
            User user = new User();
            user.setId(userId);
            reviews = reviewRepository.findByUser(user, pageable);
        } else if (rating != null) {
            reviews = reviewRepository.findByRating(rating, pageable);
        } else if (startDate != null && endDate != null) {
            reviews = reviewRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        } else {
            reviews = reviewRepository.findAll(pageable);
        }

        return reviews.map(ReviewResponse::fromEntity);
    }

    // Admin: Trả lời bình luận
    public ReviewResponse replyToReview(Long reviewId, String replyComment) {
        if (!isAdmin()) {
            throw new RuntimeException("Chỉ admin mới có quyền trả lời bình luận");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        review.setReplyComment(replyComment);
        review.setReplyAt(LocalDateTime.now());
        review = reviewRepository.save(review);

        return ReviewResponse.fromEntity(review);
    }

    // DTO cho thống kê rating
    @lombok.Data
    @lombok.Builder
    public static class ProductRatingStats {
        private long total;
        private double average;
        private long rating1;
        private long rating2;
        private long rating3;
        private long rating4;
        private long rating5;
    }
}


