package com.smartshop.controller;

import com.smartshop.dto.admin.DashboardStatsResponse;
import com.smartshop.dto.common.ApiResponse;
import com.smartshop.service.DashboardService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // Thống kê tổng quan
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats()));
    }

    // Export Orders to Excel
    @GetMapping("/export/orders")
    public ResponseEntity<byte[]> exportOrders(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;

        byte[] excelData = dashboardService.exportOrdersToExcel(start, end);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "orders.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // Export Products to Excel
    @GetMapping("/export/products")
    public ResponseEntity<byte[]> exportProducts() {
        byte[] excelData = dashboardService.exportProductsToExcel();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "products.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // Export Users to Excel
    @GetMapping("/export/users")
    public ResponseEntity<byte[]> exportUsers() {
        byte[] excelData = dashboardService.exportUsersToExcel();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "users.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }
}

