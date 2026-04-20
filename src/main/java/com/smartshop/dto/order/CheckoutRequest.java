package com.smartshop.dto.order;

import lombok.Data;

@Data
public class CheckoutRequest {
    // 1️⃣9️⃣ Thông tin giao hàng
    private String fullName;
    private String phone;
    private String address;

    // 2️⃣0️⃣ Phương thức thanh toán: "COD", "VNPAY", "MOMO"
    private String paymentMethod;

    // Phương thức vận chuyển: "STANDARD", "EXPRESS"
    private String shippingMethod;

    // Mã voucher (có thể null)
    private String voucherCode;

    // Các mã sản phẩm được chọn (nếu để trống thì thanh toán toàn bộ giỏ)
    private java.util.List<Long> itemIds;
}


