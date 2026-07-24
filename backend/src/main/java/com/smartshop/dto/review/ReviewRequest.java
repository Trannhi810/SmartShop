package com.smartshop.dto.review;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class ReviewRequest {
    private Long productId;
    private int rating;               // 1 - 5
    private String comment;

    // Ảnh / video review (tùy chọn)
    private List<MultipartFile> files;
}


