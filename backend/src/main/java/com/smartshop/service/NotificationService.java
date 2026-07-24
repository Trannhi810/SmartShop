package com.smartshop.service;

import com.smartshop.dto.notification.NotificationResponse;
import com.smartshop.entity.notification.Notification;
import com.smartshop.entity.user.User;
import com.smartshop.repository.NotificationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            return null;
        }
        return (User) auth.getPrincipal();
    }

    // Lấy tất cả thông báo của user hiện tại
    public List<NotificationResponse> getMyNotifications() {
        User user = getCurrentUser();
        if (user == null) {
            return List.of();
        }
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Lấy số lượng thông báo chưa đọc
    public Long getUnreadCount() {
        User user = getCurrentUser();
        if (user == null) {
            return 0L;
        }
        Long count = notificationRepository.countUnreadByUser(user);
        return count != null ? count : 0L;
    }

    // Đánh dấu tất cả thông báo là đã đọc
    public void markAllAsRead() {
        User user = getCurrentUser();
        if (user != null) {
            notificationRepository.markAllAsRead(user);
        }
    }

    // Đánh dấu một thông báo là đã đọc
    public void markAsRead(Long notificationId) {
        User user = getCurrentUser();
        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (notification.getUser() == null || !notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền đánh dấu thông báo này");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    // Tạo thông báo (dùng bởi các service khác)
    public Notification createNotification(User user, String title, String message, String type, Long referenceId) {
        if (user == null) {
            throw new RuntimeException("User cannot be null");
        }
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }
}

