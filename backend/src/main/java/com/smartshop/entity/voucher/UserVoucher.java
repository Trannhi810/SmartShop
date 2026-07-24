package com.smartshop.entity.voucher;

import jakarta.persistence.*;
import lombok.*;
import com.smartshop.entity.user.User;

@Entity
@Table(name = "user_vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @Builder.Default
    @Column(name = "is_used")
    private boolean isUsed = false;
}