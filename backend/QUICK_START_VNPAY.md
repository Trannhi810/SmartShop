# 🚀 HƯỚNG DẪN NHANH - ĐĂNG KÝ VNPAY SANDBOX

## ⚡ CÁC BƯỚC NHANH (5 phút)

### Bước 1: Cài đặt Ngrok (2 phút)

1. **Tải Ngrok:**
   - Truy cập: https://ngrok.com/download
   - Chọn Windows và tải về
   - Giải nén vào thư mục bất kỳ (ví dụ: `C:\ngrok`)

2. **Đăng ký tài khoản Ngrok (Miễn phí):**
   - Truy cập: https://dashboard.ngrok.com/signup
   - Đăng ký bằng email
   - Vào Dashboard → Copy **Authtoken**

3. **Cấu hình Ngrok:**
   ```powershell
   # Mở PowerShell hoặc CMD
   cd C:\ngrok  # hoặc thư mục bạn giải nén
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Bước 2: Khởi động ứng dụng (1 phút)

```bash
# Trong terminal của dự án
mvn spring-boot:run

# Hoặc chạy từ IDE (IntelliJ, Eclipse, etc.)
```

**Đảm bảo ứng dụng chạy trên:** `http://localhost:8080`

### Bước 3: Chạy Ngrok Tunnel (30 giây)

Mở terminal mới (giữ terminal chạy ứng dụng):

```bash
cd C:\ngrok  # hoặc thư mục bạn giải nén
ngrok http 8080
```

**Bạn sẽ thấy:**
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8080
```

**Copy URL:** `https://abc123.ngrok-free.app` (URL của bạn sẽ khác)

### Bước 4: Đăng ký VNPay Sandbox (1 phút)

1. **Truy cập:** https://sandbox.vnpayment.vn/

2. **Điền form đăng ký:**
   - **Shop Name:** SmartShop
   - **URL:** `https://abc123.ngrok-free.app/api/payments/vnpay/return`
     - ⚠️ **QUAN TRỌNG:** Thay `abc123.ngrok-free.app` bằng URL Ngrok của bạn
     - ⚠️ **PHẢI có** `/api/payments/vnpay/return` ở cuối
   - **Email:** Email của bạn
   - **Password:** Mật khẩu bạn muốn
   - **Confirm Password:** Nhập lại mật khẩu
   - **Captcha:** Nhập mã xác nhận

3. **Nhấn "Đăng ký"**

4. **Lưu thông tin nhận được:**
   - **TMN Code:** (ví dụ: `2QXUI4J4`)
   - **Hash Secret:** (ví dụ: `RAOCTZRMZOTOGGNQTHGJSWBNGZODAXGI`)

### Bước 5: Cập nhật cấu hình (30 giây)

Mở file: `src/main/resources/application.properties`

Tìm và cập nhật:

```properties
# VNPay
app.payment.vnpay.tmn-code=2QXUI4J4  # ← Thay bằng TMN Code bạn nhận được
app.payment.vnpay.hash-secret=RAOCTZRMZOTOGGNQTHGJSWBNGZODAXGI  # ← Thay bằng Hash Secret bạn nhận được
app.payment.vnpay.pay-url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
app.payment.vnpay.return-url=https://abc123.ngrok-free.app/api/payments/vnpay/return  # ← Thay bằng URL Ngrok của bạn
```

**Và cập nhật base-url:**
```properties
# APPLICATION
app.web.base-url=https://abc123.ngrok-free.app  # ← Thay bằng URL Ngrok của bạn
```

### Bước 6: Khởi động lại ứng dụng

```bash
# Dừng ứng dụng (Ctrl+C) và chạy lại
mvn spring-boot:run
```

### Bước 7: Test thanh toán

1. Tạo đơn hàng trên website
2. Chọn phương thức thanh toán VNPay
3. Kiểm tra xem có redirect đến VNPay không
4. Test thanh toán (dùng thẻ test của VNPay)
5. Kiểm tra callback có hoạt động không

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Ngrok URL thay đổi mỗi lần restart

**Vấn đề:** Mỗi lần bạn dừng và chạy lại Ngrok, URL sẽ thay đổi.

**Giải pháp:**
- **Option 1:** Giữ Ngrok chạy liên tục (không tắt)
- **Option 2:** Mỗi lần restart Ngrok, cập nhật lại:
  - URL trong form VNPay (nếu cần)
  - `app.payment.vnpay.return-url` trong `application.properties`
  - `app.web.base-url` trong `application.properties`

### 2. Ngrok miễn phí có giới hạn

- ✅ Đủ dùng cho development và test
- ⚠️ Có giới hạn số lượng request
- ⚠️ URL thay đổi mỗi lần restart

**Nếu cần URL cố định:** Nâng cấp Ngrok plan ($8/tháng)

### 3. Đảm bảo cả 2 terminal đang chạy

- ✅ Terminal 1: Ứng dụng Spring Boot (`mvn spring-boot:run`)
- ✅ Terminal 2: Ngrok tunnel (`ngrok http 8080`)

**Nếu tắt một trong hai, hệ thống sẽ không hoạt động!**

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Không đúng định dạng Url"
- ✅ Kiểm tra URL có đầy đủ `/api/payments/vnpay/return` chưa
- ✅ Kiểm tra URL có bắt đầu bằng `https://` không
- ✅ Kiểm tra URL không có `localhost` hoặc `127.0.0.1`

### Lỗi: Callback không hoạt động
- ✅ Kiểm tra Ngrok đang chạy
- ✅ Kiểm tra ứng dụng Spring Boot đang chạy
- ✅ Kiểm tra URL trong `application.properties` đúng chưa
- ✅ Kiểm tra endpoint `/api/payments/vnpay/return` có tồn tại không

### Lỗi: "Connection refused"
- ✅ Đảm bảo ứng dụng Spring Boot đang chạy trên port 8080
- ✅ Đảm bảo Ngrok đang forward đúng port 8080

---

## 📞 HỖ TRỢ

- **VNPay Support:** 1900 55 55 77
- **Email:** [email protected]
- **Tài liệu VNPay:** https://sandbox.vnpayment.vn/apis/
- **Ngrok Docs:** https://ngrok.com/docs

---

**Chúc bạn thành công! 🎉**

