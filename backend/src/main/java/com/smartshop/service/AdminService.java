package com.smartshop.service;

import com.smartshop.dto.admin.UserResponse;
import com.smartshop.entity.review.Review;
import com.smartshop.entity.user.Role;
import com.smartshop.entity.user.User;
import com.smartshop.repository.OrderRepository;
import com.smartshop.repository.ReviewRepository;
import com.smartshop.repository.RoleRepository;
import com.smartshop.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final RoleRepository roleRepository;

    public AdminService(UserRepository userRepository,
                       OrderRepository orderRepository,
                       ReviewRepository reviewRepository,
                       RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.roleRepository = roleRepository;
    }

    // Quản lý Users
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public UserResponse updateUserStatus(Long userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(isActive);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    public UserResponse updateUserRoles(Long userId, List<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Role> roles = new ArrayList<>();
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            roles.add(role);
        }
        
        user.setRoles(roles);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    // Quản lý Orders (xem tất cả)
    // Thực hiện mapping sang DTO bên trong service để tránh LazyInitializationException
    public List<com.smartshop.dto.order.OrderSummaryResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(com.smartshop.dto.order.OrderSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Quản lý Reviews
    public void deleteReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }
}

