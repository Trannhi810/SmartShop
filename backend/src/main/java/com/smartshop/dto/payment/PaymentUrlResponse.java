package com.smartshop.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentUrlResponse {
    private String paymentUrl;
    private String qrCodeBase64; // QR code dạng base64 để hiển thị trên frontend
}


