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

            roleRepository.findByName("ROLE_STAFF").orElseGet(() -> {
                Role role = new Role();
                role.setName("ROLE_STAFF");
                return roleRepository.save(role);
            });

            Role customerRole = roleRepository.findByName("ROLE_CUSTOMER").orElseGet(() -> {
                Role role = new Role();
                role.setName("ROLE_CUSTOMER");
                return roleRepository.save(role);
            });

            // Seed admin account
            User admin = userRepository.findByUsername("admin").orElseGet(() -> userRepository.findByEmail("admin123@gmail.com").orElse(null));
            if (admin != null) {
                admin.setPassword("Password@123");
                admin.setActive(true);

                // ✅ Đảm bảo admin luôn có ROLE_ADMIN (fix khi số thứ tự role bị thay đổi)
                boolean hasAdminRole = admin.getRoles() != null &&
                        admin.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
                if (!hasAdminRole) {
                    admin.setRoles(Collections.singletonList(adminRole));
                    System.out.println("⚠️  Admin thiếu ROLE_ADMIN – đã tự động gán lại!");
                }

                userRepository.save(admin);
                System.out.println("Đã cập nhật tài khoản admin.");
            } else {
                admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin123@gmail.com");
                admin.setPassword("Password@123");
                admin.setFullName("admin Quản trị");
                admin.setActive(true);
                admin.setRoles(Collections.singletonList(adminRole));
                userRepository.save(admin);
                System.out.println("Đã tạo tài khoản admin mặc định: admin123@gmail.com / Password@123");
            }

            // Seed staff account
            Role staffRole = roleRepository.findByName("ROLE_STAFF").orElse(null);
            if (staffRole != null) {
                boolean staffExists = userRepository.findByUsername("staff").isPresent()
                        || userRepository.findByEmail("staff@smartshop.com").isPresent();
                if (!staffExists) {
                    User staff = new User();
                    staff.setUsername("staff");
                    staff.setEmail("staff@smartshop.com");
                    staff.setPassword("Password@123");
                    staff.setFullName("Nhân Viên SmartShop");
                    staff.setPhone("0911111111");
                    staff.setActive(true);
                    staff.setRoles(Collections.singletonList(staffRole));
                    userRepository.save(staff);
                    System.out.println("Đã tạo tài khoản staff mặc định: staff@smartshop.com / Password@123");
                } else {
                    User staff = userRepository.findByUsername("staff").orElseGet(() -> userRepository.findByEmail("staff@smartshop.com").orElse(null));
                    if (staff != null) {
                        boolean hasStaffRole = staff.getRoles() != null &&
                                staff.getRoles().stream().anyMatch(r -> "ROLE_STAFF".equals(r.getName()));
                        if (!hasStaffRole) {
                            staff.setRoles(Collections.singletonList(staffRole));
                            userRepository.save(staff);
                            System.out.println("⚠️  Staff thiếu ROLE_STAFF – đã tự động gán lại!");
                        }
                    }
                }
            }
        };
    }
}
