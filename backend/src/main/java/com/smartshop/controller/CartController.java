package com.smartshop.controller;

import com.smartshop.dto.cart.CartItemRequest;
import com.smartshop.dto.cart.CartItemResponse;
import com.smartshop.dto.cart.CartResponse;
import com.smartshop.dto.voucher.ApplyVoucherRequest;
import com.smartshop.dto.voucher.ApplyVoucherResponse;
import com.smartshop.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // ✅ Giỏ hàng – cần login (CUSTOMER / ADMIN)

    @GetMapping("/cart")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<CartResponse> getCart() {
        return ResponseEntity.ok(cartService.getCart());
    }

    @PostMapping("/cart/items")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<CartResponse> addToCart(@Valid @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.addToCart(req));
    }

    @PutMapping("/cart/items")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<CartResponse> updateQuantity(@Valid @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.updateQuantity(req));
    }

    @DeleteMapping("/cart/items/{productId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<CartResponse> removeFromCart(@PathVariable Long productId) {
        return ResponseEntity.ok(cartService.removeFromCart(productId));
    }

    // ✅ Áp dụng voucher cho giỏ hàng hiện tại
    @PostMapping("/cart/apply-voucher")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<ApplyVoucherResponse> applyVoucher(@RequestBody ApplyVoucherRequest req) {
        return ResponseEntity.ok(cartService.applyVoucher(req.getCode()));
    }

    // ✅ Wishlist – cần login

    @GetMapping("/wishlist")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<List<CartItemResponse>> getWishlist() {
        return ResponseEntity.ok(cartService.getWishlist());
    }

    @PostMapping("/wishlist/{productId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<List<CartItemResponse>> addToWishlist(@PathVariable Long productId) {
        return ResponseEntity.ok(cartService.addToWishlist(productId));
    }

    @DeleteMapping("/wishlist/{productId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<List<CartItemResponse>> removeFromWishlist(@PathVariable Long productId) {
        return ResponseEntity.ok(cartService.removeFromWishlist(productId));
    }
}


