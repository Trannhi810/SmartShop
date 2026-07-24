package com.smartshop.entity.cart;

import jakarta.persistence.*;
import lombok.*;
import com.smartshop.entity.product.Product;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cart_id", nullable = false)
    private ShoppingCart cart;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;

    @Builder.Default
    @Column(name = "is_wishlist", nullable = false)
    private Boolean isWishlist = false;
}