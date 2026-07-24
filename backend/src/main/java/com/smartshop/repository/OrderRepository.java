package com.smartshop.repository;

import com.smartshop.entity.order.Order;
import com.smartshop.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
}


