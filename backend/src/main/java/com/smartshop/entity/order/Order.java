package com.smartshop.entity.order;

import com.smartshop.entity.user.User;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", unique = true)
    private String orderNumber;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    // Thông tin voucher áp dụng (nếu có)
    @Column(name = "voucher_code", length = 50)
    private String voucherCode;

    @Column(name = "voucher_discount")
    private Double voucherDiscount;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    @Builder.Default
    @Column(name = "payment_status", length = 20)
    private String paymentStatus = "PENDING";

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "shipping_fee")
    private Double shippingFee;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();
}