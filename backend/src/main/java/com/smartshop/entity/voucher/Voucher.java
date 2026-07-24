package com.smartshop.entity.voucher;

import com.smartshop.entity.product.Category;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    // PERCENTAGE hoặc FIXED_AMOUNT
    @Column(name = "type", length = 20)
    private String type;

    @Column(name = "value")
    private Double value;

    // Đơn tối thiểu để áp dụng
    @Column(name = "min_order")
    private Double minOrder;

    // Áp dụng theo danh mục (null = áp dụng cho tất cả)
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;
}

