package com.smartshop.entity.enums;

import lombok.Getter;

@Getter
public enum ShippingMethod {
    STANDARD("Giao hàng Tiêu chuẩn", 30000),
    EXPRESS("Giao hàng Hỏa tốc", 50000);

    private final String label;
    private final double fee;

    ShippingMethod(String label, double fee) {
        this.label = label;
        this.fee = fee;
    }
}

