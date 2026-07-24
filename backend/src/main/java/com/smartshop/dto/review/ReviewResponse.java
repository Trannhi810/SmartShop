package com.smartshop.dto.review;

import com.smartshop.entity.review.Review;
import com.smartshop.entity.review.ReviewMedia;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String avatar;
    private Long productId;
    private String productName;
    private int rating;
    private String comment;
    private String replyComment; // Nội dung shop trả lời
    private LocalDateTime replyAt; // Thời gian shop trả lời
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isEdited; // Đánh dấu đã chỉnh sửa
    private List<String> mediaUrls;
    private List<MediaInfo> media; // Thông tin chi tiết về media (url + type)

    @Data
    @Builder
    public static class MediaInfo {
        private String url;
        private String type; // IMAGE hoặc VIDEO
    }

    public static ReviewResponse fromEntity(Review review) {
        List<String> urls = review.getMedia().stream()
                .map(ReviewMedia::getUrl)
                .collect(Collectors.toList());

        List<MediaInfo> mediaInfo = review.getMedia().stream()
                .map(m -> MediaInfo.builder()
                        .url(m.getUrl())
                        .type(m.getType().name())
                        .build())
                .collect(Collectors.toList());

        boolean isEdited = review.getUpdatedAt() != null && 
                          review.getUpdatedAt().isAfter(review.getCreatedAt());

        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .username(review.getUser().getUsername())
                .fullName(review.getUser().getFullName())
                .avatar(review.getUser().getAvatar())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .replyComment(review.getReplyComment())
                .replyAt(review.getReplyAt())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .isEdited(isEdited)
                .mediaUrls(urls)
                .media(mediaInfo)
                .build();
    }
}


