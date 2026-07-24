package com.smartshop.dto.order;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutResponse {
    private Long orderId;
    private String orderNumber;
    private Double originalTotal;
    private Double discount;
    private Double finalTotal;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
}


