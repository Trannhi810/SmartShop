package com.smartshop.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility class để generate BCrypt password hash
 * Sử dụng để tạo password hash cho các user trong database
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        // BCrypt với 10 rounds (mặc định, khớp với SecurityConfig)
        // Để tăng bảo mật, có thể dùng: new BCryptPasswordEncoder(12)
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Password mặc định cho tất cả user: 123456
        String plainPassword = "123456";
        String hashedPassword = encoder.encode(plainPassword);
        
        System.out.println("==========================================");
        System.out.println("BCrypt Rounds: 10 (mặc định)");
        System.out.println("Password: " + plainPassword);
        System.out.println("BCrypt Hash: " + hashedPassword);
        System.out.println("==========================================");
        
        // Verify hash
        boolean matches = encoder.matches(plainPassword, hashedPassword);
        System.out.println("Verify hash: " + (matches ? "✅ MATCH" : "❌ NOT MATCH"));
        System.out.println("==========================================");
        
        // SQL UPDATE statement
        System.out.println("\nSQL để update password cho TẤT CẢ users:");
        System.out.println("UPDATE users SET password = '" + hashedPassword + "';");
        
        // Nếu muốn generate với 12 rounds:
        System.out.println("\n--- Nếu muốn dùng 12 rounds (bảo mật cao hơn) ---");
        BCryptPasswordEncoder encoder12 = new BCryptPasswordEncoder(12);
        String hashedPassword12 = encoder12.encode(plainPassword);
        System.out.println("BCrypt Hash (12 rounds): " + hashedPassword12);
        System.out.println("Lưu ý: Cần update SecurityConfig để dùng BCryptPasswordEncoder(12)");
    }
}
