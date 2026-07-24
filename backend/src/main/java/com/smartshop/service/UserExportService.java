package com.smartshop.service;

import com.smartshop.dto.admin.UserResponse;
import com.smartshop.repository.UserRepository;
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
public class UserExportService {

    private final UserRepository userRepository;

    public UserExportService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ByteArrayOutputStream exportToExcel() throws IOException {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());

        String[] headers = {
            "ID", "Tên người dùng", "Email", "Họ tên", "Số điện thoại",
            "Vai trò", "Trạng thái", "Ngày đăng ký"
        };

        List<Map<String, Object>> data = new ArrayList<>();
        for (UserResponse user : users) {
            Map<String, Object> row = new HashMap<>();
            row.put("ID", user.getId());
            row.put("Tên người dùng", user.getUsername() != null ? user.getUsername() : "");
            row.put("Email", user.getEmail() != null ? user.getEmail() : "");
            row.put("Họ tên", user.getFullName() != null ? user.getFullName() : "");
            row.put("Số điện thoại", user.getPhone() != null ? user.getPhone() : "");
            row.put("Vai trò", user.getRoles() != null && !user.getRoles().isEmpty() 
                    ? String.join(", ", user.getRoles()) : "Không có");
            row.put("Trạng thái", user.isActive() ? "Hoạt động" : "Đã khóa");
            row.put("Ngày đăng ký", user.getCreatedAt());
            data.add(row);
        }

        return ExcelExportUtil.createExcelFile("Người dùng", headers, data);
    }

    public ByteArrayOutputStream exportToPdf() throws IOException {
        try {
            List<UserResponse> users = userRepository.findAll()
                    .stream()
                    .map(UserResponse::fromEntity)
                    .collect(Collectors.toList());

            String[] headers = {
                "ID", "Tên đăng nhập", "Email", "Họ tên", "Vai trò", "Trạng thái", "Ngày ĐK"
            };

            List<Map<String, Object>> data = new ArrayList<>();
            for (UserResponse user : users) {
                Map<String, Object> row = new HashMap<>();
                row.put("ID", user.getId());
                row.put("Tên đăng nhập", user.getUsername() != null ? user.getUsername() : "");
                row.put("Email", user.getEmail() != null ? user.getEmail() : "");
                row.put("Họ tên", user.getFullName() != null ? user.getFullName() : "");
                row.put("Vai trò", user.getRoles() != null && !user.getRoles().isEmpty() 
                        ? String.join(", ", user.getRoles()).replace("ROLE_", "") : "-");
                row.put("Trạng thái", user.isActive() ? "Hoạt động" : "Đã khóa");
                row.put("Ngày ĐK", user.getCreatedAt());
                data.add(row);
            }

            return PdfExportUtil.createPdfFile("BÁO CÁO NGƯỜI DÙNG", headers, data);
        } catch (com.itextpdf.text.DocumentException e) {
            throw new IOException("Error creating PDF: " + e.getMessage(), e);
        }
    }
}

