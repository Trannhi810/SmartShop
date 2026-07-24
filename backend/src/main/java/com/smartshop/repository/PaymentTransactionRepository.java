package com.smartshop.repository;

import com.smartshop.entity.order.Order;
import com.smartshop.entity.payment.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionNo(String transactionNo);

    Optional<PaymentTransaction> findByOrder(Order order);
}


