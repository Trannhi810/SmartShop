# 📁 DANH SÁCH FILE THANH TOÁN VNPAY

## 🎯 TỔNG QUAN

Hệ thống thanh toán VNPay bao gồm các file sau, được phân loại theo chức năng:

---

## 🔵 BACKEND (Java - Spring Boot)

### 1. **Controller Layer** (Xử lý HTTP Request/Response)

#### `src/main/java/com/smartshop/controller/PaymentController.java`
- **Chức năng**: Controller xử lý các API endpoint cho VNPay
- **Endpoints**:
  - `POST /api/payments/vnpay/create` - Tạo URL thanh toán VNPay
  - `GET /api/payments/vnpay/return` - Xử lý callback từ VNPay sau khi thanh toán
- **Trách nhiệm**:
  - Nhận request từ frontend
  - Gọi service để xử lý logic
  - Trả về response cho frontend

---

### 2. **Service Layer** (Business Logic)

#### `src/main/java/com/smartshop/service/PaymentService.java`
- **Chức năng**: Service chứa toàn bộ logic xử lý thanh toán VNPay
- **Các method chính**:
  - `createVNPayPayment()` - Tạo payment URL với hash signature
  - `handleVNPayReturn()` - Xử lý callback từ VNPay
  - `getOrderIdByTransactionNo()` - Lấy orderId từ transaction number
  - `buildQueryForHash()` - Build query string để hash (raw, không encode)
  - `buildQueryForUrl()` - Build query string cho URL (có encode)
  - `hmacSHA512()` - Tính toán HMAC-SHA512 hash
  - `getClientIp()` - Lấy IP address của client
- **Trách nhiệm**:
  - Tạo payment URL với đầy đủ params và hash signature
  - Xác thực hash từ VNPay callback
  - Cập nhật trạng thái thanh toán vào database

---

### 3. **DTO (Data Transfer Object)**

#### `src/main/java/com/smartshop/dto/payment/CreatePaymentRequest.java`
- **Chức năng**: DTO cho request tạo payment
- **Fields**:
  - `orderId` (Long) - ID của đơn hàng cần thanh toán

#### `src/main/java/com/smartshop/dto/payment/PaymentUrlResponse.java`
- **Chức năng**: DTO cho response trả về payment URL
- **Fields**:
  - `paymentUrl` (String) - URL thanh toán VNPay để redirect

---

### 4. **Entity (Database Model)**

#### `src/main/java/com/smartshop/entity/payment/PaymentTransaction.java`
- **Chức năng**: Entity lưu thông tin giao dịch thanh toán
- **Fields**:
  - `id` - ID giao dịch
  - `order` - Đơn hàng liên quan
  - `method` - Phương thức thanh toán (VNPAY)
  - `amount` - Số tiền
  - `status` - Trạng thái (PENDING, SUCCESS, FAILED)
  - `transactionNo` - Mã giao dịch (dùng orderNumber)
  - `gatewayResponse` - Response từ VNPay (JSON)
  - `createdAt` - Thời gian tạo

#### `src/main/java/com/smartshop/entity/enums/PaymentMethod.java`
- **Chức năng**: Enum định nghĩa các phương thức thanh toán
- **Values**: `COD`, `BANK_TRANSFER`, `CREDIT_CARD`, `VNPAY`, `ZALOPAY`

---

### 5. **Repository (Database Access)**

#### `src/main/java/com/smartshop/repository/PaymentTransactionRepository.java`
- **Chức năng**: Repository để truy vấn database
- **Methods**:
  - `findByTransactionNo()` - Tìm transaction theo mã giao dịch
  - `findByOrder()` - Tìm transaction theo đơn hàng

---

### 6. **Configuration**

#### `src/main/resources/application.properties`
- **Chức năng**: File cấu hình VNPay
- **Các config**:
  ```properties
  # VNPay Config
  app.payment.vnpay.tmn-code=7LMLEF5G
  app.payment.vnpay.hash-secret=Q2I0UQ93SF6YEDUR5EUZSYK41VZVV98T
  app.payment.vnpay.pay-url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  app.payment.vnpay.return-url=${app.web.base-url}/api/payments/vnpay/return
  app.web.base-url=http://localhost:8080
  ```

---

## 🟢 FRONTEND (HTML/JavaScript)

### 7. **Checkout Page**

#### `src/main/resources/templates/order/checkout.html`
- **Chức năng**: Trang checkout để người dùng chọn phương thức thanh toán
- **Chức năng**:
  - Form nhập thông tin đơn hàng
  - Radio button chọn phương thức thanh toán (COD, VNPay)
  - Submit form để tạo đơn hàng và thanh toán

#### `src/main/resources/static/js/checkout.js`
- **Chức năng**: JavaScript xử lý logic checkout
- **Chức năng chính**:
  - Validate form
  - Gọi API `/api/checkout` để tạo đơn hàng
  - Nếu chọn VNPay → Gọi API `/api/payments/vnpay/create`
  - Redirect đến VNPay payment URL
  - Xử lý lỗi và hiển thị thông báo

---

### 8. **Order Detail Page**

#### `src/main/resources/static/js/order-detail.js`
- **Chức năng**: JavaScript xử lý trang chi tiết đơn hàng
- **Chức năng liên quan VNPay**:
  - Hiển thị phương thức thanh toán (VNPay)
  - Hiển thị trạng thái thanh toán (SUCCESS, FAILED, PENDING)
  - Xử lý query param `?payment=success` hoặc `?payment=failed` từ VNPay callback

---

### 9. **API Client**

#### `src/main/resources/static/js/api.js`
- **Chức năng**: Utility để gọi API
- **Method liên quan VNPay**:
  ```javascript
  createVNPayPayment: (orderId) => {
      return apiRequest('/payments/vnpay/create', {
          method: 'POST',
          body: JSON.stringify({ orderId })
      });
  }
  ```

---

## 📊 DATABASE

### 10. **Payment Transactions Table**

#### `database.sql` (hoặc JPA auto-create)
- **Table**: `payment_transactions`
- **Schema**:
  ```sql
  CREATE TABLE payment_transactions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      order_id BIGINT NOT NULL,
      method VARCHAR(20),
      amount DECIMAL(12,2),
      status VARCHAR(20) DEFAULT 'PENDING',
      transaction_no VARCHAR(100),
      gateway_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
  );
  ```

---

## 📚 DOCUMENTATION

### 11. **Hướng dẫn**

#### `HUONG_DAN_DANG_KY_VNPAY.md`
- Hướng dẫn đăng ký tài khoản VNPay Sandbox

#### `QUICK_START_VNPAY.md`
- Hướng dẫn nhanh tích hợp VNPay

#### `DEBUG_VNPAY.md`
- Hướng dẫn debug khi gặp lỗi

---

## 🔄 LUỒNG HOẠT ĐỘNG

### Bước 1: User chọn VNPay tại checkout
- **File**: `checkout.html` + `checkout.js`
- User điền form → Chọn VNPay → Click "Đặt hàng"

### Bước 2: Tạo đơn hàng
- **File**: `CheckoutController.java` + `CheckoutService.java`
- Tạo order trong database

### Bước 3: Tạo payment URL
- **File**: `checkout.js` → `api.js` → `PaymentController.java` → `PaymentService.java`
- Gọi API `/api/payments/vnpay/create`
- `PaymentService.createVNPayPayment()` tạo URL với hash signature

### Bước 4: Redirect đến VNPay
- **File**: `checkout.js`
- `window.location.href = paymentUrl`

### Bước 5: User thanh toán tại VNPay
- User nhập thông tin thẻ → Thanh toán

### Bước 6: VNPay callback
- **File**: `PaymentController.java` → `PaymentService.java`
- VNPay redirect về `/api/payments/vnpay/return`
- `PaymentService.handleVNPayReturn()` xác thực hash và cập nhật trạng thái

### Bước 7: Redirect về order detail
- **File**: `PaymentController.java`
- Redirect về `/order-detail.html?id=...&payment=success`

---

## 📋 TÓM TẮT FILE QUAN TRỌNG NHẤT

### ⭐ **File Core (Bắt buộc phải có)**:
1. ✅ `PaymentService.java` - Logic chính
2. ✅ `PaymentController.java` - API endpoints
3. ✅ `application.properties` - Config VNPay
4. ✅ `checkout.js` - Frontend logic
5. ✅ `api.js` - API client

### 📝 **File Hỗ trợ**:
6. ✅ `PaymentTransaction.java` - Entity
7. ✅ `PaymentTransactionRepository.java` - Database access
8. ✅ `PaymentUrlResponse.java` - DTO response
9. ✅ `CreatePaymentRequest.java` - DTO request
10. ✅ `checkout.html` - UI checkout

---

## 🎯 KẾT LUẬN

**Tổng cộng**: ~15-20 files liên quan đến VNPay
- **Backend**: 8-10 files
- **Frontend**: 3-4 files
- **Config**: 1 file
- **Database**: 1 table
- **Documentation**: 3 files

**File quan trọng nhất**: `PaymentService.java` - Chứa toàn bộ logic hash và tạo payment URL.

