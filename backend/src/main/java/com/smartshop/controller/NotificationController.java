package com.smartshop.controller;

import com.smartshop.dto.common.ApiResponse;
import com.smartshop.dto.notification.NotificationResponse;
import com.smartshop.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Lấy tất cả thông báo của user hiện tại
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications() {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getMyNotifications()));
    }

    // Lấy số lượng thông báo chưa đọc
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        Long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    // Đánh dấu tất cả thông báo là đã đọc
    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", null));
    }

    // Đánh dấu một thông báo là đã đọc
    @PutMapping("/{id}/mark-read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc", null));
    }
}

