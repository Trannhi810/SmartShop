package com.smartshop.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartshop.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    
    @JsonProperty("isActive")
    private boolean isActive;
    
    private List<String> roles;
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .isActive(user.isActive())
                .roles(user.getRoles().stream()
                        .map(r -> r.getName())
                        .collect(Collectors.toList()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}

