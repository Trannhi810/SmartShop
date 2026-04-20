-- ============================================================
-- RESET & CREATE DATABASE
-- ============================================================

CREATE DATABASE smartshop;
USE smartshop;

-- ============================================================
-- 1. USERS + ROLES
-- ============================================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users_roles (
    user_id BIGINT,
    role_id BIGINT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ============================================================
-- 2. CATEGORY (8 CATEGORY MỚI THEO MENU)
-- ============================================================
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT
);


INSERT INTO categories (id, name, description) VALUES
(1,'Đồng Hồ Đeo Tay','Đồng hồ thời trang, đồng hồ nam, đồng hồ nữ, Smartwatch'),
(2,'Máy Tính Xách Tay','Laptop, phụ kiện laptop, chuột, bàn phím, USB…'),
(3,'Máy Ảnh','Máy chụp hình, máy quay, ống kính, tripod, gimbal…'),
(4,'Điện Thoại','Điện thoại di động, phụ kiện điện thoại, sạc, ốp lưng…'),
(5,'Nước Hoa','Nước hoa nam, nữ, mùi hương cao cấp, mini phiên bản'),
(6,'Nữ Trang','Trang sức nữ, dây chuyền, vòng tay, thắt lưng…'),
(7,'Nón Thời Trang','Mũ thời trang, nón lưỡi trai, nón bucket, phụ kiện outfit'),
(8,'Túi Xách Du Lịch','Túi xách, balo, túi chéo, túi rút, chống sốc laptop');


-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- 4. CART + WISHLIST
-- ============================================================
CREATE TABLE carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT DEFAULT 1,
    is_wishlist BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. ORDERS
-- ============================================================
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE,
    user_id BIGINT,
    status VARCHAR(30) DEFAULT 'PENDING',
    total_amount DECIMAL(12,2) NOT NULL,
    shipping_fee DECIMAL(12,2) DEFAULT 0,  -- THÊM PHÍ SHIP
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    shipping_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    voucher_code VARCHAR(50),
    voucher_discount DECIMAL(12,2),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT,
    quantity INT,
    price DECIMAL(12,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE order_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. VOUCHERS
-- ============================================================
CREATE TABLE vouchers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20),
    value DECIMAL(12,2),
    min_order DECIMAL(12,2),
    start_date DATETIME,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    category_id BIGINT
);

CREATE TABLE user_vouchers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    voucher_id BIGINT,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. PAYMENT
-- ============================================================
CREATE TABLE payment_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    method VARCHAR(20),
    amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    transaction_no VARCHAR(100),
    gateway_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    
    -- [MỚI] Các trường hỗ trợ Shop phản hồi
    reply_comment TEXT DEFAULT NULL,   -- Nội dung shop trả lời
    reply_at DATETIME DEFAULT NULL,    -- Thời gian shop trả lời
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE review_media (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id BIGINT NOT NULL,
    url VARCHAR(255) NOT NULL,
    type ENUM('IMAGE','VIDEO') DEFAULT 'IMAGE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);
-- ============================================================
-- 9. NOTIFICATIONS (MỚI THÊM)
-- ============================================================
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50),
    reference_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- ============================================================
-- DỮ LIỆU MẪU
-- ============================================================

-- ROLES
INSERT INTO roles (id, name) VALUES
(1,'ROLE_USER'),
(2,'ROLE_ADMIN'),
(3,'ROLE_CUSTOMER');

-- ============================
-- USERS (30 người – tên thực tế, email không dấu chấm)
-- ============================

-- Mỗi mật khẩu đã được mã hóa trực tiếp
-- Tất cả đều từ chuỗi gốc: 123456

INSERT INTO users (id, username, password, email, full_name, phone, avatar, is_active, created_at, updated_at) VALUES
(1,'admin','Password@123','admin123@gmail.com',NULL,'0900000000',NULL,1,'2025-01-05 10:00:00','2025-01-05 10:00:00'),

(2,'nguyenvana@gmail.com','Password@123','nguyenvana@gmail.com','Nguyễn Văn A','0900000001',NULL,1,'2025-01-10 09:00:00','2025-01-10 09:00:00'),

(3,'tranthib@gmail.com','Password@123','tranthib@gmail.com','Trần Thị B','0900000002',NULL,1,'2025-02-10 08:00:00','2025-02-10 08:00:00'),

(4,'lequangc@gmail.com','Password@123','lequangc@gmail.com','Lê Quang C','0900000003',NULL,1,'2025-03-12 14:00:00','2025-03-12 14:00:00'),

(5,'phamminhd@gmail.com','Password@123','phamminhd@gmail.com','Phạm Minh D','0900000004',NULL,1,'2025-04-05 11:00:00','2025-04-05 11:00:00'),

(6,'danghoae@gmail.com','Password@123','danghoae@gmail.com','Đặng Hoà E','0900000005',NULL,1,'2025-05-17 16:30:00','2025-05-17 16:30:00'),

(7,'hoanglongf@gmail.com','Password@123','hoanglongf@gmail.com','Hoàng Long F','0900000006',NULL,1,'2025-06-20 13:20:00','2025-06-20 13:20:00'),

(8,'buidieug@gmail.com','Password@123','buidieug@gmail.com','Bùi Diệu G','0900000007',NULL,1,'2025-07-22 09:45:00','2025-07-22 09:45:00'),

(9,'truonghanh@gmail.com','Password@123','truonghanh@gmail.com','Trương Hạnh H','0900000008',NULL,1,'2025-08-15 10:10:00','2025-08-15 10:10:00'),

(10,'doquangi@gmail.com','Password@123','doquangi@gmail.com','Đỗ Quang I','0900000009',NULL,1,'2025-09-09 19:30:00','2025-09-09 19:30:00'),

(11,'phamthanhj@gmail.com','Password@123','phamthanhj@gmail.com','Phạm Thanh J','0900000010',NULL,1,'2025-01-18 08:00:00','2025-01-18 08:00:00'),

(12,'huynhak@gmail.com','Password@123','huynhak@gmail.com','Huỳnh A K','0900000011',NULL,1,'2025-02-05 09:15:00','2025-02-05 09:15:00'),

(13,'trungkhoal@gmail.com','Password@123','trungkhoal@gmail.com','Trung Khoa L','0900000012',NULL,1,'2025-02-22 10:30:00','2025-02-22 10:30:00'),

(14,'lethanhm@gmail.com','Password@123','lethanhm@gmail.com','Lê Thành M','0900000013',NULL,1,'2025-03-08 11:45:00','2025-03-08 11:45:00'),

(15,'ngothanhn@gmail.com','Password@123','ngothanhn@gmail.com','Ngô Thanh N','0900000014',NULL,1,'2025-03-25 13:00:00','2025-03-25 13:00:00'),

(16,'vokhanho@gmail.com','Password@123','vokhanho@gmail.com','Võ Khánh O','0900000015',NULL,1,'2025-04-02 14:15:00','2025-04-02 14:15:00'),

(17,'truongminhp@gmail.com','Password@123','truongminhp@gmail.com','Trương Minh P','0900000016',NULL,1,'2025-04-18 15:30:00','2025-04-18 15:30:00'),

(18,'nguyenkhanhq@gmail.com','Password@123','nguyenkhanhq@gmail.com','Nguyễn Khánh Q','0900000017',NULL,1,'2025-05-03 16:45:00','2025-05-03 16:45:00'),

(19,'doantrungr@gmail.com','Password@123','doantrungr@gmail.com','Đoàn Trung R','0900000018',NULL,1,'2025-05-20 18:00:00','2025-05-20 18:00:00'),

(20,'duongminhs@gmail.com','Password@123','duongminhs@gmail.com','Dương Minh S','0900000019',NULL,1,'2025-06-06 19:15:00','2025-06-06 19:15:00'),

(21,'phamtrongt@gmail.com','Password@123','phamtrongt@gmail.com','Phạm Trọng T','0900000020',NULL,1,'2025-06-21 09:20:00','2025-06-21 09:20:00'),

(22,'hoanglinhu@gmail.com','Password@123','hoanglinhu@gmail.com','Hoàng Linh U','0900000021',NULL,1,'2025-07-02 10:25:00','2025-07-02 10:25:00'),

(23,'danghaiduyv@gmail.com','Password@123','danghaiduyv@gmail.com','Đặng Hải Duy V','0900000022',NULL,1,'2025-07-18 11:30:00','2025-07-18 11:30:00'),

(24,'ngocanhw@gmail.com','Password@123','ngocanhw@gmail.com','Ngọc Anh W','0900000023',NULL,1,'2025-08-01 13:40:00','2025-08-01 13:40:00'),

(25,'phamvanx@gmail.com','Password@123','phamvanx@gmail.com','Phạm Văn X','0900000024',NULL,1,'2025-08-16 15:00:00','2025-08-16 15:00:00'),

(26,'tranhoangy@gmail.com','Password@123','tranhoangy@gmail.com','Trần Hoàng Y','0900000025',NULL,1,'2025-09-01 16:10:00','2025-09-01 16:10:00'),

(27,'nguyenthivan@gmail.com','Password@123','nguyenthivan@gmail.com','Nguyễn Thị Vân','0900000026',NULL,1,'2025-09-15 17:20:00','2025-09-15 17:20:00'),

(28,'lephuongmai@gmail.com','Password@123','lephuongmai@gmail.com','Lê Phương Mai','0900000027',NULL,1,'2025-10-01 18:30:00','2025-10-01 18:30:00'),

(29,'buingoclam@gmail.com','Password@123','buingoclam@gmail.com','Bùi Ngọc Lâm','0900000028',NULL,1,'2025-10-15 19:40:00','2025-10-15 19:40:00'),

(30,'dangkimanh@gmail.com','Password@123','dangkimanh@gmail.com','Đặng Kim Anh','0900000029',NULL,1,'2025-11-01 20:50:00','2025-11-01 20:50:00');



-- USERS_ROLES
INSERT INTO users_roles (user_id, role_id) VALUES
(1,2),
(1,3),
(2,3),(3,3),(4,3),(5,3),(6,3),(7,3),(8,3),(9,3),
(10,3),(11,3),(12,3),(13,3),(14,3),(15,3),(16,3),
(17,3),(18,3),(19,3),(20,3),(21,3),(22,3),(23,3),
(24,3),(25,3),(26,3),(27,3),(28,3),(29,3),(30,3);

-- ============================================================
-- PRODUCTS (1–75, ĐÃ MAP CATEGORY HỢP LÝ, KHÔNG CÓ 76–100)
-- ============================================================

-- Lưu ý: Nếu bảng đã có dữ liệu, bạn nên TRUNCATE bảng trước khi chạy lệnh INSERT này 
-- để tránh xung đột khóa chính (Primary Key).
-- TRUNCATE TABLE `products`;

INSERT INTO `products` (`id`, `name`, `description`, `price`, `stock_quantity`, `image_url`, `is_active`, `category_id`, `created_at`, `updated_at`) VALUES
	(1, 'Previous Áo thun basic unisex cotton 100% ', 'Áo thun unisex của Chodole...', 150000, 120, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765557993/smartshop/products/yrszspgxlunxfsriydkf.jpg', 1, 7, '2025-01-05 10:00:00', '2025-12-12 23:46:36'),
	(2, 'Áo Thun Local Brand Unisex Teelab Basic Tshirt TS324', 'Áo thun tay ngắn', 160000, 110, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558045/smartshop/products/erbdlwufdzgeshj2sjwy.jpg', 1, 7, '2025-01-08 11:00:00', '2025-12-12 23:47:27'),
	(3, 'Áo Sơ Mi MLB Monogram Big Lux cổ điển LA Dodgers 3AWSM0341-07SBL Màu Xanh Blue', 'sản phẩm đến từ thương hiệu thời trang MLB nổi tiếng của Hàn Quốc...', 3130000, 90, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559498/smartshop/products/rk00nog73jv4vrcqdzmv.jpg', 1, 7, '2025-01-12 09:30:00', '2025-12-13 00:11:40'),
	(4, 'Quần Jean nam LB xám đậm QJN090523-01', 'Quần jean ống đứng', 500000, 80, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559563/smartshop/products/adywnatsly4t89kdv6iv.jpg', 1, 7, '2025-01-20 13:10:00', '2025-12-15 23:47:42'),
	(5, 'Quần jeans nữ WIDE-LEG low rise ESSENTIAL', 'Quần jean nữ co giãn', 559000, 75, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559622/smartshop/products/s9ilk6yhyfxthrdpguvj.jpg', 1, 7, '2025-01-25 15:45:00', '2025-12-13 00:13:45'),
	(6, 'H7-AK11 Áo khoác dù chống nắng Hiddle', 'Áo khoác gió nhẹ', 280000, 60, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559708/smartshop/products/lvkpg5vah07hifwscxol.jpg', 1, 7, '2025-02-02 08:20:00', '2025-12-13 00:15:10'),
	(7, 'Áo Hoodie Zip, Áo Khoác By TEEDARK Mã Trơn BST 01 Chất Nỉ Mũ 2 Lớp Form Rộng Dáng Unisex', 'Áo khoác nỉ có mũ', 175000, 50, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559778/smartshop/products/csuzze46ug53mnkephg4.jpg', 1, 7, '2025-02-08 10:00:00', '2025-12-13 00:16:21'),
	(8, 'Áo Thun Bo Viền, Áo Phông By TEEDARK BST0010 Dáng Rộng Cho Nam Nữ Chất Cotton Thoải Mái Phong Cách', 'Áo Thun Bo Viền...', 145000, 100, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559889/smartshop/products/rx97qfntheizp4q6facw.jpg', 1, 7, '2025-02-15 09:40:00', '2025-12-13 00:18:11'),
	(9, 'Áo khoác unisex lót lông cừu logo UNFLUIDSTUDIO NAD', 'Áo phao fom rộng...', 300000, 70, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559963/smartshop/products/srdozpjrhm5oria08t3d.jpg', 1, 7, '2025-02-20 14:10:00', '2025-12-13 00:19:26'),
	(10, 'ẢNH THẬT - Áo cardigan cổ V form dài len kẻ sọc cao cấp', 'Áo len mặc thu đông', 550000, 65, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765560032/smartshop/products/dnoragjlzlqtu48zenr8.jpg', 1, 7, '2025-03-01 16:00:00', '2025-12-13 00:20:34'),
	(11, 'Maple skirt | Váy xếp ly đuôi tôm quần bảo hộ cùng chất | Mania Cutie', 'Váy xếp ly đuôi tôm...', 380000, 55, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765560137/smartshop/products/mwyledzteynwepdfcckw.jpg', 1, 7, '2025-03-05 10:30:00', '2025-12-13 00:22:19'),
	(12, 'Chân Váy Dáng Chữ a Thiết Kế Mới Cao Cấp', 'Váy suông dài gối', 232000, 45, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765560227/smartshop/products/tdjxmzpx4w8bnktmegv6.jpg', 1, 7, '2025-03-10 09:00:00', '2025-12-13 00:23:49'),
	(13, 'Áo Polo Nam Giovanni GPL0144-1 Màu Nâu Size S', 'Chiếc áo dành cho nam...', 3199000, 85, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559137/smartshop/products/ddr8vafjokrvo4rylk7u.jpg', 1, 7, '2025-03-15 13:30:00', '2025-12-13 00:05:39'),
	(14, 'Áo POLO Unisex, Áo POLO Tay Lỡ CARADLA Mã PL R ', 'Chất Cotton Mềm Mịn...', 145000, 75, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765559018/smartshop/products/xu5toy7pi5sx5txca8fk.jpg', 1, 7, '2025-03-18 17:00:00', '2025-12-13 00:03:40'),
	(15, 'Áo Cardigan vải nhung sọc đôi phong cách LADOS – LD2117', 'Chất liệu: Vải nhung tăm đôi...', 199000, 60, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558907/smartshop/products/ryk8m3qtu4st5yf6ost9.jpg', 1, 7, '2025-03-22 19:20:00', '2025-12-13 00:01:49'),
	(16, 'Áo Stussy Basic Stussy Hoodie 2023 ‘Black’', 'Hoodie trơn unisex', 5500000, 50, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558819/smartshop/products/notwr77qnuvkedknofhv.jpg', 1, 7, '2025-04-01 08:45:00', '2025-12-13 00:00:21'),
	(17, 'Áo Khoác Jean Nam thời trang cao cấp LADOS – LD2068', 'Áo khoác jean', 259000, 40, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558746/smartshop/products/djjkfrjqqsweakr02vss.jpg', 1, 7, '2025-04-05 09:50:00', '2025-12-12 23:59:08'),
	(18, 'Áo khoác gió le coq sportif Nam LT4FJK21MV-RDBK', 'Chất liệu: 61% polyester...', 1720000, 5, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558691/smartshop/products/h59nepk2rafjkto4vqsg.jpg', 1, 7, '2025-04-10 10:10:00', '2025-12-12 23:58:13'),
	(19, 'MLB - Quần jogger unisex lưng thun Jacquard Monogram', 'Chiếc quần Jacquard Monogram...', 2350000, 35, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558612/smartshop/products/t2twxdasr76qutmxmnlb.jpg', 1, 7, '2025-04-15 11:25:00', '2025-12-12 23:56:55'),
	(20, 'Áo Oversize Basic - "In The Moment 02"', 'Áo thun rộng unisex', 199000, 95, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558545/smartshop/products/d6gfxtci8maexd816xz1.jpg', 1, 7, '2025-04-20 12:00:00', '2025-12-12 23:55:47'),
	(21, 'ÁO THUN OVERSIZE BASIC TEE 2', 'Áo thun form rộng', 119000, 90, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558477/smartshop/products/qhxvdufzyxilixdsopoj.jpg', 1, 7, '2025-04-25 13:10:00', '2025-12-12 23:54:39'),
	(22, 'Áo sơ mi kẻ caro form rộng', 'Sơ mi caro trẻ trung', 260000, 80, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558435/smartshop/products/c5xpapwyycs1gg0r2bm9.jpg', 1, 7, '2025-05-02 09:00:00', '2025-12-12 23:53:57'),
	(23, 'Plus size váy xếp li quần áo phụ nữ', 'Váy xếp ly trẻ trung xinh đẹp', 154000, 45, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558383/smartshop/products/qmvefqliyr9laqgzbj5h.jpg', 1, 7, '2025-05-05 10:15:00', '2025-12-12 23:53:06'),
	(24, 'Quần Tây Nam Cạp Thun QTA0038', 'Quần Tây nam cạp thun...', 350000, 55, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558236/smartshop/products/tcxahffh7q5aueqvyzsa.jpg', 1, 7, '2025-05-10 15:00:00', '2025-12-12 23:50:38'),
	(25, 'Áo Khoác Dù Nón Tháo Rời, 2 Lớp AKD0045', 'Áo khoác dù chống gió', 360000, 48, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765558145/smartshop/products/snwuxnjfy8ubmkjltf2e.jpg', 1, 7, '2025-05-15 16:20:00', '2025-12-12 23:49:07'),
	(26, 'Tai nghe không dây Xiaomi Buds 5 Pro', 'nhỏ gọn với dải tần siêu rộng...', 5090000, 60, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058273/smartshop/products/w7oojvoqn7wmultcwvv8.jpg', 1, 2, '2025-01-18 10:00:00', '2025-12-18 18:44:36'),
	(27, 'Tai nghe Bluetooth Apple AirPods Pro 3 2025', 'khả năng khử tiếng ồn chủ động...', 6790000, 40, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058458/smartshop/products/nsxy2xjcnve94nu8krap.jpg', 1, 2, '2025-01-25 11:30:00', '2025-12-18 18:47:40'),
	(28, 'Loa Bluetooth Tronsmart T7 Mini', 'Nhỏ gọn, tiện nghi', 490000, 70, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058110/smartshop/products/td4dy6bzep0fnpbzjyjv.jpg', 1, 2, '2025-02-02 09:10:00', '2025-12-18 18:41:53'),
	(29, 'Tai nghe Bluetooth chụp tai Sony WH-1000XM6', 'Adaptive NC Optimizer...', 9990000, 35, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058378/smartshop/products/xorxysdvcevxlqlew9gn.jpg', 1, 2, '2025-02-10 15:25:00', '2025-12-18 18:46:20'),
	(30, 'Bàn phím cơ không dây Rapoo V500 Pro-87', 'Bàn phím cơ blue switch', 690000, 30, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058530/smartshop/products/u1oynp74efuppy7ldw3m.jpg', 1, 2, '2025-02-18 18:40:00', '2025-12-18 18:48:53'),
	(31, 'Bàn phím + Bao da AI Samsung Galaxy Tab S10 FE Plus', 'tích hợp bàn phím, touch pad', 4312000, 80, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058709/smartshop/products/s1dabspyqgborwfm0mjk.jpg', 1, 2, '2025-02-24 08:20:00', '2025-12-18 18:51:52'),
	(32, 'Chuột Gaming không dây Logitech G304 Lightspeed', '6 nút lập trình chính giữa...', 725000, 90, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058786/smartshop/products/ag1s8d8ykxrc9x5i4jqk.jpg', 1, 2, '2025-03-03 10:10:00', '2025-12-18 18:53:08'),
	(33, 'Chuột không dây Logitech MX Master 2S', 'kết nối Windows, Mac, iPad...', 1390000, 50, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766058930/smartshop/products/supzafu6mnnl3nsgwwhs.jpg', 1, 2, '2025-03-08 12:00:00', '2025-12-18 18:55:33'),
	(34, 'Ổ cứng SSD Kingston NV2 M.2 PCIe Gen4 NVMe 250GB', 'hiệu suất PCIe 4x4 NVMe...', 990000, 40, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1766059051/smartshop/products/jwttieb8uzl21s4ylrdr.jpg', 1, 2, '2025-03-15 13:35:00', '2025-12-18 18:57:34'),
	(35, 'Balo Laptop 15.6inch UMO RENTA Y2213 Navy Backpack', 'Ba lô chống sốc', 690000, 50, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538823/smartshop/products/zyevtums4jumfjm5wghx.jpg', 1, 8, '2025-02-01 10:00:00', '2025-12-12 18:27:05'),
	(36, 'Túi đeo chéo bao tử nam GB-TC17', 'Túi vải canvas', 2990000, 60, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538932/smartshop/products/paqwbowa7hlacct6dz51.jpg', 1, 8, '2025-02-05 11:30:00', '2025-12-12 18:28:55'),
	(37, 'Túi đeo chéo nữ hàng hiệu GB-TC04', 'Chất liệu: Da PU chống thấm...', 399000, 55, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538987/smartshop/products/ww3f3qqw4rsbxvn77def.jpg', 1, 8, '2025-02-10 09:45:00', '2025-12-12 18:29:50'),
	(38, 'Ví da mini cao cấp Gento V073', 'Chất liệu: Da bò nguyên miếng...', 350000, 70, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539301/smartshop/products/faq5ziz7kzznk72tptg8.jpg', 1, 6, '2025-02-15 13:20:00', '2025-12-12 18:35:04'),
	(39, 'Thắt lưng da bò công sở TINO 04 -D02 TRẮNG', 'Gu thời trang nam giới...', 490000, 80, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539229/smartshop/products/vvycjcbnxx543xfj94pv.jpg', 1, 6, '2025-02-20 14:15:00', '2025-12-12 18:33:52'),
	(40, 'Nón Bít Đuôi, Mũ Lưỡi Trai Classic', 'Mũ lưỡi trai đơn giản', 185000, 90, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765557874/smartshop/products/dpgghasgowymiipzavht.jpg', 1, 7, '2025-02-25 15:40:00', '2025-12-12 23:44:36'),
	(41, 'Mũ Bucket BK67 Vải Bò', 'Mũ bucket phong cách', 175000, 65, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765557767/smartshop/products/gd1maqycthnhetrqbyx2.jpg', 1, 7, '2025-03-02 09:25:00', '2025-12-12 23:42:49'),
	(42, 'TÚI CHỐNG SỐC TOMTOC (USA) TERRA', 'Túi đựng laptop đệm mút', 720000, 55, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538551/smartshop/products/afjuwqcke26k6arfvwor.jpg', 1, 8, '2025-04-25 10:20:00', '2025-12-12 18:22:34'),
	(43, 'Túi Dây Rút Nike Tập Gym', 'Túi vải rút gọn', 35000, 65, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538267/smartshop/products/msxwwcsnnxxrygfcvrt3.jpg', 1, 8, '2025-05-03 09:20:00', '2025-12-12 18:17:50'),
	(44, 'Dây đeo thẻ vải', 'Dây đeo thẻ nhân viên', 30000, 140, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539116/smartshop/products/x2xuxfq1hasboozwgac5.jpg', 1, 6, '2025-05-07 10:00:00', '2025-12-12 18:31:59'),
	(45, 'Hub chuyển đổi Trusmi 5 trong 1 DS01-04', 'hỗ trợ xuất hình 4K@30Hz...', 220000, 200, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765556970/smartshop/products/mh58qbxoxvhetv7dp2rv.jpg', 1, 2, '2025-05-18 08:00:00', '2025-12-12 23:29:32'),
	(46, 'Dây đeo thẻ da', 'Dây da đeo thẻ cao cấp', 120000, 8, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539141/smartshop/products/xgusskfvx0vjxwgseqsq.jpg', 1, 6, '2025-05-28 09:30:00', '2025-12-12 18:32:24'),
	(47, 'Đồng Hồ Nam Omega Speedmaster Silver Snoopy', 'Đồng hồ chống nước, dây thép', 39000000, 20, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538892/smartshop/products/c5qv9lj5vgnzrkyjbexa.jpg', 1, 1, '2025-06-10 10:00:00', '2025-12-12 22:38:59'),
	(48, 'Đồng Hồ Nữ Guess Metallic 39mm U1053L7', 'Thép không gỉ, silicone', 4450000, 30, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765553996/smartshop/products/pa6scejqdcszewn1en4x.jpg', 1, 1, '2025-06-12 11:00:00', '2025-12-12 22:39:58'),
	(49, 'Đồng Hồ Nam Longines Presence L4.819.2.32.2', 'Thép không gỉ, dây da', 22100000, 25, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765554084/smartshop/products/td4qrxmcka1nveuywxuq.jpg', 1, 1, '2025-06-14 12:00:00', '2025-12-12 22:41:26'),
	(50, 'Mặt Đồng Hồ Dây Chuyền Nữ Burgi BUR273', 'Máy Quartz (Pin)', 1500000, 15, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765554196/smartshop/products/puk5sx6mfhqymmf8w0dt.jpg', 1, 1, '2025-06-16 13:00:00', '2025-12-12 22:43:18'),
	(51, 'Đồng hồ thông minh Amazfit T-Rex 3 Pro', 'Đồng hồ điện tử đa chức năng', 9990000, 40, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765556085/smartshop/products/tlqw3m4azib4kcxnwnfz.jpg', 1, 1, '2025-06-18 14:00:00', '2025-12-12 23:14:48'),
	(52, 'Đồng Hồ Nữ Swarovski Metal Bracelet 5717588', 'Máy Quartz (Pin)', 990000, 35, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765554320/smartshop/products/i0unmbeevausdsolgjoc.jpg', 1, 1, '2025-06-20 15:00:00', '2025-12-12 22:45:22'),
	(53, 'Đồng hồ thông minh Samsung Galaxy Watch8 Classic', 'Mặt đồng hồ thể thao mạnh mẽ', 10690000, 22, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765554613/smartshop/products/rw132cdowcgddbrgqo0m.jpg', 1, 1, '2025-06-22 16:00:00', '2025-12-12 22:50:15'),
	(54, 'Apple Watch Ultra 3 49mm (5G)', 'Màn hình Retina Luôn Bật...', 26690000, 28, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765556368/smartshop/products/j0bjz58j2kbpjihtycke.jpg', 1, 1, '2025-06-25 17:00:00', '2025-12-12 23:19:30'),
	(55, 'Đồng hồ thông minh Garmin Fenix 8 51mm', 'Công nghệ màn hình AMOLED...', 28269000, 12, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765556217/smartshop/products/wxdctzvc7tg3hgnoncy2.jpg', 1, 1, '2025-06-27 18:00:00', '2025-12-12 23:16:59'),
	(56, 'Đồng hồ định vị trẻ em thông minh ELFDIGI DINO 1', 'Đồng hồ cho bé trai/bé gái', 1990000, 59, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765556735/smartshop/products/bejdqhzo5fh8qe83mvzw.jpg', 1, 1, '2025-06-30 09:00:00', '2025-12-13 01:15:36'),
	(57, 'Canon EOS 1200D Kit 18-55mm IS II', 'Cảm biến CMOS 18.2 Megapixels...', 4200000, 8, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765540679/smartshop/products/wkbywezmdmto4ts7dzeg.jpg', 1, 3, '2025-07-01 10:00:00', '2025-12-12 18:58:16'),
	(58, 'Máy Ảnh Sony A6000 kit 16-50mm OSS', 'độ phân giải 24.3 MPs...', 10500000, 6, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765540378/smartshop/products/fjraoic5hduktdanotz6.jpg', 1, 3, '2025-07-03 11:00:00', '2025-12-12 18:53:01'),
	(59, 'Máy Ảnh Fujifilm X-T100 Body (Đen)', 'Cảm biến CMOS APS-C 24,2MP...', 11990000, 10, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765540239/smartshop/products/waslj8b3kfenuwp1mmqu.jpg', 1, 3, '2025-07-05 12:00:00', '2025-12-12 18:50:41'),
	(60, 'Máy quay cầm tay DJI Osmo Pocket 3', 'cảm biến CMOS 1 inch...', 13990000, 20, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765540120/smartshop/products/d0swjud4n7htkkjz9jwo.jpg', 1, 3, '2025-07-07 13:00:00', '2025-12-12 18:48:43'),
	(61, 'Ống Kính Canon RF 50mm f/1.8 STM', 'Lớp phủ Super Spectra Coating...', 4990000, 15, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539973/smartshop/products/kdwguuzuqiprojloop3z.jpg', 1, 3, '2025-07-09 14:00:00', '2025-12-12 18:46:16'),
	(62, 'Ống kính Sony FE 35mm f/1.4 GM', 'Ống kính góc rộng', 34353818, 12, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539847/smartshop/products/qrq0qj13gonruo98ox5c.jpg', 1, 3, '2025-07-10 15:00:00', '2025-12-12 18:44:10'),
	(63, 'Tripod chụp hình 3 Chân T-3218Xl', 'Chất liệu: hợp kim nhôm...', 295000, 50, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539735/smartshop/products/grivc9upxrpbqp74cour.jpg', 1, 3, '2025-07-11 16:00:00', '2025-12-12 18:42:17'),
	(64, 'Tay cầm chống rung DJI OM 7 Pro', 'Thiết bị chống rung máy ảnh', 2450000, 18, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539654/smartshop/products/nyfyqpy7e0wiohhcadqo.jpg', 1, 3, '2025-07-12 17:00:00', '2025-12-12 18:40:57'),
	(65, 'Đèn flash rời EF-42', 'Flash hỗ trợ chụp thiếu sáng', 5590000, 35, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539588/smartshop/products/fzksrweifd0pr3jaf5sn.jpg', 1, 3, '2025-07-13 18:00:00', '2025-12-12 18:39:50'),
	(66, 'Túi đựng máy ảnh da bò sáp Gento T808', 'Chất liệu: Da Bò Sáp 100%...', 1450000, 40, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765539392/smartshop/products/zlwb7u4ljuh3tymcche3.jpg', 1, 3, '2025-07-14 19:00:00', '2025-12-12 18:36:34'),
	(67, 'Samsung Galaxy A15 8GB/128GB', 'Điện thoại phổ thông', 4500000, 25, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538183/smartshop/products/uhskgbunavjilqt5ixu8.jpg', 1, 4, '2025-07-15 10:00:00', '2025-12-12 18:16:26'),
	(68, 'iPhone 12 64GB', 'Điện thoại Apple', 14500000, 12, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538078/smartshop/products/m7jkza2r78g8cxknw15v.jpg', 1, 4, '2025-07-16 11:00:00', '2025-12-12 18:14:41'),
	(69, 'Xiaomi Redmi Note 13 5G', 'Pin trâu, cấu hình mạnh', 5200000, 30, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765538044/smartshop/products/idocvlc0h14lc9dtjwhj.jpg', 1, 4, '2025-07-17 12:00:00', '2025-12-12 18:14:07'),
	(70, 'Oppo Reno 11 5G 8G/256GB', 'Camera siêu nét', 10900000, 14, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537988/smartshop/products/ob6mplium3ggl2yyv8bf.jpg', 1, 4, '2025-07-18 13:00:00', '2025-12-12 18:13:11'),
	(71, 'iPhone 13 128GB', 'Máy mới đẹp', 17500000, 10, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537923/smartshop/products/ul9knle35dthbksyrq7h.jpg', 1, 4, '2025-07-19 14:00:00', '2025-12-12 18:12:06'),
	(72, 'Samsung Galaxy S23 Ultra 512GB', 'Flagship mạnh mẽ', 19500000, 5, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537888/smartshop/products/fmcckjddfnmpq3cgfcbf.jpg', 1, 4, '2025-07-20 15:00:00', '2025-12-13 00:45:14'),
	(73, 'Tai nghe Bluetooth OWS Baseus Eli 10i Fit', 'Kết nối Bluetooth v5.4...', 730000, 80, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537753/smartshop/products/fy2smqd4a40hdtcqghut.jpg', 1, 4, '2025-07-21 16:00:00', '2025-12-12 18:09:15'),
	(74, 'Ốp lưng MagSafe cho iPhone 13', 'Ốp lưng trong suốt siêu mỏng', 150000, 120, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537559/smartshop/products/fkleo4gw96dr9axpnq8r.jpg', 1, 4, '2025-07-22 17:00:00', '2025-12-12 18:06:02'),
	(75, 'Cáp sạc nhanh Type-C Anker A8865', 'Sạc nhanh 140W 0.9m', 180000, 99, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537414/smartshop/products/g4strldmg2shtyteu8uq.jpg', 1, 4, '2025-07-23 18:00:00', '2025-12-16 18:14:55'),
	(76, 'Kinh cường lực KingKong ', 'Miếng dán cường lực chống nhìn trộm', 90000, 150, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537279/smartshop/products/ohvdqvspiogvqdsm5ncw.jpg', 1, 4, '2025-07-24 19:00:00', '2025-12-12 18:01:22'),
	(77, 'Nước hoa Dior Sauvage', 'Hương nam tính mạnh mẽ', 3250000, 18, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537145/smartshop/products/qmotndpgoan6doxmc4wp.jpg', 1, 5, '2025-07-25 10:00:00', '2025-12-12 17:59:08'),
	(78, 'Nước hoa Chanel No.5', 'Hương cổ điển quyến rũ', 4200000, 9, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537097/smartshop/products/ishfz5d9tvkhytx7zsjr.jpg', 1, 5, '2025-07-26 11:00:00', '2025-12-13 01:25:53'),
	(79, 'Nước hoa Versace Bright Crystal', 'Hương ngọt nhẹ', 2300000, 17, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765537056/smartshop/products/aiqhj9ki2vl5ye9zp95c.jpg', 1, 5, '2025-07-27 12:00:00', '2025-12-16 18:14:55'),
	(80, 'Nước hoa Gucci Bloom', 'Hương hoa tinh tế', 2950000, 15, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765536964/smartshop/products/mcfqv8x5blvpt15hlzf2.jpg', 1, 5, '2025-07-28 13:00:00', '2025-12-12 17:56:06'),
	(81, 'Iphone 14', 'máy đẹp', 15000000, 15, 'https://res.cloudinary.com/djmy7irgt/image/upload/v1765564103/smartshop/products/zccraq110niay2fni24f.jpg', 1, 4, '2025-12-13 01:28:22', '2025-12-13 01:28:25');
-- ============================================================
-- VOUCHERS
-- ============================================================
INSERT INTO vouchers (id,code,type,value,min_order,start_date,end_date,is_active,category_id) VALUES
(1,'WELCOME10','PERCENTAGE',10,0,'2025-01-01 00:00:00','2025-12-31 23:59:59',1,NULL),
(2,'FAST20','PERCENTAGE',20,500000,'2025-03-01 00:00:00','2025-03-31 23:59:59',1,NULL),
(3,'SUMMER15','PERCENTAGE',15,700000,'2025-06-01 00:00:00','2025-06-30 23:59:59',1,NULL),
(4,'TECH5','PERCENTAGE',5,200000,'2025-09-01 00:00:00','2025-09-30 23:59:59',1,2),
(5,'FREESHIP','FIXED',30000,150000,'2025-10-01 00:00:00','2025-12-31 23:59:59',1,NULL);

INSERT INTO user_vouchers (id,user_id,voucher_id,is_used) VALUES
(1,2,1,0),
(2,3,2,1),
(3,4,3,0),
(4,5,4,0),
(5,6,5,0),
(6,7,1,0),
(7,8,3,0),
(8,9,2,1),
(9,10,5,0),
(10,11,1,0);

-- ============================================================
-- CARTS & CART_ITEMS
-- ============================================================
INSERT INTO carts (id,user_id) VALUES
(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,8),(8,9),(9,10);

INSERT INTO cart_items (id,cart_id,product_id,quantity,is_wishlist) VALUES
(1,1,3,1,1),
(2,1,4,1,0),
(3,2,26,1,0),
(4,3,5,1,1),
(5,4,6,2,0),
(6,5,7,1,0),
(7,6,8,1,1),
(8,7,9,2,0),
(9,8,10,1,1),
(10,9,12,1,0);

-- ============================================================
-- ORDERS (50 ĐƠN)
-- ============================================================
INSERT INTO orders 
(id,order_number,user_id,status,total_amount,shipping_fee,payment_method,payment_status,shipping_address,created_at,voucher_code,voucher_discount) VALUES
(1,'ORD-2025-001',2,'COMPLETED',320000,30000,'COD','SUCCESS','HCM','2025-01-15 09:30:00',NULL,NULL),
(2,'ORD-2025-002',3,'PENDING',2300000,30000,'COD','PENDING','HN','2025-02-10 10:10:00',NULL,NULL),
(3,'ORD-2025-003',4,'SHIPPED',510000,50000,'COD','PENDING','Đà Nẵng','2025-03-20 14:00:00','WELCOME10',51000),
(4,'ORD-2025-004',5,'CANCELLED',1590000,30000,'COD','FAILED','HCM','2025-04-11 16:45:00',NULL,NULL),
(5,'ORD-2025-005',6,'COMPLETED',440000,30000,'COD','SUCCESS','HCM','2025-05-28 11:00:00','FAST20',88000),
(6,'ORD-2025-006',7,'PROCESSING',470000,50000,'COD','PENDING','Huế','2025-06-08 13:00:00',NULL,NULL),
(7,'ORD-2025-007',8,'PENDING',280000,30000,'COD','PENDING','HCM','2025-07-21 18:30:00',NULL,NULL),
(8,'ORD-2025-008',9,'COMPLETED',430000,50000,'COD','SUCCESS','Cần Thơ','2025-08-12 09:55:00','SUMMER15',64500),
(9,'ORD-2025-009',10,'SHIPPED',350000,30000,'COD','PENDING','Hà Nội','2025-09-18 19:40:00','TECH5',17500),
(10,'ORD-2025-010',2,'COMPLETED',500000,30000,'COD','SUCCESS','HCM','2025-10-29 08:20:00','FREESHIP',30000),
(11,'ORD-2025-011',3,'COMPLETED',160000,30000,'COD','SUCCESS','HCM','2025-11-03 15:15:00',NULL,NULL),
(12,'ORD-2025-012',4,'CANCELLED',350000,30000,'COD','FAILED','HCM','2025-12-01 10:05:00',NULL,NULL),
(13,'ORD-2025-013',5,'COMPLETED',180000,30000,'COD','SUCCESS','HCM','2025-01-25 09:00:00',NULL,NULL),
(14,'ORD-2025-014',6,'COMPLETED',210000,30000,'COD','SUCCESS','HCM','2025-02-27 10:30:00',NULL,NULL),
(15,'ORD-2025-015',7,'PENDING',1290000,30000,'COD','PENDING','HCM','2025-03-15 11:45:00',NULL,NULL),
(16,'ORD-2025-016',8,'COMPLETED',480000,30000,'COD','SUCCESS','HCM','2025-06-20 08:20:00',NULL,NULL),
(17,'ORD-2025-017',9,'COMPLETED',700000,30000,'COD','SUCCESS','HCM','2025-07-18 12:10:00',NULL,NULL),
(18,'ORD-2025-018',10,'SHIPPED',530000,50000,'COD','PENDING','HCM','2025-08-25 19:15:00',NULL,NULL),
(19,'ORD-2025-019',3,'PENDING',300000,30000,'COD','PENDING','HCM','2025-10-05 17:00:00',NULL,NULL),
(20,'ORD-2025-020',4,'COMPLETED',640000,30000,'COD','SUCCESS','HCM','2025-12-20 20:30:00',NULL,NULL),
(21,'ORD-2025-021',11,'COMPLETED',450000,30000,'COD','SUCCESS','HCM','2025-01-18 09:40:00',NULL,NULL),
(22,'ORD-2025-022',12,'PENDING',260000,30000,'COD','PENDING','HN','2025-02-06 10:20:00',NULL,0),
(23,'ORD-2025-023',13,'COMPLETED',530000,50000,'COD','SUCCESS','Đà Nẵng','2025-02-25 14:50:00','WELCOME10',53000),
(24,'ORD-2025-024',14,'CANCELLED',390000,30000,'COD','FAILED','HCM','2025-03-05 16:25:00',NULL,NULL),
(25,'ORD-2025-025',15,'COMPLETED',780000,30000,'COD','SUCCESS','HCM','2025-03-22 19:10:00',NULL,NULL),
(26,'ORD-2025-026',16,'PROCESSING',220000,50000,'COD','PENDING','Huế','2025-04-03 11:15:00',NULL,NULL),
(27,'ORD-2025-027',17,'COMPLETED',360000,30000,'COD','SUCCESS','HCM','2025-04-19 13:30:00',NULL,NULL),
(28,'ORD-2025-028',18,'PENDING',410000,30000,'COD','PENDING','HCM','2025-05-07 09:55:00',NULL,NULL),
(29,'ORD-2025-029',19,'COMPLETED',990000,30000,'COD','SUCCESS','HCM','2025-05-23 18:45:00','FAST20',198000),
(30,'ORD-2025-030',20,'SHIPPED',260000,50000,'COD','PENDING','Cần Thơ','2025-06-02 08:30:00',NULL,NULL),
(31,'ORD-2025-031',21,'COMPLETED',380000,30000,'COD','SUCCESS','HCM','2025-06-18 10:15:00',NULL,NULL),
(32,'ORD-2025-032',22,'PENDING',290000,30000,'COD','PENDING','HCM','2025-07-04 11:20:00',NULL,NULL),
(33,'ORD-2025-033',23,'COMPLETED',520000,30000,'COD','SUCCESS','HCM','2025-07-20 14:00:00','SUMMER15',78000),
(34,'ORD-2025-034',24,'COMPLETED',610000,30000,'COD','SUCCESS','HCM','2025-08-03 15:35:00',NULL,NULL),
(35,'ORD-2025-035',25,'PENDING',450000,30000,'COD','PENDING','HCM','2025-08-18 16:40:00',NULL,NULL),
(36,'ORD-2025-036',26,'COMPLETED',900000,30000,'COD','SUCCESS','HCM','2025-09-02 17:50:00','TECH5',45000),
(37,'ORD-2025-037',27,'CANCELLED',310000,30000,'COD','FAILED','HCM','2025-09-16 18:30:00',NULL,NULL),
(38,'ORD-2025-038',28,'COMPLETED',270000,30000,'COD','SUCCESS','HN','2025-10-01 09:10:00',NULL,NULL),
(39,'ORD-2025-039',29,'SHIPPED',640000,50000,'COD','PENDING','Đà Nẵng','2025-10-12 13:45:00',NULL,NULL),
(40,'ORD-2025-040',30,'COMPLETED',720000,30000,'COD','SUCCESS','HCM','2025-10-28 19:20:00','FREESHIP',30000),
(41,'ORD-2025-041',11,'COMPLETED',350000,30000,'COD','SUCCESS','HCM','2025-11-05 10:25:00',NULL,NULL),
(42,'ORD-2025-042',12,'PENDING',190000,30000,'COD','PENDING','HN','2025-11-12 11:30:00',NULL,NULL),
(43,'ORD-2025-043',13,'COMPLETED',260000,50000,'COD','SUCCESS','Đà Nẵng','2025-11-20 14:40:00',NULL,NULL),
(44,'ORD-2025-044',14,'COMPLETED',480000,30000,'COD','SUCCESS','Cần Thơ','2025-11-28 15:50:00','WELCOME10',48000),
(45,'ORD-2025-045',15,'PENDING',320000,30000,'COD','PENDING','HCM','2025-12-03 09:05:00',NULL,NULL),
(46,'ORD-2025-046',16,'COMPLETED',410000,30000,'COD','SUCCESS','HCM','2025-12-08 13:15:00',NULL,NULL),
(47,'ORD-2025-047',17,'SHIPPED',560000,30000,'COD','PENDING','HCM','2025-12-14 16:25:00',NULL,NULL),
(48,'ORD-2025-048',18,'COMPLETED',295000,30000,'COD','SUCCESS','HN','2025-12-20 18:40:00',NULL,NULL),
(49,'ORD-2025-049',19,'COMPLETED',650000,50000,'COD','SUCCESS','Đà Nẵng','2025-12-25 19:50:00','SUMMER15',97500),
(50,'ORD-2025-050',20,'CANCELLED',230000,30000,'COD','FAILED','HCM','2025-12-30 20:30:00',NULL,NULL);


-- ORDER_ITEMS (không tham chiếu sản phẩm > 75)
INSERT INTO order_items (id,order_id,product_id,quantity,price) VALUES
(1,1,1,2,160000),
(2,2,26,1,2300000),
(3,3,3,1,350000),
(4,3,4,1,250000),
(5,4,30,1,1590000),
(6,5,1,1,160000),
(7,5,6,1,280000),
(8,6,7,1,320000),
(9,6,9,1,150000),
(10,7,8,1,280000),
(11,8,6,1,120000),
(12,8,10,1,350000),
(13,9,3,1,350000),
(14,10,4,1,250000),
(15,10,9,1,150000),
(16,11,1,1,160000),
(17,12,10,1,350000),
(18,13,13,1,180000),
(19,14,14,1,210000),
(20,15,15,1,1290000),
(21,16,7,1,320000),
(22,16,6,1,160000),
(23,17,11,1,220000),
(24,17,12,1,300000),
(25,18,26,1,2300000),
(26,19,9,2,150000),
(27,20,30,1,1590000),
(28,21,2,1,160000),
(29,21,52,1,290000),
(30,22,8,1,190000),
(31,23,5,1,330000),
(32,23,36,1,200000),
(33,24,51,1,390000),
(34,25,29,1,780000),
(35,26,11,1,210000),
(36,27,18,1,500000),
(37,28,9,1,300000),
(38,29,29,1,1250000),
(39,29,43,1,120000),
(40,30,10,1,260000),
(41,31,10,1,260000),
(42,32,20,1,190000),
(43,33,41,1,520000),
(44,34,52,1,430000),
(45,35,4,1,320000),
(46,36,34,1,790000),
(47,37,54,1,220000),
(48,38,12,1,290000),
(49,39,40,1,950000),
(50,40,41,1,520000),
(51,41,3,1,220000),
(52,42,1,1,150000),
(53,43,9,1,300000),
(54,44,28,1,380000),
(55,45,22,1,230000),
(56,46,17,1,420000),
(57,47,27,1,650000),
(58,48,61,1,50000),
(59,49,29,1,1250000),
(60,50,55,1,250000);

-- ORDER_STATUS
INSERT INTO order_status (id,order_id,old_status,new_status,created_at) VALUES
(1,1,'PENDING','COMPLETED','2025-01-16 10:00:00'),
(2,3,'PENDING','SHIPPED','2025-03-21 09:00:00'),
(3,4,'PENDING','CANCELLED','2025-04-12 08:00:00'),
(4,5,'PENDING','COMPLETED','2025-05-29 12:00:00'),
(5,8,'PENDING','COMPLETED','2025-08-13 14:30:00'),
(6,10,'PENDING','COMPLETED','2025-10-30 10:00:00'),
(7,11,'PENDING','COMPLETED','2025-11-04 09:00:00'),
(8,12,'PENDING','CANCELLED','2025-12-02 09:30:00'),
(9,16,'PENDING','COMPLETED','2025-06-21 09:40:00'),
(10,17,'PENDING','COMPLETED','2025-07-19 11:00:00'),
(11,18,'PENDING','SHIPPED','2025-08-26 10:10:00'),
(12,20,'PENDING','COMPLETED','2025-12-21 08:50:00'),
(13,21,'PENDING','COMPLETED','2025-01-18 10:30:00'),
(14,23,'PENDING','COMPLETED','2025-02-26 10:30:00'),
(15,25,'PENDING','COMPLETED','2025-03-23 10:00:00'),
(16,27,'PENDING','COMPLETED','2025-04-20 09:30:00'),
(17,29,'PENDING','COMPLETED','2025-05-24 10:15:00'),
(18,31,'PENDING','COMPLETED','2025-06-19 11:00:00'),
(19,33,'PENDING','COMPLETED','2025-07-21 15:00:00'),
(20,34,'PENDING','COMPLETED','2025-08-04 16:00:00'),
(21,36,'PENDING','COMPLETED','2025-09-03 18:00:00'),
(22,38,'PENDING','COMPLETED','2025-10-02 10:00:00'),
(23,40,'PENDING','COMPLETED','2025-10-29 20:00:00'),
(24,41,'PENDING','COMPLETED','2025-11-06 11:00:00'),
(25,43,'PENDING','COMPLETED','2025-11-21 15:00:00'),
(26,44,'PENDING','COMPLETED','2025-11-29 16:00:00'),
(27,46,'PENDING','COMPLETED','2025-12-09 14:00:00'),
(28,48,'PENDING','COMPLETED','2025-12-21 19:30:00'),
(29,49,'PENDING','COMPLETED','2025-12-26 20:30:00'),
(30,37,'PENDING','CANCELLED','2025-09-17 09:00:00'),
(31,50,'PENDING','CANCELLED','2025-12-31 09:00:00');

-- PAYMENT_TRANSACTIONS (cho các đơn COMPLETED)
INSERT INTO payment_transactions (id,order_id,method,amount,status,transaction_no,gateway_response,created_at) VALUES
(1,1,'COD',320000,'SUCCESS',NULL,NULL,'2025-01-15 09:40:00'),
(2,5,'COD',440000,'SUCCESS',NULL,NULL,'2025-05-28 11:10:00'),
(3,8,'COD',430000,'SUCCESS',NULL,NULL,'2025-08-12 10:05:00'),
(4,10,'COD',500000,'SUCCESS',NULL,NULL,'2025-10-29 08:30:00'),
(5,11,'COD',160000,'SUCCESS',NULL,NULL,'2025-11-03 15:20:00'),
(6,13,'COD',180000,'SUCCESS',NULL,NULL,'2025-01-25 09:15:00'),
(7,14,'COD',210000,'SUCCESS',NULL,NULL,'2025-02-27 10:40:00'),
(8,16,'COD',480000,'SUCCESS',NULL,NULL,'2025-06-20 08:30:00'),
(9,17,'COD',700000,'SUCCESS',NULL,NULL,'2025-07-18 12:20:00'),
(10,20,'COD',640000,'SUCCESS',NULL,NULL,'2025-12-20 20:40:00'),
(11,21,'COD',450000,'SUCCESS',NULL,NULL,'2025-01-18 10:00:00'),
(12,23,'COD',530000,'SUCCESS',NULL,NULL,'2025-02-25 15:10:00'),
(13,25,'COD',780000,'SUCCESS',NULL,NULL,'2025-03-22 19:30:00'),
(14,27,'COD',360000,'SUCCESS',NULL,NULL,'2025-04-19 13:50:00'),
(15,29,'COD',990000,'SUCCESS',NULL,NULL,'2025-05-23 19:00:00'),
(16,31,'COD',380000,'SUCCESS',NULL,NULL,'2025-06-18 10:30:00'),
(17,33,'COD',520000,'SUCCESS',NULL,NULL,'2025-07-20 14:20:00'),
(18,34,'COD',610000,'SUCCESS',NULL,NULL,'2025-08-03 16:00:00'),
(19,36,'COD',900000,'SUCCESS',NULL,NULL,'2025-09-02 18:10:00'),
(20,38,'COD',270000,'SUCCESS',NULL,NULL,'2025-10-01 09:30:00'),
(21,40,'COD',720000,'SUCCESS',NULL,NULL,'2025-10-28 19:40:00'),
(22,41,'COD',350000,'SUCCESS',NULL,NULL,'2025-11-05 10:40:00'),
(23,43,'COD',260000,'SUCCESS',NULL,NULL,'2025-11-20 15:00:00'),
(24,44,'COD',480000,'SUCCESS',NULL,NULL,'2025-11-28 16:10:00'),
(25,46,'COD',410000,'SUCCESS',NULL,NULL,'2025-12-08 13:30:00'),
(26,48,'COD',295000,'SUCCESS',NULL,NULL,'2025-12-20 19:00:00'),
(27,49,'COD',650000,'SUCCESS',NULL,NULL,'2025-12-25 20:10:00');

-- ============================================================
-- REVIEWS (chỉ dùng product_id <= 75)
-- ============================================================
INSERT INTO reviews (id,user_id,product_id,rating,comment,created_at) VALUES
(1,2,1,5,'Áo đẹp, chất vải tốt','2025-01-20 11:00:00'),
(2,3,26,4,'Loa nghe ổn trong tầm giá','2025-02-25 18:30:00'),
(3,4,3,5,'Chuột dùng rất mượt','2025-03-25 09:45:00'),
(4,5,30,4,'Bàn phím gõ sướng, hơi ồn','2025-04-15 20:00:00'),
(5,6,7,5,'Hoodie đẹp, ấm','2025-07-01 08:10:00'),
(6,7,10,4,'Áo len mặc khá ấm','2025-10-31 13:00:00'),
(7,8,6,5,'Áo khoác mỏng, dễ mặc','2025-06-12 09:20:00'),
(8,9,50,4,'Đèn LED đủ sáng, dễ dùng','2025-06-25 21:10:00'),
(9,10,13,5,'Áo polo mặc rất thoải mái','2025-07-10 10:05:00'),
(10,3,14,4,'Polo nữ lên form đẹp','2025-08-02 16:40:00'),
(11,4,27,5,'Tai nghe dùng lâu không đau tai','2025-08-20 19:00:00'),
(12,5,4,4,'Quần jean mặc thoải mái','2025-02-28 14:15:00'),
(13,6,36,5,'USB chép nhanh, ổn định','2025-05-10 11:30:00'),
(14,7,8,4,'Quần short dễ phối đồ','2025-04-30 17:50:00'),
(15,8,12,5,'Váy đẹp, đúng mô tả','2025-06-22 09:55:00'),
(16,9,29,5,'Loa công suất lớn, nghe đã','2025-07-15 11:00:00'),
(17,10,11,4,'Form váy đẹp, chất vải ổn','2025-08-05 12:00:00'),
(18,11,2,5,'Áo thun đẹp, vải mịn','2025-03-18 10:30:00'),
(19,12,32,4,'Chuột không dây cầm vừa tay','2025-05-22 13:00:00'),
(20,13,34,5,'SSD nhanh, máy mượt hơn hẳn','2025-06-10 09:45:00'),
(21,14,51,4,'Ba lô đựng laptop chắc chắn','2025-07-02 15:20:00'),
(22,15,52,4,'Túi đeo chéo đẹp, đường may ổn','2025-08-08 16:40:00'),
(23,6,53,5,'Túi nữ nhỏ gọn, tiện mang đi chơi','2025-09-01 18:10:00'),
(24,7,54,4,'Ví da mềm, đựng vừa tiền','2025-09-10 11:30:00'),
(25,8,60,4,'Ổ cắm điện tiện lợi, nhiều lỗ','2025-10-02 09:40:00'),
(26,9,68,5,'Túi chống sốc ôm laptop tốt','2025-10-18 14:20:00'),
(27,10,50,5,'Đèn bàn sáng rõ, chống chói','2025-11-05 20:00:00'),
(28,11,52,4,'Túi đeo chắc chắn, dây êm','2025-11-20 10:15:00'),
(29,12,54,4,'Ví da nhỏ gọn, đẹp','2025-12-02 13:50:00'),
(30,13,68,5,'Túi chống sốc dày, bảo vệ tốt','2025-12-15 09:25:00');

-- REVIEW_MEDIA: để trống, có thể thêm khi cần
