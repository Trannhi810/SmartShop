package com.smartshop.service;

import com.smartshop.dto.cart.CartResponse;
import com.smartshop.dto.order.CheckoutRequest;
import com.smartshop.dto.order.CheckoutResponse;
import com.smartshop.dto.voucher.ApplyVoucherResponse;
import com.smartshop.entity.cart.CartItem;
import com.smartshop.entity.cart.ShoppingCart;
import com.smartshop.entity.enums.ShippingMethod;
import com.smartshop.entity.order.Order;
import com.smartshop.entity.order.OrderItem;
import com.smartshop.entity.user.User;
import com.smartshop.entity.voucher.UserVoucher;
import com.smartshop.entity.voucher.Voucher;
import com.smartshop.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CheckoutService {

    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final ProductRepository productRepository;

    public CheckoutService(ShoppingCartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           OrderRepository orderRepository,
                           CartService cartService,
                           VoucherRepository voucherRepository,
                           UserVoucherRepository userVoucherRepository,
                           ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.voucherRepository = voucherRepository;
        this.userVoucherRepository = userVoucherRepository;
        this.productRepository = productRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }

    private ShoppingCart getCart(User user) {
        return cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng trống"));
    }

    // 1️⃣8️⃣ - 2️⃣2️⃣ Tạo đơn hàng từ giỏ + voucher + thanh toán
    public CheckoutResponse checkout(CheckoutRequest req) {
        User user = getCurrentUser();
        ShoppingCart cart = getCart(user);
        List<CartItem> items = cartItemRepository.findByCartAndIsWishlist(cart, false);

        // Lọc các sản phẩm được chọn nếu có truyền vào itemIds
        if (req.getItemIds() != null && !req.getItemIds().isEmpty()) {
            items = items.stream()
                    .filter(ci -> req.getItemIds().contains(ci.getProduct().getId()))
                    .collect(Collectors.toList());
        }

        if (items.isEmpty()) {
            throw new RuntimeException("Giỏ hàng không có sản phẩm được chọn để thanh toán");
        }

        // 2️⃣1️⃣ Tính lại tổng tiền với voucher cho các sản phẩm ĐÃ CHỌN
        ApplyVoucherResponse voucherResult = cartService.applyVoucherForItems(req.getVoucherCode(), items);
        double originalTotal = voucherResult.getOriginalTotal();
        double finalTotal = voucherResult.getFinalTotal();

        // Tính phí vận chuyển
        double shippingFee = 0.0;
        String shippingMethod = req.getShippingMethod();
        if (shippingMethod != null && !shippingMethod.isEmpty()) {
            try {
                ShippingMethod method = ShippingMethod.valueOf(shippingMethod);
                shippingFee = method.getFee();
            } catch (IllegalArgumentException e) {
                // Nếu không tìm thấy, mặc định là STANDARD
                shippingFee = ShippingMethod.STANDARD.getFee();
                shippingMethod = "STANDARD";
            }
        } else {
            // Mặc định là STANDARD nếu không có
            shippingFee = ShippingMethod.STANDARD.getFee();
            shippingMethod = "STANDARD";
        }

        // Tổng tiền cuối cùng = tổng tiền sau voucher + phí vận chuyển
        double totalAmount = finalTotal + shippingFee;

        // 1️⃣8️⃣ + 1️⃣9️⃣ + 2️⃣0️⃣: Tạo Order
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .status("PENDING")
                .totalAmount(totalAmount)
                .voucherCode(voucherResult.getCode())
                .voucherDiscount(voucherResult.getDiscount())
                .paymentMethod(req.getPaymentMethod())
                .paymentStatus("PENDING") // COD: sẽ thanh toán khi nhận hàng; online: update sau khi callback
                .shippingAddress(req.getFullName() + " - " + req.getPhone() + "\n" + req.getAddress())
                .shippingFee(shippingFee)
                .build();

        // 2️⃣2️⃣ Lưu OrderItem + Giảm stock
        List<OrderItem> orderItems = items.stream()
                .map(ci -> {
                    // Kiểm tra và giảm stock
                    var product = ci.getProduct();
                    if (product.getStockQuantity() < ci.getQuantity()) {
                        throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ số lượng. Còn lại: " + product.getStockQuantity());
                    }
                    product.setStockQuantity(product.getStockQuantity() - ci.getQuantity());
                    productRepository.save(product);

                    return OrderItem.builder()
                            .order(order)
                            .product(product)
                            .quantity(ci.getQuantity())
                            .price(product.getPrice())
                            .imageUrl(product.getImageUrl())
                            .build();
                })
                .collect(Collectors.toList());

        order.setItems(orderItems);

        // Lưu đơn hàng
        Order savedOrder = orderRepository.save(order);

        // Lưu quan hệ voucher-user (chưa đánh dấu dùng, sẽ đánh dấu khi thanh toán thành công)
        if (voucherResult.getVoucherId() != null && voucherResult.getDiscount() != null
                && voucherResult.getDiscount() > 0) {
            Voucher voucher = voucherRepository.findById(voucherResult.getVoucherId())
                    .orElseThrow(() -> new RuntimeException("Voucher not found"));

            userVoucherRepository.findByUserAndVoucher(user, voucher)
                    .orElseGet(() -> userVoucherRepository.save(
                            UserVoucher.builder()
                                    .user(user)
                                    .voucher(voucher)
                                    .isUsed(false)
                                    .build()
                    ));
        }

        // Sau khi tạo đơn thành công: CHỈ XÓA CÁC SẢN PHẨM ĐÃ CHỌN TRONG GIỎ
        cartItemRepository.deleteAll(items);

        return CheckoutResponse.builder()
                .orderId(savedOrder.getId())
                .orderNumber(savedOrder.getOrderNumber())
                .originalTotal(originalTotal)
                .discount(voucherResult.getDiscount())
                .finalTotal(totalAmount) // Tổng cuối cùng đã bao gồm phí vận chuyển
                .paymentMethod(savedOrder.getPaymentMethod())
                .paymentStatus(savedOrder.getPaymentStatus())
                .status(savedOrder.getStatus())
                .build();
    }
}


