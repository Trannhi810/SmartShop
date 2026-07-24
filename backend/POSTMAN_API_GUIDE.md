# 📋 HƯỚNG DẪN TEST API VỚI POSTMAN

## 🔧 Setup trước khi test

1. **Khởi động ứng dụng:**
   ```bash
   mvn spring-boot:run
   ```
   Server chạy tại: `http://localhost:8080`

2. **Database:** Đảm bảo MySQL đang chạy và database `smartshop` đã được tạo tự động

3. **Postman:** Import các request sau hoặc tạo thủ công

4. **⚠️ LƯU Ý QUAN TRỌNG:** 
   - Trong các URL dưới đây, `{id}` là **placeholder** (ví dụ: `{id}`, `{productId}`, `{categoryId}`)
   - **BẠN PHẢI THAY THẾ** `{id}` bằng giá trị thực tế (ví dụ: `1`, `2`, `123`)
   - Ví dụ: `GET /api/products/{id}` → `GET /api/products/1`
   - Nếu bạn gửi request với `{id}` như một chuỗi, sẽ có lỗi "Giá trị không hợp lệ"

---

## 🔐 1. AUTHENTICATION (Không cần token)

### 1.1 Đăng ký (Register)

**Mô tả:** Tạo tài khoản user mới trong hệ thống. Sau khi đăng ký thành công, user sẽ nhận được JWT token để sử dụng cho các API khác.

**Trong Postman:**
1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/auth/register`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User",
  "phone": "0123456789"
}
```

**Request Body Fields:**
- `username` (String, required): Tên đăng nhập, phải unique
- `email` (String, required): Email, phải unique và đúng format
- `password` (String, required): Mật khẩu (sẽ được mã hóa bằng BCrypt)
- `fullName` (String, optional): Họ và tên
- `phone` (String, optional): Số điện thoại

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTYzODk2NzIwMCwiZXhwIjoxNjM4OTcwODAwfQ...",
    "type": "Bearer",
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "roles": ["ROLE_CUSTOMER"]
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Username đã tồn tại"
}
```
hoặc
```json
{
  "success": false,
  "error": "Email đã tồn tại"
}
```

**Các lỗi có thể gặp:**
- `400`: Username hoặc email đã tồn tại
- `400`: Validation error (thiếu trường bắt buộc, email sai format)
- `500`: Lỗi server

**Lưu ý:**
- Sau khi đăng ký thành công, **lưu lại token** để dùng cho các API cần authentication
- User mới sẽ tự động được gán role `ROLE_CUSTOMER`

### 1.2 Đăng nhập (Login)

**Mô tả:** Xác thực user bằng username và password. Nếu thành công, trả về JWT token để sử dụng cho các API khác.

#### 📝 Hướng dẫn từng bước trong Postman:

**Bước 1: Tạo Request mới**
1. Mở Postman
2. Click vào nút **"New"** (góc trên bên trái)
3. Chọn **"HTTP Request"**

**Bước 2: Cấu hình Request**
1. **Method:** Chọn `POST` từ dropdown (mặc định là GET)
2. **URL:** Nhập `http://localhost:8080/api/auth/login`

**Bước 3: Thêm Headers**
1. Click tab **"Headers"**
2. Thêm header:
   - **Key:** `Content-Type`
   - **Value:** `application/json`
   - ✅ Đảm bảo checkbox được tick

**Bước 4: Thêm Body (Request Body)**
1. Click tab **"Body"**
2. Chọn radio button **"raw"**
3. Ở dropdown bên phải, chọn **"JSON"** (không phải Text)
4. Nhập JSON sau vào ô text:

```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Bước 5: Gửi Request**
1. Click nút **"Send"** (màu xanh, góc trên bên phải)
2. Đợi response hiển thị ở phần dưới

**Bước 6: Kiểm tra Response**
- Nếu thành công (200 OK), bạn sẽ thấy JSON response chứa `token`
- Copy token này để dùng cho các API khác

**Request Body Fields:**
- `username` (String, required): Tên đăng nhập
- `password` (String, required): Mật khẩu

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTYzODk2NzIwMCwiZXhwIjoxNjM4OTcwODAwfQ...",
    "type": "Bearer",
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "roles": ["ROLE_CUSTOMER"]
  }
}
```

**Response lỗi (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Tên đăng nhập hoặc mật khẩu không đúng"
}
```

**Các lỗi có thể gặp:**
- `401`: Username hoặc password sai
- `400`: Validation error (thiếu trường)
- `500`: Lỗi server

**Lưu ý quan trọng:**
- ⚠️ **SAU KHI LOGIN THÀNH CÔNG, COPY TOKEN TỪ RESPONSE**
- Token có thời hạn 1 giờ (3600000ms)
- Token cần được thêm vào Header: `Authorization: Bearer <token>` cho các API cần authentication
- Trong Postman, có thể tạo Environment variable `token` và dùng `{{token}}` trong Header

---

#### 📌 Ví dụ: Đăng nhập tài khoản Admin

**Thông tin tài khoản Admin mặc định:**
- Username: `admin`
- Email: `admin123@gmail.com`
- Password: `123456`
- Roles: `ROLE_ADMIN`, `ROLE_CUSTOMER`

**Các bước thực hiện trong Postman:**

1. **Tạo Request mới:**
   - Click **"New"** → **"HTTP Request"**
   - Đặt tên request: `Login Admin`

2. **Cấu hình Request:**
   - **Method:** Chọn `POST` (dropdown bên trái URL bar)
   - **URL:** `http://localhost:8080/api/auth/login`

3. **Thêm Headers:**
   - Tab **"Headers"**
   - Thêm: Key = `Content-Type`, Value = `application/json`
   - ✅ Đảm bảo checkbox được tick

4. **Thêm Body (quan trọng):**
   - Tab **"Body"**
   - Chọn radio button **"raw"**
   - Dropdown bên phải: Chọn **"JSON"** (không phải Text)
   - Nhập JSON sau:
   ```json
   {
     "username": "admin",
     "password": "123456"
   }
   ```

5. **Gửi Request:**
   - Click nút **"Send"** (màu xanh)
   - Đợi response (thường mất 1-2 giây)

6. **Kiểm tra Response:**
   - **Nếu thành công (Status: 200 OK):**
     - Bạn sẽ thấy JSON response
     - Copy giá trị `token` từ response
     - Lưu token này để dùng cho các API khác

   - **Nếu lỗi (Status: 401 Unauthorized - "Tên đăng nhập hoặc mật khẩu không đúng"):**
     - ✅ **Giải pháp:** Password hash trong database có thể không khớp
     - Chạy file `fix_admin_password.sql` trong MySQL để update password hash đúng
     - Hoặc chạy class `PasswordHashGenerator.java` để generate hash mới
     - Sau đó update password trong database bằng SQL:
       ```sql
       UPDATE users 
       SET password = '<hash_mới>' 
       WHERE username = 'admin';
       ```
     - Restart application và thử lại

**Response thành công (200 OK) sẽ trông như thế này:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTYzODk2NzIwMCwiZXhwIjoxNjM4OTcwODAwfQ...",
  "id": 1,
  "username": "admin",
  "email": "admin123@gmail.com",
  "fullName": null,
  "phone": "0900000000",
  "avatar": null,
  "roles": ["ROLE_ADMIN", "ROLE_CUSTOMER"]
}
```

**Screenshot mô tả trong Postman:**

```
┌─────────────────────────────────────────────────────────┐
│ POST  │  http://localhost:8080/api/auth/login    [Send] │
├─────────────────────────────────────────────────────────┤
│ Params │ Authorization │ Headers │ Body │ Pre-request │
├─────────────────────────────────────────────────────────┤
│ ● none  ○ form-data  ○ x-www-form-urlencoded            │
│ ● raw   ○ binary     ○ GraphQL                           │
│        JSON ▼                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ {                                                   │ │
│ │   "username": "admin",                              │ │
│ │   "password": "123456"                             │ │
│ │ }                                                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Lưu ý quan trọng:**
- ✅ Tài khoản admin có quyền truy cập tất cả các API (bao gồm `/api/admin/**`)
- ✅ Bạn có thể dùng username (`admin`) hoặc email (`admin123@gmail.com`) để đăng nhập
- ✅ Sau khi đăng nhập thành công, **copy token** từ response
- ✅ Token cần được thêm vào Header của các request khác: `Authorization: Bearer <token>`
- ⚠️ Nếu thấy lỗi "Bad credentials", kiểm tra:
  - Database đã được tạo chưa? (chạy file `database.sql`)
  - Username/password có đúng không?
  - Server đã khởi động chưa? (`mvn spring-boot:run`)

---

### 1.3 Quên mật khẩu (Forgot Password)

**Mô tả:** Gửi email chứa link reset mật khẩu đến email của user. Link reset có thời hạn 30 phút.

**Trong Postman:**
1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/auth/forgot-password`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "email": "test@example.com"
}
```

**Request Body Fields:**
- `email` (String, required): Email đã đăng ký trong hệ thống

**Response thành công (200 OK):**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```
*Lưu ý: Email sẽ được gửi đến địa chỉ email đã nhập (cần config SMTP trong `application.properties`)*

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Email không tồn tại"
}
```

**Các lỗi có thể gặp:**
- `400`: Email không tồn tại trong hệ thống
- `500`: Lỗi gửi email (kiểm tra SMTP config)

**Lưu ý:**
- Email reset sẽ được gửi đến địa chỉ email đã nhập
- Link reset có format: `http://localhost:8080/reset-password?token=<token>`
- Token reset có thời hạn 30 phút
- Cần config SMTP (Gmail) trong `application.properties` để gửi email

---

### 1.4 Reset mật khẩu (Reset Password)

**Mô tả:** Đặt lại mật khẩu mới bằng token nhận được từ email.

**Trong Postman:**
1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/auth/reset-password`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "token": "abc123def456ghi789",
  "newPassword": "newpass123"
}
```

**Request Body Fields:**
- `token` (String, required): Token nhận được từ email reset password
- `newPassword` (String, required): Mật khẩu mới

**Response thành công (200 OK):**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Token không hợp lệ"
}
```
hoặc
```json
{
  "success": false,
  "error": "Token đã hết hạn hoặc đã sử dụng"
}
```

**Các lỗi có thể gặp:**
- `400`: Token không hợp lệ
- `400`: Token đã hết hạn (quá 30 phút)
- `400`: Token đã được sử dụng
- `500`: Lỗi server

**Lưu ý:**
- Token chỉ sử dụng được 1 lần
- Sau khi reset thành công, có thể đăng nhập bằng mật khẩu mới

---

### 1.5 Đăng nhập Google (Google OAuth2)

**Mô tả:** Đăng nhập bằng Google OAuth2. Frontend sẽ lấy `idToken` từ Google và gửi lên server để verify.

**Trong Postman:**
1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/auth/google`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9..."
}
```

**Request Body Fields:**
- `idToken` (String, required): Google ID Token nhận được từ Google Sign-In

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "id": 1,
    "username": "test@example.com",
    "email": "test@example.com",
    "fullName": "Test User",
    "roles": ["ROLE_CUSTOMER"]
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Google token không hợp lệ"
}
```

**Các lỗi có thể gặp:**
- `400`: Google token không hợp lệ hoặc chưa verify email
- `500`: Lỗi server

**Lưu ý:**
- Nếu email chưa tồn tại, hệ thống sẽ tự động tạo user mới
- Username sẽ được set bằng email
- Password sẽ được tạo ngẫu nhiên (user có thể reset sau)

---

## 🛍️ 2. PRODUCTS (Public - không cần token)

### 2.1 Danh sách sản phẩm (Get All Products)

**Mô tả:** Lấy danh sách tất cả sản phẩm trong hệ thống. Có thể kết hợp với tìm kiếm hoặc lọc theo danh mục.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/products`
3. **Headers:** Không cần (public endpoint)

**Query Parameters (tất cả đều optional):**
- `q` (String): Từ khóa tìm kiếm (tìm kiếm không dấu)
- `categoryId` (Long): ID danh mục để lọc

**Ví dụ:**
- Lấy tất cả: `GET /api/products`
- Tìm kiếm: `GET /api/products?q=dien%20thoai`
- Lọc danh mục: `GET /api/products?categoryId=1`
- Kết hợp: `GET /api/products?q=iphone&categoryId=1`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "iPhone 15 Pro",
      "description": "Điện thoại cao cấp",
      "price": 25000000.0,
      "stockQuantity": 100,
      "imageUrl": "https://res.cloudinary.com/...",
      "isActive": true,
      "categoryId": 1,
      "categoryName": "Điện thoại",
      "createdAt": "2025-01-15T10:00:00",
      "updatedAt": "2025-01-15T10:00:00"
    },
    {
      "id": 2,
      "name": "Samsung Galaxy S24",
      "description": "Điện thoại Android",
      "price": 20000000.0,
      "stockQuantity": 50,
      "imageUrl": null,
      "isActive": true,
      "categoryId": 1,
      "categoryName": "Điện thoại",
      "createdAt": "2025-01-15T11:00:00",
      "updatedAt": "2025-01-15T11:00:00"
    }
  ]
}
```

**Response lỗi (500):**
```json
{
  "success": false,
  "error": "Đã xảy ra lỗi: ..."
}
```

**Lưu ý:**
- Endpoint này là public, không cần token
- Tìm kiếm hỗ trợ không dấu (ví dụ: "điện thoại" = "dien thoai")
- Chỉ trả về sản phẩm đang active (`isActive = true`)

---

### 2.2 Tìm kiếm sản phẩm (Search Products)

**Mô tả:** Tìm kiếm sản phẩm theo tên, hỗ trợ tìm kiếm không dấu.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/products?q=dien%20thoai`
3. **Headers:** Không cần

**Query Parameters:**
- `q` (String, required): Từ khóa tìm kiếm

**Ví dụ:**
- `GET /api/products?q=iphone`
- `GET /api/products?q=dien%20thoai` (URL encoded: "điện thoại")
- `GET /api/products?q=samsung`

**Response:** Tương tự như 2.1, nhưng chỉ trả về sản phẩm có tên chứa từ khóa

**Lưu ý:**
- Tìm kiếm không phân biệt hoa thường
- Hỗ trợ tìm kiếm không dấu (ví dụ: "điện thoại" có thể tìm bằng "dien thoai")

---

### 2.3 Lọc theo danh mục (Filter by Category)

**Mô tả:** Lấy danh sách sản phẩm thuộc một danh mục cụ thể.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/products?categoryId=1`
3. **Headers:** Không cần

**Query Parameters:**
- `categoryId` (Long, required): ID danh mục

**Ví dụ:**
- `GET /api/products?categoryId=1`
- `GET /api/products?categoryId=2`

**Response:** Tương tự như 2.1, nhưng chỉ trả về sản phẩm thuộc danh mục đó

**Response lỗi (400):**
```json
{
  "success": false,
  "error": "Category not found"
}
```

---

### 2.4 Chi tiết sản phẩm (Get Product by ID)

**Mô tả:** Lấy thông tin chi tiết của một sản phẩm theo ID.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/products/1`
   - ⚠️ **Thay `1` bằng ID thực tế của sản phẩm**
3. **Headers:** Không cần

**Path Parameters:**
- `id` (Long, required): ID sản phẩm

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "description": "Điện thoại cao cấp với chip A17 Pro, camera 48MP",
    "price": 25000000.0,
    "stockQuantity": 100,
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/smartshop/products/iphone15pro.jpg",
    "isActive": true,
    "categoryId": 1,
    "categoryName": "Điện thoại",
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

**Các lỗi có thể gặp:**
- `400`: Sản phẩm không tồn tại
- `400`: ID không hợp lệ (không phải số)

**Lưu ý:**
- Endpoint này là public, không cần token
- Nếu sản phẩm không active, vẫn có thể xem được (tùy business logic)

---

## 🛒 3. CART (Cần token - CUSTOMER/ADMIN)

**⚠️ TẤT CẢ CÁC API DƯỚI ĐÂY ĐỀU CẦN TOKEN:**
- Header: `Authorization: Bearer <token>`
- Thay `<token>` bằng JWT token nhận được sau khi login

---

### 3.1 Xem giỏ hàng (Get Cart)

**Mô tả:** Lấy thông tin giỏ hàng hiện tại của user, bao gồm danh sách sản phẩm, tổng tiền, tổng số lượng.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/cart`
3. **Headers:**
   - `Authorization: Bearer <token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "iPhone 15 Pro",
        "price": 25000000.0,
        "quantity": 2,
        "lineTotal": 50000000.0,
        "imageUrl": "https://res.cloudinary.com/..."
      },
      {
        "productId": 2,
        "productName": "Samsung Galaxy S24",
        "price": 20000000.0,
        "quantity": 1,
        "lineTotal": 20000000.0,
        "imageUrl": null
      }
    ],
    "totalAmount": 70000000.0,
    "totalQuantity": 3
  }
}
```

**Response lỗi (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Bạn không có quyền truy cập"
}
```

**Lưu ý:**
- Nếu giỏ hàng trống, `items` sẽ là mảng rỗng `[]`
- `totalAmount` và `totalQuantity` sẽ là `0` nếu giỏ hàng trống

---

### 3.2 Thêm vào giỏ (Add to Cart)

**Mô tả:** Thêm sản phẩm vào giỏ hàng. Nếu sản phẩm đã có trong giỏ, sẽ tăng số lượng.

**Trong Postman:**
1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/cart/items`
3. **Headers:**
   - `Authorization: Bearer <token>`
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Request Body Fields:**
- `productId` (Long, required): ID sản phẩm cần thêm
- `quantity` (Integer, optional): Số lượng (mặc định: 1)

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalAmount": 50000000.0,
    "totalQuantity": 2
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

**Các lỗi có thể gặp:**
- `400`: Sản phẩm không tồn tại
- `401`: Chưa đăng nhập hoặc token hết hạn
- `500`: Lỗi server

**Lưu ý:**
- Nếu sản phẩm đã có trong giỏ, số lượng sẽ được cộng thêm
- Ví dụ: Giỏ có 2 sản phẩm A, thêm 3 sản phẩm A → Giỏ sẽ có 5 sản phẩm A

---

### 3.3 Cập nhật số lượng (Update Quantity)

**Mô tả:** Cập nhật số lượng của một sản phẩm trong giỏ hàng. Nếu số lượng = 0, sản phẩm sẽ bị xóa khỏi giỏ.

**Trong Postman:**
1. **Method:** `PUT`
2. **URL:** `http://localhost:8080/api/cart/items`
3. **Headers:**
   - `Authorization: Bearer <token>`
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "productId": 1,
  "quantity": 3
}
```

**Request Body Fields:**
- `productId` (Long, required): ID sản phẩm cần cập nhật
- `quantity` (Integer, required): Số lượng mới

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalAmount": 75000000.0,
    "totalQuantity": 3
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Cart item not found"
}
```

**Lưu ý:**
- Nếu `quantity = 0`, sản phẩm sẽ bị xóa khỏi giỏ
- Nếu `quantity < 0`, sẽ có lỗi validation

---

### 3.4 Xóa khỏi giỏ (Remove from Cart)

**Mô tả:** Xóa một sản phẩm khỏi giỏ hàng.

**Trong Postman:**
1. **Method:** `DELETE`
2. **URL:** `http://localhost:8080/api/cart/items/1`
   - ⚠️ **Thay `1` bằng `productId` thực tế**
3. **Headers:**
   - `Authorization: Bearer <token>`

**Path Parameters:**
- `productId` (Long, required): ID sản phẩm cần xóa

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalAmount": 20000000.0,
    "totalQuantity": 1
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

### 3.5 Áp dụng voucher (Apply Voucher)

**Mô tả:** Áp dụng mã giảm giá cho giỏ hàng. Hệ thống sẽ kiểm tra điều kiện và tính toán giảm giá.

**Trong Postman:**
1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/cart/apply-voucher`
3. **Headers:**
   - `Authorization: Bearer <token>`
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "code": "SALE2025"
}
```

**Request Body Fields:**
- `code` (String, required): Mã voucher

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "voucherId": 1,
    "code": "SALE2025",
    "originalTotal": 70000000.0,
    "discount": 7000000.0,
    "finalTotal": 63000000.0
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Voucher không tồn tại"
}
```
hoặc
```json
{
  "success": false,
  "error": "Voucher đã hết hạn"
}
```
hoặc
```json
{
  "success": false,
  "error": "Đơn hàng không đủ giá trị tối thiểu để áp dụng voucher"
}
```

**Các lỗi có thể gặp:**
- `400`: Voucher không tồn tại
- `400`: Voucher đã hết hạn hoặc chưa đến thời gian áp dụng
- `400`: Voucher đã bị vô hiệu hóa
- `400`: Đơn hàng không đủ giá trị tối thiểu
- `400`: Giỏ hàng không có sản phẩm thuộc danh mục áp dụng voucher (nếu voucher áp dụng theo category)
- `400`: Bạn đã sử dụng voucher này rồi

**Lưu ý:**
- Voucher có thể giảm theo phần trăm (`PERCENTAGE`) hoặc số tiền cố định (`FIXED_AMOUNT`)
- Voucher có thể áp dụng cho toàn bộ giỏ hàng hoặc chỉ sản phẩm thuộc một danh mục cụ thể
- `finalTotal` là tổng tiền sau khi đã trừ discount

---

## ❤️ 4. WISHLIST (Cần token)

### 4.1 Xem wishlist
```
GET http://localhost:8080/api/wishlist
```

### 4.2 Thêm vào wishlist
```
POST http://localhost:8080/api/wishlist/{productId}
```

### 4.3 Xóa khỏi wishlist
```
DELETE http://localhost:8080/api/wishlist/{productId}
```

---

## 📦 5. CHECKOUT (Cần token)

### 5.1 Tạo đơn hàng (Checkout)

**Mô tả:** Tạo đơn hàng từ giỏ hàng hiện tại. Hệ thống sẽ:
- Tính tổng tiền (có áp dụng voucher nếu có)
- Tạo đơn hàng với thông tin giao hàng
- Giảm stock của sản phẩm
- Xóa sản phẩm khỏi giỏ hàng

**Trong Postman:**
1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/checkout`
3. **Headers:**
   - `Authorization: Bearer <token>`
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "paymentMethod": "COD",
  "voucherCode": "SALE2025"
}
```

**Request Body Fields:**
- `fullName` (String, required): Họ và tên người nhận
- `phone` (String, required): Số điện thoại
- `address` (String, required): Địa chỉ giao hàng
- `paymentMethod` (String, required): Phương thức thanh toán (`COD`, `VNPAY`, `MOMO`)
- `voucherCode` (String, optional): Mã voucher (nếu có)

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "orderNumber": "ORD-ABC12345",
    "originalTotal": 70000000.0,
    "discount": 7000000.0,
    "finalTotal": 63000000.0,
    "paymentMethod": "COD",
    "paymentStatus": "PENDING",
    "status": "PENDING"
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Giỏ hàng trống"
}
```
hoặc
```json
{
  "success": false,
  "error": "Sản phẩm iPhone 15 Pro không đủ số lượng. Còn lại: 5"
}
```

**Các lỗi có thể gặp:**
- `400`: Giỏ hàng trống
- `400`: Sản phẩm không đủ stock
- `400`: Voucher không hợp lệ (nếu có)
- `400`: Validation error (thiếu trường bắt buộc)
- `401`: Chưa đăng nhập hoặc token hết hạn
- `500`: Lỗi server

**Lưu ý quan trọng:**
- ⚠️ **Sau khi checkout thành công, giỏ hàng sẽ bị xóa**
- ⚠️ **Stock của sản phẩm sẽ bị giảm ngay lập tức**
- Nếu thanh toán `COD`, `paymentStatus` sẽ là `PENDING` (chờ thanh toán khi nhận hàng)
- Nếu thanh toán online (`VNPAY`, `MOMO`), cần gọi API tạo payment URL sau khi checkout
- `orderNumber` là mã đơn hàng duy nhất, dùng để tra cứu

---

## 💳 6. PAYMENT (Cần token)

### 6.1 Tạo thanh toán VNPay
```
POST http://localhost:8080/api/payments/vnpay/create
Content-Type: application/json

{
  "orderId": 1
}
```

**Response:** `{"paymentUrl": "https://sandbox.vnpayment.vn/..."}`

### 6.2 Tạo thanh toán MoMo
```
POST http://localhost:8080/api/payments/momo/create
Content-Type: application/json

{
  "orderId": 1
}
```

### 6.3 VNPay Return (Callback - tự động)
```
GET http://localhost:8080/api/payments/vnpay/return?vnp_TxnRef=...&vnp_ResponseCode=00
```

### 6.4 MoMo Return (Callback - tự động)
```
GET http://localhost:8080/api/payments/momo/return?orderId=...&resultCode=0
```

---

## 📄 7. INVOICE (Cần token)

### 7.1 Tải hóa đơn PDF
```
GET http://localhost:8080/api/invoices/{orderId}
```

---

## 📋 8. ORDERS (Cần token)

### 8.1 Lịch sử mua hàng (Get My Orders)

**Mô tả:** Lấy danh sách tất cả đơn hàng của user hiện tại, sắp xếp theo thời gian tạo (mới nhất trước).

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/orders/my`
3. **Headers:**
   - `Authorization: Bearer <token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-ABC12345",
      "status": "PENDING",
      "totalAmount": 63000000.0,
      "paymentStatus": "PENDING",
      "paymentMethod": "COD",
      "createdAt": "2025-01-15T14:30:00"
    },
    {
      "id": 2,
      "orderNumber": "ORD-XYZ67890",
      "status": "COMPLETED",
      "totalAmount": 20000000.0,
      "paymentStatus": "PAID",
      "paymentMethod": "VNPAY",
      "createdAt": "2025-01-14T10:00:00"
    }
  ]
}
```

**Các trạng thái đơn hàng:**
- `PENDING`: Chờ xử lý
- `SHIPPING`: Đang giao hàng
- `COMPLETED`: Đã hoàn thành
- `CANCELLED`: Đã hủy

**Các trạng thái thanh toán:**
- `PENDING`: Chờ thanh toán
- `PAID`: Đã thanh toán
- `FAILED`: Thanh toán thất bại

---

### 8.2 Chi tiết đơn hàng (Get Order Detail)

**Mô tả:** Lấy thông tin chi tiết của một đơn hàng, bao gồm danh sách sản phẩm, lịch sử thay đổi trạng thái.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/orders/1`
   - ⚠️ **Thay `1` bằng `orderId` thực tế**
3. **Headers:**
   - `Authorization: Bearer <token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-ABC12345",
    "status": "PENDING",
    "totalAmount": 63000000.0,
    "voucherCode": "SALE2025",
    "voucherDiscount": 7000000.0,
    "paymentMethod": "COD",
    "paymentStatus": "PENDING",
    "shippingAddress": "Nguyễn Văn A - 0123456789\n123 Đường ABC, Quận 1, TP.HCM",
    "items": [
      {
        "productId": 1,
        "productName": "iPhone 15 Pro",
        "price": 25000000.0,
        "quantity": 2,
        "lineTotal": 50000000.0
      }
    ],
    "statusHistory": [
      {
        "oldStatus": null,
        "newStatus": "PENDING",
        "createdAt": "2025-01-15T14:30:00"
      }
    ],
    "createdAt": "2025-01-15T14:30:00",
    "updatedAt": "2025-01-15T14:30:00"
  }
}
```

**Response lỗi (400 Bad Request):**
```json
{
  "success": false,
  "error": "Order not found"
}
```
hoặc
```json
{
  "success": false,
  "error": "Bạn không có quyền xem đơn hàng này"
}
```

**Lưu ý:**
- User chỉ có thể xem đơn hàng của chính mình
- Admin có thể xem tất cả đơn hàng

---

### 8.3 Cập nhật trạng thái đơn (ADMIN ONLY)

**Mô tả:** Admin cập nhật trạng thái đơn hàng (ví dụ: PENDING → SHIPPING → COMPLETED).

**Trong Postman:**
1. **Method:** `PUT`
2. **URL:** `http://localhost:8080/api/orders/1/status`
   - ⚠️ **Thay `1` bằng `orderId` thực tế**
3. **Headers:**
   - `Authorization: Bearer <admin_token>`
   - `Content-Type: application/json`
4. **Body:** Chọn `raw` → `JSON`, nhập:
```json
{
  "newStatus": "SHIPPING"
}
```

**Request Body Fields:**
- `newStatus` (String, required): Trạng thái mới (`PENDING`, `SHIPPING`, `COMPLETED`, `CANCELLED`)

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-ABC12345",
    "status": "SHIPPING",
    ...
    "statusHistory": [
      {
        "oldStatus": null,
        "newStatus": "PENDING",
        "createdAt": "2025-01-15T14:30:00"
      },
      {
        "oldStatus": "PENDING",
        "newStatus": "SHIPPING",
        "createdAt": "2025-01-15T15:00:00"
      }
    ]
  }
}
```

**Response lỗi (403 Forbidden):**
```json
{
  "success": false,
  "error": "Bạn không có quyền truy cập"
}
```

**Lưu ý:**
- ⚠️ **Chỉ ADMIN mới có quyền cập nhật trạng thái đơn hàng**
- Mỗi lần cập nhật sẽ được ghi vào `statusHistory`

---

## ⭐ 9. REVIEWS (Cần token để tạo, public để xem)

### 9.1 Xem reviews của sản phẩm
```
GET http://localhost:8080/api/reviews/product/{productId}
```

### 9.2 Tạo/Update review (với upload ảnh/video Cloudinary)
```
POST http://localhost:8080/api/reviews
Content-Type: multipart/form-data
Authorization: Bearer <token>

productId: 1
rating: 5
comment: "Sản phẩm rất tốt!"
files: [file1.jpg, file2.jpg]
```

**Hướng dẫn trong Postman:**
1. Chọn method: `POST`
2. URL: `http://localhost:8080/api/reviews`
3. Tab: `Body` → Chọn `form-data`
4. Thêm các fields:
   - `productId` (Text): `1`
   - `rating` (Text): `5`
   - `comment` (Text): `"Sản phẩm rất tốt!"`
   - `files` (File): Chọn 1 hoặc nhiều file ảnh/video
5. Header: `Authorization: Bearer <token>`

**Lưu ý:**
- Chỉ user đã mua sản phẩm mới được đánh giá
- Có thể upload nhiều file (ảnh/video)
- Files sẽ được upload lên Cloudinary folder `smartshop/reviews`
- Rating phải từ 1-5 sao

**Response:**
```json
{
  "id": 1,
  "productId": 1,
  "userId": 1,
  "rating": 5,
  "comment": "Sản phẩm rất tốt!",
  "mediaUrls": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/smartshop/reviews/review1.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/smartshop/reviews/review2.jpg"
  ],
  "createdAt": "2025-01-15T10:30:00"
}
```

---

## 🏷️ 10. CATEGORIES (Public để xem, ADMIN để CRUD)

### 10.1 Danh sách categories
```
GET http://localhost:8080/api/categories
```

### 10.2 Chi tiết category
```
GET http://localhost:8080/api/categories/{id}
```

### 10.3 Tạo category (ADMIN)
```
POST http://localhost:8080/api/categories
Content-Type: application/json

{
  "name": "Điện thoại",
  "parentId": null
}
```

### 10.4 Sửa category (ADMIN)
```
PUT http://localhost:8080/api/categories/{id}
Content-Type: application/json

{
  "name": "Smartphone",
  "parentId": null
}
```

### 10.5 Xóa category (ADMIN)
```
DELETE http://localhost:8080/api/categories/{id}
```

---

## 🎫 11. VOUCHERS (ADMIN)

### 11.1 Danh sách vouchers
```
GET http://localhost:8080/api/vouchers
```

### 11.2 Chi tiết voucher
```
GET http://localhost:8080/api/vouchers/{id}
```

### 11.3 Tạo voucher
```
POST http://localhost:8080/api/vouchers
Content-Type: application/json

{
  "code": "SALE2025",
  "type": "PERCENTAGE",
  "value": 10.0,
  "minOrder": 100000.0,
  "categoryId": 1,
  "startDate": "2025-01-01T00:00:00",
  "endDate": "2025-12-31T23:59:59",
  "isActive": true
}
```

### 11.4 Sửa voucher
```
PUT http://localhost:8080/api/vouchers/{id}
Content-Type: application/json

{
  "code": "SALE2025",
  "type": "FIXED_AMOUNT",
  "value": 50000.0,
  "minOrder": 200000.0
}
```

### 11.5 Xóa voucher
```
DELETE http://localhost:8080/api/vouchers/{id}
```

### 11.6 Vô hiệu hóa voucher
```
POST http://localhost:8080/api/vouchers/{id}/disable
```

---

## 🛠️ 12. PRODUCTS - ADMIN (Cần token ADMIN)

### 12.1 Tạo sản phẩm
```
POST http://localhost:8080/api/products
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Điện thoại cao cấp",
  "price": 25000000.0,
  "stockQuantity": 100,
  "categoryId": 1
}
```

### 12.2 Sửa sản phẩm
```
PUT http://localhost:8080/api/products/{id}
Content-Type: application/json

{
  "name": "iPhone 15 Pro Max",
  "price": 30000000.0,
  "stockQuantity": 50
}
```

### 12.3 Xóa sản phẩm
```
DELETE http://localhost:8080/api/products/{id}
```

### 12.4 Upload ảnh sản phẩm (Cloudinary)
```
POST http://localhost:8080/api/products/{id}/image
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>

file: [image.jpg]
```

**Lưu ý:** 
- Chọn `form-data` trong Postman
- Key: `file` (type: File)
- Value: Chọn file ảnh từ máy tính
- Ảnh sẽ được upload lên Cloudinary và URL được lưu vào `imageUrl` của sản phẩm

**Response:**
```json
{
  "id": 1,
  "name": "iPhone 15 Pro",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/smartshop/products/abc123.jpg",
  ...
}
```

---

## ☁️ 12.5. CLOUDINARY UPLOAD - HƯỚNG DẪN CHI TIẾT

### 12.5.1 Setup Cloudinary

1. **Đăng ký tài khoản Cloudinary:**
   - Truy cập: https://cloudinary.com/users/register/free
   - Đăng ký tài khoản miễn phí

2. **Lấy thông tin API:**
   - Đăng nhập Dashboard: https://cloudinary.com/console
   - Vào **Settings** → **API Keys**
   - Copy 3 thông tin:
     - `Cloud name`
     - `API Key`
     - `API Secret`

3. **Cấu hình trong `application.properties`:**
   ```properties
   CLOUD_NAME=your_cloud_name
   CLOUD_KEY=your_api_key
   CLOUD_SECRET=your_api_secret
   ```

4. **Restart ứng dụng** để áp dụng config mới

---

### 12.5.2 Test Upload Ảnh Sản Phẩm (Postman)

**Bước 1: Tạo sản phẩm trước**
```
POST http://localhost:8080/api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Điện thoại cao cấp",
  "price": 25000000.0,
  "stockQuantity": 100,
  "categoryId": 1
}
```

**Bước 2: Upload ảnh cho sản phẩm**

1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/products/{id}/image`
   - Thay `{id}` bằng ID sản phẩm vừa tạo (ví dụ: `1`)

3. **Headers:**
   ```
   Authorization: Bearer <admin_token>
   ```
   (Không cần set `Content-Type`, Postman tự động set khi chọn form-data)

4. **Body:**
   - Tab: `Body`
   - Chọn: `form-data`
   - Thêm field:
     - **Key:** `file` (chọn type: **File**)
     - **Value:** Click "Select Files" và chọn file ảnh từ máy tính

5. **Send** → Kiểm tra response có `imageUrl` từ Cloudinary

**Ví dụ Response:**
```json
{
  "id": 1,
  "name": "iPhone 15 Pro",
  "description": "Điện thoại cao cấp",
  "price": 25000000.0,
  "stockQuantity": 100,
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/smartshop/products/abc123.jpg",
  "isActive": true,
  "categoryId": 1
}
```

---

### 12.5.3 Test Upload Ảnh/Video Review (Postman)

**Bước 1: Đảm bảo đã mua sản phẩm**
- Phải có đơn hàng đã thanh toán chứa sản phẩm này

**Bước 2: Upload review với media**

1. **Method:** `POST`
2. **URL:** `http://localhost:8080/api/reviews`

3. **Headers:**
   ```
   Authorization: Bearer <token>
   ```

4. **Body:**
   - Tab: `Body`
   - Chọn: `form-data`
   - Thêm các fields:
     - **Key:** `productId` (type: **Text**)
       - **Value:** `1`
     - **Key:** `rating` (type: **Text**)
       - **Value:** `5`
     - **Key:** `comment` (type: **Text**)
       - **Value:** `Sản phẩm rất tốt, giao hàng nhanh!`
     - **Key:** `files` (type: **File**)
       - **Value:** Chọn 1 hoặc nhiều file (ảnh/video)
       - Có thể chọn nhiều file bằng cách thêm nhiều field `files`

5. **Send** → Kiểm tra response có `mediaUrls` từ Cloudinary

**Ví dụ Response:**
```json
{
  "id": 1,
  "productId": 1,
  "userId": 1,
  "rating": 5,
  "comment": "Sản phẩm rất tốt, giao hàng nhanh!",
  "mediaUrls": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/smartshop/reviews/review1.jpg",
    "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/smartshop/reviews/review2.mp4"
  ],
  "createdAt": "2025-01-15T10:30:00"
}
```

---

### 12.5.4 Các Định Dạng File Hỗ Trợ

**Ảnh:**
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`

**Video:**
- `.mp4`, `.mov`, `.avi`, `.webm`

**Giới hạn:**
- Kích thước file: Tùy theo gói Cloudinary (Free: 10MB/ảnh, 100MB/video)
- Số lượng file review: Không giới hạn (nhưng nên tối đa 5-10 file)

---

### 12.5.5 Troubleshooting

**Lỗi: "Cloudinary configuration not found"**
- Kiểm tra `application.properties` đã config đúng chưa
- Restart ứng dụng sau khi sửa config

**Lỗi: "Invalid API credentials"**
- Kiểm tra lại `CLOUD_NAME`, `CLOUD_KEY`, `CLOUD_SECRET`
- Đảm bảo không có khoảng trắng thừa

**Lỗi: "File too large"**
- Giảm kích thước file hoặc nén ảnh trước khi upload
- Hoặc nâng cấp gói Cloudinary

**Lỗi: "Upload failed"**
- Kiểm tra kết nối internet
- Kiểm tra Cloudinary dashboard xem có bị giới hạn không

---

## 🧪 13. TEST ENDPOINTS (Public)

### 13.1 Test public
```
GET http://localhost:8080/api/test/public
```

### 13.2 Test user (Cần token)
```
GET http://localhost:8080/api/test/user
```

### 13.3 Test admin (Cần token ADMIN)
```
GET http://localhost:8080/api/test/admin
```

---

## 👨‍💼 14. ADMIN MANAGEMENT (ADMIN ONLY)

### 14.1 Danh sách Users

**Mô tả:** Admin xem danh sách tất cả users trong hệ thống.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/admin/users`
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "phone": "0123456789",
      "isActive": true,
      "roles": ["ROLE_CUSTOMER"],
      "createdAt": "2025-01-15T10:00:00"
    }
  ]
}
```

---

### 14.2 Kích hoạt/Vô hiệu hóa User

**Mô tả:** Admin kích hoạt hoặc vô hiệu hóa tài khoản user.

**Trong Postman:**
1. **Method:** `PUT`
2. **URL:** `http://localhost:8080/api/admin/users/1/status?isActive=false`
   - ⚠️ **Thay `1` bằng `userId` thực tế**
   - Query param: `isActive=true` (kích hoạt) hoặc `isActive=false` (vô hiệu hóa)
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "isActive": false,
    ...
  }
}
```

---

### 14.3 Danh sách Orders (Admin)

**Mô tả:** Admin xem tất cả đơn hàng trong hệ thống (không chỉ của mình).

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/admin/orders`
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response:** Tương tự như 8.1, nhưng trả về tất cả đơn hàng

---

### 14.4 Danh sách Reviews (Admin)

**Mô tả:** Admin xem tất cả reviews trong hệ thống.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/admin/reviews`
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "userId": 1,
      "rating": 5,
      "comment": "Sản phẩm rất tốt!",
      "mediaUrls": [...],
      "createdAt": "2025-01-15T16:00:00"
    }
  ]
}
```

---

### 14.5 Xóa Review (Admin)

**Mô tả:** Admin xóa review không phù hợp.

**Trong Postman:**
1. **Method:** `DELETE`
2. **URL:** `http://localhost:8080/api/admin/reviews/1`
   - ⚠️ **Thay `1` bằng `reviewId` thực tế**
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Xóa review thành công",
  "data": null
}
```

---

## 📊 15. DASHBOARD & REPORTS (ADMIN ONLY)

### 15.1 Thống kê tổng quan

**Mô tả:** Lấy các số liệu thống kê tổng quan của hệ thống.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/admin/dashboard/stats`
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalProducts": 500,
    "totalOrders": 1200,
    "totalRevenue": 5000000000.0,
    "pendingOrders": 50,
    "completedOrders": 1000
  }
}
```

---

### 15.2 Export Orders to Excel

**Mô tả:** Xuất danh sách đơn hàng ra file Excel.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/admin/dashboard/export/orders?startDate=2025-01-01T00:00:00&endDate=2025-01-31T23:59:59`
   - Query params (optional): `startDate`, `endDate` (format: `yyyy-MM-ddTHH:mm:ss`)
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response:** File Excel sẽ được download tự động

**Lưu ý:**
- Trong Postman, chọn tab "Send and Download" để lưu file
- File sẽ có tên `orders.xlsx`

---

### 15.3 Export Products to Excel

**Mô tả:** Xuất danh sách sản phẩm ra file Excel.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/admin/dashboard/export/products`
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response:** File Excel sẽ được download tự động (`products.xlsx`)

---

### 15.4 Export Users to Excel

**Mô tả:** Xuất danh sách users ra file Excel.

**Trong Postman:**
1. **Method:** `GET`
2. **URL:** `http://localhost:8080/api/admin/dashboard/export/users`
3. **Headers:**
   - `Authorization: Bearer <admin_token>`

**Response:** File Excel sẽ được download tự động (`users.xlsx`)

---

## 📝 LƯU Ý QUAN TRỌNG

### 1. **JWT Token:**
   - Sau khi login, copy token từ response
   - Thêm vào Header: `Authorization: Bearer <token>`
   - Token hết hạn sau 1 giờ (3600000ms)

### 2. **Roles:**
   - `ROLE_CUSTOMER`: User thường
   - `ROLE_ADMIN`: Admin (có thể tạo user admin bằng cách sửa DB hoặc thêm endpoint)

### 3. **CORS:**
   - Đã cấu hình cho `http://localhost:3000` và `http://localhost:8080`

### 4. **Database:**
   - Tự động tạo tables khi chạy lần đầu (`spring.jpa.hibernate.ddl-auto=update`)
   - Đảm bảo MySQL đang chạy

### 5. **Payment:**
   - VNPay/MoMo cần config thật trong `application.properties`
   - Hiện tại dùng config mẫu

### 6. **Cloudinary:**
   - Cần config thật để upload ảnh trong `application.properties`:
     ```
     CLOUD_NAME=your_cloud_name
     CLOUD_KEY=your_api_key
     CLOUD_SECRET=your_api_secret
     ```
   - Đăng ký tài khoản miễn phí tại: https://cloudinary.com
   - Lấy credentials từ Dashboard → Settings → API Keys
   - Ảnh sản phẩm upload vào folder: `smartshop/products`
   - Ảnh/video review upload vào folder: `smartshop/reviews`

---

## 🚀 QUY TRÌNH TEST CƠ BẢN

1. **Đăng ký user mới:**
   ```
   POST /api/auth/register
   ```

2. **Đăng nhập lấy token:**
   ```
   POST /api/auth/login
   → Copy token
   ```

3. **Tạo sản phẩm (Admin):**
   ```
   POST /api/products
   Header: Authorization: Bearer <admin_token>
   ```

4. **Upload ảnh sản phẩm (Admin - Cloudinary):**
   ```
   POST /api/products/{id}/image
   Header: Authorization: Bearer <admin_token>
   Body: form-data, file: [image.jpg]
   ```

5. **Thêm sản phẩm vào giỏ:**
   ```
   POST /api/cart/items
   Header: Authorization: Bearer <token>
   ```

6. **Áp dụng voucher:**
   ```
   POST /api/cart/apply-voucher
   Header: Authorization: Bearer <token>
   ```

7. **Tạo đơn hàng:**
   ```
   POST /api/checkout
   Header: Authorization: Bearer <token>
   ```

8. **Đánh giá sản phẩm với ảnh (Cloudinary):**
   ```
   POST /api/reviews
   Header: Authorization: Bearer <token>
   Body: form-data, productId, rating, comment, files: [image1.jpg, image2.jpg]
   ```

9. **Xem lịch sử đơn hàng:**
   ```
   GET /api/orders/my
   Header: Authorization: Bearer <token>
   ```

---

## 💡 TIPS & TRICKS

### 1. Sử dụng Environment Variables trong Postman

1. Tạo Environment: Click vào góc trên bên phải → "Manage Environments" → "Add"
2. Thêm biến: `token` = `<your_jwt_token>`
3. Sử dụng: Trong Header, dùng `{{token}}` thay vì paste token trực tiếp

### 2. Tạo Collection trong Postman

1. Tạo Collection mới: "SmartShop API"
2. Tạo folder cho từng module: Auth, Products, Cart, Orders, etc.
3. Import các request vào collection
4. Set Environment variable `base_url` = `http://localhost:8080`
5. Dùng `{{base_url}}/api/...` trong URL

### 3. Test Flow hoàn chỉnh

1. Register → Login → Lấy token
2. Tạo category (Admin)
3. Tạo product (Admin)
4. Upload ảnh product (Admin)
5. Thêm vào cart (User)
6. Áp dụng voucher (User)
7. Checkout (User)
8. Tạo payment (User)
9. Xem order (User)
10. Đánh giá sản phẩm (User)

---

## ✅ CHECKLIST TRƯỚC KHI TEST

- [ ] MySQL đang chạy
- [ ] Database `smartshop` đã được tạo
- [ ] Spring Boot app đang chạy tại `http://localhost:8080`
- [ ] Postman đã cài đặt
- [ ] Đã đăng ký/đăng nhập và có token
- [ ] Đã tạo ít nhất 1 category (nếu test products)
- [ ] Đã tạo ít nhất 1 voucher (nếu test voucher)
- [ ] **Cloudinary đã được config** (nếu test upload ảnh):
  - [ ] Đã đăng ký tài khoản Cloudinary
  - [ ] Đã lấy `CLOUD_NAME`, `CLOUD_KEY`, `CLOUD_SECRET`
  - [ ] Đã cập nhật `application.properties`
  - [ ] Đã restart ứng dụng

---

**Chúc bạn test thành công! 🎉**

