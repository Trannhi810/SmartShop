package com.smartshop.dto.cart;

import lombok.Data;

@Data
public class CartItemRequest {
    private Long productId;
    private Integer quantity; // có thể null -> mặc định = 1
}


