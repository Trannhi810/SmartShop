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
public class OrderDetailResponse {
    private Long id;
    private String orderNumber;
    private Double totalAmount;
    private String voucherCode;
    private Double voucherDiscount;
    private Double shippingFee;
    private Double paidAmount; // Số tiền đã thanh toán
    private Double finalTotal; // Tổng cộng cuối cùng (sau khi trừ đã thanh toán)
    private String status;
    private String paymentStatus;
    private String paymentMethod;
    private String shippingAddress;
    private LocalDateTime createdAt;

    // Customer information
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private List<OrderItemResponse> items;
    private List<OrderStatusHistoryResponse> statusHistory;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long productId;
        private String productName;
	    private String imageUrl;
        private Double price;
        private Integer quantity;
        private Double lineTotal;

        public static OrderItemResponse fromEntity(OrderItem item) {
            double price = item.getPrice();
            int qty = item.getQuantity();
            return OrderItemResponse.builder()
                    .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                    .productName(item.getProduct() != null ? item.getProduct().getName() : "N/A")
				.imageUrl(item.getImageUrl() != null ? item.getImageUrl() :
						(item.getProduct() != null ? item.getProduct().getImageUrl() : null))
                    .price(price)
                    .quantity(qty)
                    .lineTotal(price * qty)
                    .build();
        }
    }

    public static OrderDetailResponse fromEntity(Order o, List<OrderStatusHistoryResponse> history) {
        return fromEntity(o, history, 0.0);
    }
    
    public static OrderDetailResponse fromEntity(Order o, List<OrderStatusHistoryResponse> history, Double paidAmountParam) {
        List<OrderItemResponse> itemResponses = o.getItems().stream()
                .map(OrderItemResponse::fromEntity)
                .collect(Collectors.toList());

        // Calculate subtotal from items
        double subtotal = itemResponses.stream()
                .mapToDouble(item -> item.getLineTotal())
                .sum();
        
        // Get shipping fee from Order entity (if available), otherwise calculate
        double shippingFee = 0.0;
        if (o.getShippingFee() != null) {
            shippingFee = o.getShippingFee();
        } else {
            // Fallback: calculate from totalAmount if shippingFee is not stored
            double voucherDiscount = o.getVoucherDiscount() != null ? o.getVoucherDiscount() : 0.0;
            double subtotalAfterDiscount = subtotal - voucherDiscount;
            double totalAmount = o.getTotalAmount() != null ? o.getTotalAmount() : 0.0;
            shippingFee = Math.max(0, totalAmount - subtotalAfterDiscount);
        }
        
        double voucherDiscount = o.getVoucherDiscount() != null ? o.getVoucherDiscount() : 0.0;
        double totalAmount = o.getTotalAmount() != null ? o.getTotalAmount() : 0.0;
        
        // Tính số tiền đã thanh toán và tổng cộng cuối cùng
        double paidAmount = paidAmountParam != null ? paidAmountParam : 0.0;
        double finalTotal = totalAmount - paidAmount; // Tổng cộng = tổng ban đầu - đã thanh toán

        // Get customer information
        String customerName = null;
        String customerEmail = null;
        String customerPhone = null;
        String shippingAddress = o.getShippingAddress();
        String parsedAddress = shippingAddress;
        
        if (o.getUser() != null) {
            customerName = o.getUser().getFullName() != null ? o.getUser().getFullName() : o.getUser().getUsername();
            customerEmail = o.getUser().getEmail();
        }
        
        // Parse shippingAddress to extract phone, fullName, and address
        // Format: "fullName - phone\naddress"
        if (shippingAddress != null && !shippingAddress.isEmpty()) {
            String[] parts = shippingAddress.split("\n", 2);
            if (parts.length > 0) {
                String namePhonePart = parts[0].trim();
                // Extract phone from "fullName - phone"
                if (namePhonePart.contains(" - ")) {
                    String[] namePhone = namePhonePart.split(" - ", 2);
                    if (namePhone.length == 2) {
                        // Use parsed name from shipping address if available
                        if (customerName == null || customerName.equals(o.getUser() != null ? o.getUser().getUsername() : null)) {
                            customerName = namePhone[0].trim();
                        }
                        customerPhone = namePhone[1].trim();
                    }
                }
                // Extract address (everything after the first newline)
                if (parts.length > 1) {
                    parsedAddress = parts[1].trim();
                } else {
                    // If no newline, try to extract address from remaining part
                    parsedAddress = namePhonePart;
                }
            }
        }

        return OrderDetailResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .totalAmount(totalAmount)
                .voucherCode(o.getVoucherCode())
                .voucherDiscount(voucherDiscount)
                .shippingFee(shippingFee)
                .paidAmount(paidAmount)
                .finalTotal(finalTotal)
                .status(o.getStatus())
                .paymentStatus(o.getPaymentStatus())
                .paymentMethod(o.getPaymentMethod())
                .shippingAddress(parsedAddress)
                .createdAt(o.getCreatedAt())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .items(itemResponses)
                .statusHistory(history)
                .build();
    }
}


