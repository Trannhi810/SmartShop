package com.smartshop.repository;

import com.smartshop.entity.voucher.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);

    boolean existsByCode(String code);
}


