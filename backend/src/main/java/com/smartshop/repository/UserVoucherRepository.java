package com.smartshop.repository;

import com.smartshop.entity.user.User;
import com.smartshop.entity.voucher.UserVoucher;
import com.smartshop.entity.voucher.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {

    Optional<UserVoucher> findByUserAndVoucher(User user, Voucher voucher);
    
    List<UserVoucher> findByUser(User user);
    
    List<UserVoucher> findByUserAndIsUsed(User user, boolean isUsed);
}


