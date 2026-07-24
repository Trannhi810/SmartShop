package com.smartshop.repository;

import com.smartshop.entity.cart.ShoppingCart;
import com.smartshop.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    Optional<ShoppingCart> findByUser(User user);
}


