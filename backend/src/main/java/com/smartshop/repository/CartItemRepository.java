package com.smartshop.repository;

import com.smartshop.entity.cart.CartItem;
import com.smartshop.entity.cart.ShoppingCart;
import com.smartshop.entity.product.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartAndProductAndIsWishlist(ShoppingCart cart, Product product, Boolean isWishlist);

    List<CartItem> findByCartAndIsWishlist(ShoppingCart cart, Boolean isWishlist);
}


