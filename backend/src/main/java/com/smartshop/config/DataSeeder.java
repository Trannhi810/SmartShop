package com.smartshop.config;

import com.smartshop.entity.user.Role;
import com.smartshop.entity.user.User;
import com.smartshop.repository.RoleRepository;
import com.smartshop.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedDatabase(UserRepository userRepository, RoleRepository roleRepository) {
        return args -> {
            // Seed roles if they don't exist
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> {
                Role role = new Role();
                role.setName("ROLE_ADMIN");
                return roleRepository.save(role);
            });

            Role userRole = roleRepository.findByName("ROLE_USER").orElseGet(() -> {
                Role role = new Role();
                role.setName("ROLE_USER");
                return roleRepository.save(role);
            });

            User admin = userRepository.findByUsername("admin").orElseGet(() -> userRepository.findByEmail("admin123@gmail.com").orElse(null));
            if (admin != null) {
                admin.setPassword("Password@123");
                admin.setActive(true);
                userRepository.save(admin);
                System.out.println("Đã cập nhật mật khẩu admin thành Password@123");
            } else {
                admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin123@gmail.com");
                admin.setPassword("Password@123"); // Trùng với database.sql, NoOpPasswordEncoder sẽ ko mã hoá
                admin.setFullName("admin Quản trị");
                admin.setActive(true);
                admin.setRoles(Collections.singletonList(adminRole));
                userRepository.save(admin);
                System.out.println("Đã tạo tài khoản admin mặc định: admin123@gmail.com / Password@123");
            }
        };
    }
}
