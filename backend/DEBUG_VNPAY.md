# 🔍 HƯỚNG DẪN DEBUG VNPAY

## ❓ Bạn gặp lỗi gì?

Vui lòng cho biết **chính xác** lỗi bạn gặp phải:

### 1️⃣ Lỗi khi tạo đơn hàng?
- [ ] Không thể submit form checkout
- [ ] Lỗi khi gọi API `/api/checkout`
- [ ] Lỗi trong console browser (F12)

### 2️⃣ Lỗi khi tạo payment URL?
- [ ] Không redirect đến VNPay
- [ ] Lỗi khi gọi API `/api/payments/vnpay/create`
- [ ] Lỗi trong console browser
- [ ] Lỗi trong server log

### 3️⃣ Lỗi khi thanh toán tại VNPay?
- [ ] VNPay hiển thị "Sai chữ ký" (Error code: 97)
- [ ] VNPay hiển thị lỗi khác (ghi rõ mã lỗi)
- [ ] Không thể nhập thông tin thẻ

### 4️⃣ Lỗi sau khi thanh toán?
- [ ] Không redirect về trang order detail
- [ ] Redirect nhưng không cập nhật trạng thái thanh toán
- [ ] Lỗi trong server log

---

## 🔧 CÁCH KIỂM TRA

### Bước 1: Kiểm tra Console Browser (F12)
1. Mở Developer Tools (F12)
2. Vào tab **Console**
3. Thử checkout và xem có lỗi gì không
4. Copy toàn bộ lỗi và gửi cho tôi

### Bước 2: Kiểm tra Network Tab
1. Vào tab **Network** trong Developer Tools
2. Thử checkout
3. Tìm request `/api/payments/vnpay/create`
4. Xem:
   - Status code (200, 400, 500?)
   - Response body
   - Request payload

### Bước 3: Kiểm tra Server Log
1. Xem console của server (nơi chạy `mvn spring-boot:run`)
2. Tìm dòng `=== VNPay Payment Debug ===`
3. Copy toàn bộ log và gửi cho tôi

### Bước 4: Kiểm tra Config
Mở file `application.properties` và kiểm tra:
```properties
app.payment.vnpay.tmn-code=7LMLEF5G
app.payment.vnpay.hash-secret=Q2I0UQ93SF6YEDUR5EUZSYK41VZVV98T
app.payment.vnpay.pay-url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
app.payment.vnpay.return-url=http://localhost:8080/api/payments/vnpay/return
app.web.base-url=http://localhost:8080
```

---

## 📋 THÔNG TIN CẦN CUNG CẤP

Khi báo lỗi, vui lòng cung cấp:

1. **Lỗi cụ thể**: Mô tả chính xác lỗi bạn gặp
2. **Console Browser**: Copy lỗi từ Console (F12)
3. **Server Log**: Copy log từ server (dòng `=== VNPay Payment Debug ===`)
4. **Network Request**: Status code và response của `/api/payments/vnpay/create`
5. **Screenshot**: Nếu có thể, chụp màn hình lỗi

---

## 🧪 TEST CASE

### Test 1: Tạo đơn hàng
1. Thêm sản phẩm vào giỏ
2. Vào trang checkout
3. Điền thông tin
4. Chọn **VNPay**
5. Click "Đặt hàng"
6. **Kỳ vọng**: Redirect đến VNPay Sandbox

### Test 2: Thanh toán tại VNPay
1. Sau khi redirect đến VNPay
2. Nhập thông tin thẻ test:
   - Số thẻ: `9704198526191432198`
   - Tên: `NGUYEN VAN A`
   - Ngày: `07/15`
   - OTP: `123456`
3. Click "Thanh toán"
4. **Kỳ vọng**: Redirect về `/order-detail.html?id=...&payment=success`

---

## ⚠️ LỖI THƯỜNG GẶP

### Lỗi 1: "Sai chữ ký" (Error code: 97)
**Nguyên nhân**: Hash không khớp
**Giải pháp**: 
- Kiểm tra HashSecret trong `application.properties`
- Kiểm tra log `HashSecret (full, for debug)`
- Đảm bảo đã có `vnp_SecureHashType=HmacSHA512` trong URL

### Lỗi 2: Không redirect đến VNPay
**Nguyên nhân**: 
- API `/api/payments/vnpay/create` lỗi
- Không có `paymentUrl` trong response
**Giải pháp**: 
- Kiểm tra console browser
- Kiểm tra server log
- Kiểm tra network request

### Lỗi 3: 401 Unauthorized
**Nguyên nhân**: Chưa đăng nhập hoặc JWT hết hạn
**Giải pháp**: 
- Đăng nhập lại
- Kiểm tra cookie có JWT không

### Lỗi 4: 500 Internal Server Error
**Nguyên nhân**: Lỗi server
**Giải pháp**: 
- Kiểm tra server log
- Kiểm tra database connection
- Kiểm tra config trong `application.properties`

---

## 📞 LIÊN HỆ

Nếu vẫn không giải quyết được, vui lòng cung cấp:
1. Toàn bộ log từ server
2. Toàn bộ lỗi từ console browser
3. Screenshot lỗi (nếu có)
4. Mô tả chi tiết các bước bạn đã làm

