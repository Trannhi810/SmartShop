package com.smartshop.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalUsers;
    private Long totalProducts;
    private Long totalOrders;
    private Double totalRevenue;
    private Long pendingOrders;
    private Long completedOrders;
}

