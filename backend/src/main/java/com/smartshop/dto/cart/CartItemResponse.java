package com.smartshop.dto.cart;

import com.smartshop.entity.cart.CartItem;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartItemResponse {
    private Long productId;
    private String productName;
    private Double price;
    private Integer quantity;
    private Double lineTotal;
    private String imageUrl;

    public static CartItemResponse fromEntity(CartItem item) {
        Double price = item.getProduct().getPrice();
        Integer qty = item.getQuantity();
        return CartItemResponse.builder()
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .price(price)
                .quantity(qty)
                .lineTotal(price * qty)
                .imageUrl(item.getProduct().getImageUrl())
                .build();
    }
}


