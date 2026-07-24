package com.smartshop.service;

import com.smartshop.dto.order.*;
import com.smartshop.entity.order.Order;
import com.smartshop.entity.order.OrderStatusHistory;
import com.smartshop.entity.user.User;
import com.smartshop.repository.OrderRepository;
import com.smartshop.repository.OrderStatusHistoryRepository;
import com.smartshop.repository.PaymentTransactionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final NotificationService notificationService;

    public OrderService(OrderRepository orderRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        PaymentTransactionRepository paymentTransactionRepository,
                        NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.notificationService = notificationService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }

    // 2️⃣7️⃣ Lịch sử mua hàng (của user hiện tại)
    public List<OrderSummaryResponse> getMyOrders() {
        User user = getCurrentUser();
        return orderRepository.findByUser(user).stream()
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .map(OrderSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 2️⃣8️⃣ + 2️⃣9️⃣ Chi tiết đơn hàng + lịch sử trạng thái
    public OrderDetailResponse getOrderDetail(Long orderId) {
        User user = getCurrentUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Chỉ cho phép xem đơn của mình hoặc ADMIN
        if (order.getUser() != null && !order.getUser().getId().equals(user.getId())
                && user.getRoles().stream().noneMatch(r -> "ROLE_ADMIN".equals(r.getName()))) {
            throw new RuntimeException("Bạn không có quyền xem đơn hàng này");
        }

        List<OrderStatusHistory> historyEntities = statusHistoryRepository.findByOrderOrderByCreatedAtAsc(order);
        List<OrderStatusHistoryResponse> history = historyEntities.stream()
                .map(OrderStatusHistoryResponse::fromEntity)
                .collect(Collectors.toList());

        // Lấy PaymentTransaction để tính số tiền đã thanh toán
        Double paidAmount = paymentTransactionRepository.findByOrder(order)
                .filter(tx -> "SUCCESS".equals(tx.getStatus()))
                .map(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .orElse(0.0);

        return OrderDetailResponse.fromEntity(order, history, paidAmount);
    }

    // Cập nhật trạng thái (Admin) + ghi lịch sử
    public OrderDetailResponse updateStatus(Long orderId, UpdateOrderStatusRequest req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String oldStatus = order.getStatus();
        String newStatus = req.getNewStatus();

        if (newStatus == null || newStatus.isBlank()) {
            throw new RuntimeException("Trạng thái mới không hợp lệ");
        }

        order.setStatus(newStatus);
        orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .build();
        statusHistoryRepository.save(history);

        // Tạo thông báo cho user khi trạng thái đơn hàng thay đổi
        if (order.getUser() != null) {
            String statusText = getStatusText(newStatus);
            String title = "Đơn hàng #" + order.getOrderNumber() + " đã được cập nhật";
            String message = "Đơn hàng của bạn đã chuyển sang trạng thái: " + statusText;
            notificationService.createNotification(
                    order.getUser(),
                    title,
                    message,
                    "ORDER",
                    order.getId()
            );
        }

        List<OrderStatusHistoryResponse> historyResponses =
                statusHistoryRepository.findByOrderOrderByCreatedAtAsc(order).stream()
                        .map(OrderStatusHistoryResponse::fromEntity)
                        .collect(Collectors.toList());

        // Lấy PaymentTransaction để tính số tiền đã thanh toán
        Double paidAmount = paymentTransactionRepository.findByOrder(order)
                .filter(tx -> "SUCCESS".equals(tx.getStatus()))
                .map(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .orElse(0.0);

        return OrderDetailResponse.fromEntity(order, historyResponses, paidAmount);
    }

    private String getStatusText(String status) {
        return switch (status) {
            case "PENDING" -> "Chờ xác nhận";
            case "CONFIRMED" -> "Đã xác nhận";
            case "PROCESSING" -> "Đang xử lý";
            case "SHIPPED" -> "Đang giao hàng";
            case "DELIVERED" -> "Đã giao hàng";
            case "COMPLETED" -> "Hoàn thành";
            case "CANCELLED" -> "Đã hủy";
            case "REFUNDED" -> "Đã hoàn tiền";
            default -> status;
        };
    }

    // Hủy đơn hàng (User) - chỉ cho phép hủy đơn của chính mình
    public OrderDetailResponse cancelOrder(Long orderId, String reason) {
        User user = getCurrentUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Kiểm tra quyền: chỉ cho phép hủy đơn của chính mình hoặc ADMIN
        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            boolean isAdmin = user.getRoles().stream()
                    .anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
            if (!isAdmin) {
                throw new RuntimeException("Bạn không có quyền hủy đơn hàng này");
            }
        }

        // Kiểm tra trạng thái: chỉ cho phép hủy khi đơn ở trạng thái PENDING
        String currentStatus = order.getStatus();
        if (!"PENDING".equals(currentStatus)) {
            throw new RuntimeException("Chỉ có thể hủy đơn hàng khi đơn ở trạng thái 'Chờ xác nhận'");
        }

        // Cập nhật trạng thái thành CANCELLED
        String oldStatus = order.getStatus();
        order.setStatus("CANCELLED");
        orderRepository.save(order);

        // Ghi lịch sử
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus("CANCELLED")
                .build();
        statusHistoryRepository.save(history);

        // Tạo thông báo cho user
        if (order.getUser() != null) {
            String title = "Đơn hàng #" + order.getOrderNumber() + " đã được hủy";
            String message = "Đơn hàng của bạn đã được hủy thành công.";
            notificationService.createNotification(
                    order.getUser(),
                    title,
                    message,
                    "ORDER",
                    order.getId()
            );
        }

        // Lấy lại lịch sử đầy đủ
        List<OrderStatusHistoryResponse> historyResponses =
                statusHistoryRepository.findByOrderOrderByCreatedAtAsc(order).stream()
                        .map(OrderStatusHistoryResponse::fromEntity)
                        .collect(Collectors.toList());

        // Lấy PaymentTransaction để tính số tiền đã thanh toán
        Double paidAmount = paymentTransactionRepository.findByOrder(order)
                .filter(tx -> "SUCCESS".equals(tx.getStatus()))
                .map(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .orElse(0.0);

        return OrderDetailResponse.fromEntity(order, historyResponses, paidAmount);
    }

    // Xác nhận nhận hàng (User) - chỉ cho phép xác nhận đơn của chính mình
    public OrderDetailResponse confirmReceived(Long orderId) {
        User user = getCurrentUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Kiểm tra quyền: chỉ cho phép xác nhận đơn của chính mình hoặc ADMIN
        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            boolean isAdmin = user.getRoles().stream()
                    .anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
            if (!isAdmin) {
                throw new RuntimeException("Bạn không có quyền xác nhận đơn hàng này");
            }
        }

        // Kiểm tra trạng thái: chỉ cho phép xác nhận khi đơn ở trạng thái DELIVERED
        String currentStatus = order.getStatus();
        if (!"DELIVERED".equals(currentStatus)) {
            throw new RuntimeException("Chỉ có thể xác nhận nhận hàng khi đơn ở trạng thái 'Đã giao hàng'");
        }

        // Cập nhật trạng thái thành COMPLETED
        String oldStatus = order.getStatus();
        order.setStatus("COMPLETED");
        orderRepository.save(order);

        // Ghi lịch sử
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus("COMPLETED")
                .build();
        statusHistoryRepository.save(history);

        // Tạo thông báo cho user
        if (order.getUser() != null) {
            String title = "Đơn hàng #" + order.getOrderNumber() + " đã hoàn thành";
            String message = "Cảm ơn bạn đã mua sắm tại SmartShop! Đơn hàng của bạn đã được hoàn thành.";
            notificationService.createNotification(
                    order.getUser(),
                    title,
                    message,
                    "ORDER",
                    order.getId()
            );
        }

        // Lấy lại lịch sử đầy đủ
        List<OrderStatusHistoryResponse> historyResponses =
                statusHistoryRepository.findByOrderOrderByCreatedAtAsc(order).stream()
                        .map(OrderStatusHistoryResponse::fromEntity)
                        .collect(Collectors.toList());

        // Lấy PaymentTransaction để tính số tiền đã thanh toán
        Double paidAmount = paymentTransactionRepository.findByOrder(order)
                .filter(tx -> "SUCCESS".equals(tx.getStatus()))
                .map(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .orElse(0.0);

        return OrderDetailResponse.fromEntity(order, historyResponses, paidAmount);
    }
}


