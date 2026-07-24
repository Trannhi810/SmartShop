package com.smartshop.service;

import com.smartshop.dto.order.OrderSummaryResponse;
import com.smartshop.repository.OrderRepository;
import com.smartshop.util.ExcelExportUtil;
import com.smartshop.util.PdfExportUtil;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderExportService {

    private final OrderRepository orderRepository;

    public OrderExportService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public ByteArrayOutputStream exportToExcel() throws IOException {
        List<OrderSummaryResponse> orders = orderRepository.findAll()
                .stream()
                .map(OrderSummaryResponse::fromEntity)
                .collect(Collectors.toList());

        String[] headers = {
            "ID", "Mã đơn hàng", "Khách hàng", "Email", "Tổng tiền (VNĐ)",
            "Trạng thái", "Trạng thái thanh toán", "Ngày đặt"
        };

        List<Map<String, Object>> data = new ArrayList<>();
        for (OrderSummaryResponse order : orders) {
            Map<String, Object> row = new HashMap<>();
            row.put("ID", order.getId());
            row.put("Mã đơn hàng", order.getOrderNumber() != null ? order.getOrderNumber() : "");
            row.put("Khách hàng", order.getCustomerName() != null ? order.getCustomerName() : "");
            row.put("Email", order.getCustomerEmail() != null ? order.getCustomerEmail() : "");
            row.put("Tổng tiền (VNĐ)", order.getTotalAmount() != null ? order.getTotalAmount() : 0);
            row.put("Trạng thái", order.getStatus() != null ? order.getStatus() : "");
            row.put("Trạng thái thanh toán", order.getPaymentStatus() != null ? order.getPaymentStatus() : "");
            row.put("Ngày đặt", order.getCreatedAt());
            data.add(row);
        }

        return ExcelExportUtil.createExcelFile("Đơn hàng", headers, data);
    }

    public ByteArrayOutputStream exportToPdf() throws IOException {
        try {
            List<OrderSummaryResponse> orders = orderRepository.findAll()
                    .stream()
                    .map(OrderSummaryResponse::fromEntity)
                    .collect(Collectors.toList());

            String[] headers = {
                "ID", "Mã đơn", "Khách hàng", "Tổng tiền", "Trạng thái", "Ngày đặt"
            };

            List<Map<String, Object>> data = new ArrayList<>();
            for (OrderSummaryResponse order : orders) {
                Map<String, Object> row = new HashMap<>();
                row.put("ID", order.getId());
                row.put("Mã đơn", order.getOrderNumber() != null ? order.getOrderNumber() : "");
                row.put("Khách hàng", order.getCustomerName() != null ? order.getCustomerName() : "");
                row.put("Tổng tiền", order.getTotalAmount() != null ? order.getTotalAmount() : 0);
                row.put("Trạng thái", order.getStatus() != null ? order.getStatus() : "");
                row.put("Ngày đặt", order.getCreatedAt());
                data.add(row);
            }

            return PdfExportUtil.createPdfFile("BÁO CÁO ĐƠN HÀNG", headers, data);
        } catch (com.itextpdf.text.DocumentException e) {
            throw new IOException("Error creating PDF: " + e.getMessage(), e);
        }
    }
}

