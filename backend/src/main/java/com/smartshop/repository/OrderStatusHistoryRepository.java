package com.smartshop.repository;

import com.smartshop.entity.order.Order;
import com.smartshop.entity.order.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {
    List<OrderStatusHistory> findByOrderOrderByCreatedAtAsc(Order order);
}


