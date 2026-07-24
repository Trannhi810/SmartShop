package com.smartshop.controller;

import com.smartshop.dto.order.CheckoutRequest;
import com.smartshop.dto.order.CheckoutResponse;
import com.smartshop.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@CrossOrigin
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    // 1️⃣8️⃣ - 2️⃣2️⃣: Tạo đơn hàng từ giỏ hiện tại
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<CheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest req) {
        return ResponseEntity.ok(checkoutService.checkout(req));
    }
}


