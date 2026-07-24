package com.smartshop.controller;

import com.smartshop.dto.admin.UserResponse;
import com.smartshop.dto.common.ApiResponse;
import com.smartshop.dto.order.OrderSummaryResponse;
import com.smartshop.dto.review.ReviewResponse;
import com.smartshop.service.AdminService;
import com.smartshop.service.UserExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserExportService userExportService;

    public AdminController(AdminService adminService,
                          UserExportService userExportService) {
        this.adminService = adminService;
        this.userExportService = userExportService;
    }

    // Quản lý Users
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam boolean isActive) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUserStatus(userId, isActive)));
    }

    @PutMapping("/users/{userId}/roles")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRoles(
            @PathVariable Long userId,
            @RequestBody UpdateUserRolesRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUserRoles(userId, request.getRoles())));
    }

    // Inner class for request body
    public static class UpdateUserRolesRequest {
        private List<String> roles;

        public List<String> getRoles() {
            return roles;
        }

        public void setRoles(List<String> roles) {
            this.roles = roles;
        }
    }

    // Quản lý Orders
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> getAllOrders() {
        List<OrderSummaryResponse> orders = adminService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    // Quản lý Reviews
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getAllReviews() {
        List<ReviewResponse> reviews = adminService.getAllReviews().stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long reviewId) {
        adminService.deleteReview(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Xóa review thành công", null));
    }

    // ✅ Export Users to Excel
    @GetMapping("/users/export/excel")
    public ResponseEntity<byte[]> exportUsersToExcel() throws IOException {
        byte[] excelData = userExportService.exportToExcel().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "users.xlsx");
        headers.setContentLength(excelData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // ✅ Export Users to PDF
    @GetMapping("/users/export/pdf")
    public ResponseEntity<byte[]> exportUsersToPdf() throws IOException {
        byte[] pdfData = userExportService.exportToPdf().toByteArray();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "users.pdf");
        headers.setContentLength(pdfData.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfData);
    }
}

