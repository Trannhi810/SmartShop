package com.smartshop.service;

import com.smartshop.dto.admin.DashboardStatsResponse;
import com.smartshop.entity.order.Order;
import com.smartshop.entity.product.Product;
import com.smartshop.entity.user.User;
import com.smartshop.repository.OrderRepository;
import com.smartshop.repository.ProductRepository;
import com.smartshop.repository.UserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public DashboardService(UserRepository userRepository,
                           ProductRepository productRepository,
                           OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    // Thống kê tổng quan
    public DashboardStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();

        List<Order> allOrders = orderRepository.findAll();
        double totalRevenue = allOrders.stream()
                .filter(o -> "PAID".equals(o.getPaymentStatus()) || "COMPLETED".equals(o.getStatus()))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum();

        long pendingOrders = allOrders.stream()
                .filter(o -> "PENDING".equals(o.getStatus()))
                .count();

        long completedOrders = allOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()))
                .count();

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .pendingOrders(pendingOrders)
                .completedOrders(completedOrders)
                .build();
    }

    // Export Orders to Excel
    public byte[] exportOrdersToExcel(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> {
                    if (startDate != null && o.getCreatedAt().isBefore(startDate)) return false;
                    if (endDate != null && o.getCreatedAt().isAfter(endDate)) return false;
                    return true;
                })
                .toList();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Orders");
            Row headerRow = sheet.createRow(0);

            String[] headers = {"Mã đơn", "Khách hàng", "Tổng tiền", "Trạng thái", "Thanh toán", "Ngày tạo"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Order order : orders) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(order.getOrderNumber());
                row.createCell(1).setCellValue(order.getUser() != null ? order.getUser().getFullName() : "N/A");
                row.createCell(2).setCellValue(order.getTotalAmount() != null ? order.getTotalAmount() : 0.0);
                row.createCell(3).setCellValue(order.getStatus());
                row.createCell(4).setCellValue(order.getPaymentStatus());
                row.createCell(5).setCellValue(order.getCreatedAt().toString());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export orders to Excel", e);
        }
    }

    // Export Products to Excel
    public byte[] exportProductsToExcel() {
        List<Product> products = productRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Products");
            Row headerRow = sheet.createRow(0);

            String[] headers = {"ID", "Tên sản phẩm", "Giá", "Số lượng", "Danh mục", "Trạng thái"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Product product : products) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(product.getId());
                row.createCell(1).setCellValue(product.getName());
                row.createCell(2).setCellValue(product.getPrice() != null ? product.getPrice() : 0.0);
                row.createCell(3).setCellValue(product.getStockQuantity() != null ? product.getStockQuantity() : 0);
                row.createCell(4).setCellValue(product.getCategory() != null ? product.getCategory().getName() : "N/A");
                row.createCell(5).setCellValue(product.isActive() ? "Hoạt động" : "Vô hiệu");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export products to Excel", e);
        }
    }

    // Export Users to Excel
    public byte[] exportUsersToExcel() {
        List<User> users = userRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Users");
            Row headerRow = sheet.createRow(0);

            String[] headers = {"ID", "Username", "Email", "Họ tên", "SĐT", "Trạng thái", "Ngày tạo"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (User user : users) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(user.getId());
                row.createCell(1).setCellValue(user.getUsername());
                row.createCell(2).setCellValue(user.getEmail());
                row.createCell(3).setCellValue(user.getFullName() != null ? user.getFullName() : "");
                row.createCell(4).setCellValue(user.getPhone() != null ? user.getPhone() : "");
                row.createCell(5).setCellValue(user.isActive() ? "Hoạt động" : "Vô hiệu");
                row.createCell(6).setCellValue(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export users to Excel", e);
        }
    }
}

