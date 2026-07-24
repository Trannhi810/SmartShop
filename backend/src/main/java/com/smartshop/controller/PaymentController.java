package com.smartshop.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.smartshop.dto.payment.CreatePaymentRequest;
import com.smartshop.dto.payment.PaymentUrlResponse;
import com.smartshop.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // Tạo URL thanh toán VNPay
    @PostMapping("/vnpay/create")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<PaymentUrlResponse> createVNPay(@RequestBody CreatePaymentRequest req,
                                                          HttpServletRequest httpRequest) {
        return ResponseEntity.ok(paymentService.createVNPayPayment(req.getOrderId(), httpRequest));
    }

    // VNPay return URL - xác thực chữ ký và xử lý kết quả
    @GetMapping("/vnpay/return")
    public RedirectView vnpayReturn(@RequestParam Map<String, String> allParams)
            throws JsonProcessingException {
        try {
            // Xác thực chữ ký trước
            boolean isValidSignature = paymentService.verifySignature(allParams);
            
            if (!isValidSignature) {
                System.err.println("VNPay return: Invalid signature!");
                return new RedirectView("/?payment=error&reason=invalid_signature");
            }
            
            // Lấy responseCode từ VNPay
            String responseCode = allParams.get("vnp_ResponseCode");
            String txnRef = allParams.get("vnp_TxnRef");
            Long orderId = null;
            
            if (txnRef != null && !txnRef.isEmpty()) {
                orderId = paymentService.getOrderIdByTransactionNo(txnRef);
            } else {
                // Fallback: lấy từ orderId param (nếu có)
                String orderIdStr = allParams.get("orderId");
                if (orderIdStr != null) {
                    orderId = Long.parseLong(orderIdStr);
                }
            }
            
            if (orderId == null) {
                // Nếu không tìm thấy orderId, redirect về trang chủ
                return new RedirectView("/?payment=error");
            }
            
            // Nếu xác thực thành công và responseCode == 00, xử lý thanh toán
            if ("00".equals(responseCode)) {
                paymentService.handleVNPayReturn(allParams);
                // Redirect về trang order-success khi thanh toán thành công
                return new RedirectView("/order-success.html?orderId=" + orderId);
            } else {
                // Thanh toán thất bại
                paymentService.handleVNPayReturn(allParams);
                return new RedirectView("/order-detail.html?id=" + orderId + "&payment=failed");
            }
            
        } catch (Exception e) {
            // Log error và redirect về trang chủ
            System.err.println("Error handling VNPay return: " + e.getMessage());
            e.printStackTrace();
            return new RedirectView("/?payment=error");
        }
    }

}


