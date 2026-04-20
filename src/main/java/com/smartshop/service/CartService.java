package com.smartshop.service;

import com.smartshop.dto.cart.CartItemRequest;
import com.smartshop.dto.cart.CartItemResponse;
import com.smartshop.dto.cart.CartResponse;
import com.smartshop.dto.voucher.ApplyVoucherResponse;
import com.smartshop.entity.cart.CartItem;
import com.smartshop.entity.cart.ShoppingCart;
import com.smartshop.entity.product.Product;
import com.smartshop.entity.user.User;
import com.smartshop.entity.voucher.UserVoucher;
import com.smartshop.entity.voucher.Voucher;
import com.smartshop.repository.CartItemRepository;
import com.smartshop.repository.ProductRepository;
import com.smartshop.repository.ShoppingCartRepository;
import com.smartshop.repository.UserVoucherRepository;
import com.smartshop.repository.VoucherRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartService {

    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;

    public CartService(ShoppingCartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       VoucherRepository voucherRepository,
                       UserVoucherRepository userVoucherRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.voucherRepository = voucherRepository;
        this.userVoucherRepository = userVoucherRepository;
    }

    // Lấy user hiện tại từ SecurityContext
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }

    // Lấy hoặc tạo mới giỏ hàng cho user
    private ShoppingCart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> cartRepository.save(
                        ShoppingCart.builder()
                                .user(user)
                                .build()
                ));
    }

    // Tính tổng tiền + tổng số lượng
    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartItemResponse> itemResponses = items.stream()
                .filter(i -> !Boolean.TRUE.equals(i.getIsWishlist()))
                .map(CartItemResponse::fromEntity)
                .collect(Collectors.toList());

        double totalAmount = itemResponses.stream()
                .mapToDouble(CartItemResponse::getLineTotal)
                .sum();
        int totalQuantity = itemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartResponse.builder()
                .items(itemResponses)
                .totalAmount(totalAmount)
                .totalQuantity(totalQuantity)
                .build();
    }

    // ✅ Lấy giỏ hàng hiện tại
    public CartResponse getCart() {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);
        List<CartItem> items = cartItemRepository.findByCartAndIsWishlist(cart, false);
        return buildCartResponse(items);
    }

    // ✅ Thêm vào giỏ
    public CartResponse addToCart(CartItemRequest req) {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int quantity = (req.getQuantity() == null || req.getQuantity() <= 0)
                ? 1 : req.getQuantity();

        CartItem item = cartItemRepository.findByCartAndProductAndIsWishlist(cart, product, false)
                .orElseGet(() -> CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(0)
                        .isWishlist(false)
                        .build());

        item.setQuantity(item.getQuantity() + quantity);
        cartItemRepository.save(item);

        List<CartItem> items = cartItemRepository.findByCartAndIsWishlist(cart, false);
        return buildCartResponse(items);
    }

    // ✅ Cập nhật số lượng
    public CartResponse updateQuantity(CartItemRequest req) {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem item = cartItemRepository.findByCartAndProductAndIsWishlist(cart, product, false)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        int quantity = (req.getQuantity() == null) ? item.getQuantity() : req.getQuantity();

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        List<CartItem> items = cartItemRepository.findByCartAndIsWishlist(cart, false);
        return buildCartResponse(items);
    }

    // ✅ Xóa khỏi giỏ
    public CartResponse removeFromCart(Long productId) {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        cartItemRepository.findByCartAndProductAndIsWishlist(cart, product, false)
                .ifPresent(cartItemRepository::delete);

        List<CartItem> items = cartItemRepository.findByCartAndIsWishlist(cart, false);
        return buildCartResponse(items);
    }

    // ✅ Wishlist (thêm / bỏ / xem)

    public List<CartItemResponse> getWishlist() {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);
        return cartItemRepository.findByCartAndIsWishlist(cart, true)
                .stream()
                .map(CartItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CartItemResponse> addToWishlist(Long productId) {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        cartItemRepository.findByCartAndProductAndIsWishlist(cart, product, true)
                .orElseGet(() -> cartItemRepository.save(
                        CartItem.builder()
                                .cart(cart)
                                .product(product)
                                .quantity(1)
                                .isWishlist(true)
                                .build()
                ));

        return getWishlist();
    }

    public List<CartItemResponse> removeFromWishlist(Long productId) {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        cartItemRepository.findByCartAndProductAndIsWishlist(cart, product, true)
                .ifPresent(cartItemRepository::delete);

        return getWishlist();
    }

    // ✅ Áp dụng voucher cho giỏ hàng hiện tại (tính tiền sau giảm)
    public ApplyVoucherResponse applyVoucher(String code) {
        User user = getCurrentUser();
        ShoppingCart cart = getOrCreateCart(user);
        List<CartItem> items = cartItemRepository.findByCartAndIsWishlist(cart, false);
        return applyVoucherForItems(code, items);
    }

    // ✅ Áp dụng voucher cho danh sách sản phẩm cụ thể
    public ApplyVoucherResponse applyVoucherForItems(String code, List<CartItem> items) {
        User user = getCurrentUser();
        CartResponse cartResponse = buildCartResponse(items);

        double originalTotal = cartResponse.getTotalAmount() != null ? cartResponse.getTotalAmount() : 0.0;

        if (code == null || code.isBlank()) {
            return ApplyVoucherResponse.builder()
                    .voucherId(null)
                    .code(null)
                    .originalTotal(originalTotal)
                    .discount(0.0)
                    .finalTotal(originalTotal)
                    .build();
        }

        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại"));

        // Kiểm tra nếu user đã dùng voucher này rồi
        userVoucherRepository.findByUserAndVoucher(user, voucher)
                .filter(UserVoucher::isUsed)
                .ifPresent(uv -> {
                    throw new RuntimeException("Bạn đã sử dụng voucher này rồi");
                });

        // Kiểm tra active
        if (voucher.getIsActive() == null || !voucher.getIsActive()) {
            throw new RuntimeException("Voucher đã bị vô hiệu hóa");
        }

        // Kiểm tra thời gian
        var now = java.time.LocalDateTime.now();
        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException("Voucher chưa đến thời gian áp dụng");
        }
        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Voucher đã hết hạn");
        }

        // Tính tổng tiền làm base để giảm (áp dụng theo danh mục nếu có)
        double baseAmount = originalTotal;
        if (voucher.getCategory() != null) {
            Long categoryId = voucher.getCategory().getId();
            baseAmount = items.stream()
                    .filter(ci -> ci.getProduct() != null
                            && ci.getProduct().getCategory() != null
                            && categoryId.equals(ci.getProduct().getCategory().getId()))
                    .mapToDouble(ci -> ci.getProduct().getPrice() * ci.getQuantity())
                    .sum();

            if (baseAmount <= 0) {
                throw new RuntimeException("Giỏ hàng không có sản phẩm thuộc danh mục áp dụng voucher");
            }
        }

        // Kiểm tra đơn tối thiểu trên baseAmount
        if (voucher.getMinOrder() != null && baseAmount < voucher.getMinOrder()) {
            throw new RuntimeException("Đơn hàng không đủ giá trị tối thiểu để áp dụng voucher");
        }

        double discount = 0.0;
        if ("PERCENTAGE".equalsIgnoreCase(voucher.getType())) {
            discount = baseAmount * (voucher.getValue() / 100.0);
        } else if ("FIXED_AMOUNT".equalsIgnoreCase(voucher.getType())) {
            discount = voucher.getValue();
        }

        if (discount < 0) discount = 0;
        if (discount > baseAmount) discount = baseAmount;

        double finalTotal = originalTotal - discount;

        return ApplyVoucherResponse.builder()
                .voucherId(voucher.getId())
                .code(voucher.getCode())
                .originalTotal(originalTotal)
                .discount(discount)
                .finalTotal(finalTotal)
                .build();
    }
}


