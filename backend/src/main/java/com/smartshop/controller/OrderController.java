package com.smartshop.controller;

import com.smartshop.dto.order.*;
import com.smartshop.service.OrderExportService;
import com.smartshop.service.OrderService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    private final OrderService orderService;
    private final OrderExportService orderExportService;

    public OrderController(OrderService orderService,
                           OrderExportService orderExportService) {
        this.orderService = orderService;
        this.orderExportService = orderExportService;
    }

    // 2️⃣7️⃣ Lịch sử mua hàng (user hiện tại)
    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<List<OrderSummaryResponse>> getMyOrders() {
        return ResponseEntity.ok(orderService.getMyOrders());
    }

    // 2️⃣8️⃣ + 2️⃣9️⃣ Chi tiết đơn hàng + theo dõi trạng thái
    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderDetail(orderId));
    }

    // Cập nhật trạng thái đơn hàng (Admin) – chờ → giao → hoàn tất → hủy
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDetailResponse> updateStatus(@PathVariable Long orderId,
                                                            @RequestBody UpdateOrderStatusRequest req) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, req));
    }

    // Hủy đơn hàng (User) - chỉ cho phép hủy đơn của chính mình
    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<OrderDetailResponse> cancelOrder(@PathVariable Long orderId,
                                                             @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId, reason));
    }

    // Xác nhận nhận hàng (User) - chỉ cho phép xác nhận đơn của chính mình
    @PostMapping("/{orderId}/confirm-received")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<OrderDetailResponse> confirmReceived(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.confirmReceived(orderId));
    }

    // ✅ Export to Excel (Admin only)
    @GetMapping("/export/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportToExcel() throws IOException {
        byte[] excelData = orderExportService.exportToExcel().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "orders.xlsx");
        headers.setContentLength(excelData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // ✅ Export to PDF (Admin only)
    @GetMapping("/export/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportToPdf() throws IOException {
        byte[] pdfData = orderExportService.exportToPdf().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "orders.pdf");
        headers.setContentLength(pdfData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfData);
    }
}


