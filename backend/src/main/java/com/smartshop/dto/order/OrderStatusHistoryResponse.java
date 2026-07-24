package com.smartshop.dto.order;

import com.smartshop.entity.order.OrderStatusHistory;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OrderStatusHistoryResponse {
    private String oldStatus;
    private String newStatus;
    private LocalDateTime changedAt;

    public static OrderStatusHistoryResponse fromEntity(OrderStatusHistory h) {
        return OrderStatusHistoryResponse.builder()
                .oldStatus(h.getOldStatus())
                .newStatus(h.getNewStatus())
                .changedAt(h.getCreatedAt())
                .build();
    }
}


