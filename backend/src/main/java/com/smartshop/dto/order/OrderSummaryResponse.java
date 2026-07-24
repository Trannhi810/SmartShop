package com.smartshop.dto.order;

import com.smartshop.entity.order.Order;
import com.smartshop.entity.order.OrderItem;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class OrderSummaryResponse {
    private Long id;
    private String orderNumber;
    private Double totalAmount;
    private String status;
    private String paymentStatus;
    private LocalDateTime createdAt;
    
    // Customer information
    private String customerName;
    private String customerEmail;
    
    // Order items
    private List<OrderItemSummary> items;

    @Data
    @Builder
    public static class OrderItemSummary {
        private Long productId;
        private String productName;
        private String variantName;
        private String imageUrl;
        private Double price;
        private Integer quantity;
        private Double lineTotal;
        
        public static OrderItemSummary fromEntity(OrderItem item) {
            double price = item.getPrice();
            int qty = item.getQuantity();
            String productName = item.getProduct() != null ? item.getProduct().getName() : "N/A";
            String imageUrl = item.getImageUrl();
            if ((imageUrl == null || imageUrl.isBlank()) && item.getProduct() != null) {
                imageUrl = item.getProduct().getImageUrl();
            }
            
            return OrderItemSummary.builder()
                    .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                    .productName(productName)
                    .variantName(null) // TODO: Add variant support if needed
                    .imageUrl(imageUrl)
                    .price(price)
                    .quantity(qty)
                    .lineTotal(price * qty)
                    .build();
        }
    }

    public static OrderSummaryResponse fromEntity(Order o) {
        String customerName = null;
        String customerEmail = null;
        if (o.getUser() != null) {
            customerName = o.getUser().getFullName() != null ? o.getUser().getFullName() : o.getUser().getUsername();
            customerEmail = o.getUser().getEmail();
        }
        
        List<OrderItemSummary> items = o.getItems() != null ? 
            o.getItems().stream()
                .map(OrderItemSummary::fromEntity)
                .collect(Collectors.toList()) : 
            List.of();
        
        return OrderSummaryResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .paymentStatus(o.getPaymentStatus())
                .createdAt(o.getCreatedAt())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .items(items)
                .build();
    }
}


