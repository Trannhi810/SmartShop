package com.smartshop.dto.order;

import lombok.Data;

@Data
public class UpdateOrderStatusRequest {
    // Ví dụ: PENDING, PROCESSING, SHIPPING, COMPLETED, CANCELLED
    private String newStatus;
}


