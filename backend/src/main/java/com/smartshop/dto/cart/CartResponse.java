package com.smartshop.dto.cart;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CartResponse {
    private List<CartItemResponse> items;
    private Double totalAmount;
    private Integer totalQuantity;
}


