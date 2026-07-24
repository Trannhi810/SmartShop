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

            // Seed admin user if it doesn't exist
            if (!userRepository.findByUsername("admin").isPresent() && !userRepository.findByEmail("admin123@gmail.com").isPresent()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin123@gmail.com");
                admin.setPassword("admin123@gmail.com"); // Trùng với email để test, NoOpPasswordEncoder sẽ ko mã hoá
                admin.setFullName("admin Quản trị");
                admin.setActive(true);
                admin.setRoles(Collections.singletonList(adminRole));
                userRepository.save(admin);
                System.out.println("Đã tạo tài khoản admin mặc định: admin123@gmail.com / admin123@gmail.com");
            }
        };
    }
}
