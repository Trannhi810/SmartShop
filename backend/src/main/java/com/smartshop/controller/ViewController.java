package com.smartshop.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller để serve các trang HTML
 * Tách biệt với REST API controllers
 */
@Controller
public class ViewController {

    // Trang chủ
    @GetMapping("/")
    public String index() {
        return "index";
    }

    // Auth pages
    @GetMapping("/auth/login.html")
    public String login() {
        return "auth/login";
    }

    @GetMapping("/auth/register.html")
    public String register() {
        return "auth/register";
    }

    @GetMapping("/auth/forgot-password")
    public String forgotPassword() {
        return "auth/forgot-password";
    }

    @GetMapping("/auth/reset-password")
    public String resetPassword() {
        return "auth/reset-password";
    }

    // Product pages
    @GetMapping("/product.html")
    public String products() {
        return "product/product";
    }

    @GetMapping("/product-detail.html")
    public String productDetail() {
        return "product/product-detail";
    }

    // Cart page
    @GetMapping("/cart.html")
    public String cart() {
        return "cart/cart";
    }

    // Order pages
    @GetMapping("/checkout.html")
    public String checkout() {
        return "order/checkout";
    }

    @GetMapping("/orders.html")
    public String orders() {
        return "order/orders";
    }

    @GetMapping("/order-detail.html")
    public String orderDetail() {
        return "order/order-detail";
    }

    @GetMapping("/order-success.html")
    public String orderSuccess() {
        return "order/order-success";
    }

    // Profile pages
    @GetMapping("/profile.html")
    public String profile() {
        return "user/profile";
    }

    @GetMapping("/user/profile.html")
    public String userProfile() {
        return "user/profile";
    }

    @GetMapping("/user/change-password.html")
    public String changePassword() {
        return "user/change-password";
    }

    @GetMapping("/kho-voucher.html")
    public String vouchers() {
        return "user/vouchers";
    }

    // Wishlist page
    @GetMapping("/wishlist.html")
    public String wishlist() {
        return "wishlist/wishlist";
    }

    // Admin pages
    @GetMapping("/admin/dashboard.html")
    public String adminDashboard() {
        return "admin/dashboard";
    }

    @GetMapping("/admin/products.html")
    public String adminProducts() {
        return "admin/products";
    }

    @GetMapping("/admin/categories.html")
    public String adminCategories() {
        return "admin/categories";
    }

    @GetMapping("/admin/users.html")
    public String adminUsers() {
        return "admin/users";
    }

    @GetMapping("/admin/orders.html")
    public String adminOrders() {
        return "admin/orders";
    }

    @GetMapping("/admin/vouchers.html")
    public String adminVouchers() {
        return "admin/vouchers";
    }

    @GetMapping("/admin/reviews.html")
    public String adminReviews() {
        return "admin/reviews";
    }

    // Contact page
    @GetMapping("/contact.html")
    public String contact() {
        return "contact";
    }

    // Favicon handler - return 204 No Content to suppress warnings
    @GetMapping("/favicon.ico")
    public org.springframework.http.ResponseEntity<Void> favicon() {
        return org.springframework.http.ResponseEntity.noContent().build();
    }
}

