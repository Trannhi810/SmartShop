package com.smartshop.dto.voucher;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VoucherRequest {
    private String code;
    // "PERCENTAGE" hoặc "FIXED_AMOUNT"
    private String type;
    private Double value;
    private Double minOrder;
    // Áp dụng cho danh mục nào (null = tất cả)
    private Long categoryId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
}


