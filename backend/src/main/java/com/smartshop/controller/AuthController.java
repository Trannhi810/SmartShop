package com.smartshop.controller;

import com.smartshop.dto.auth.*;
import com.smartshop.entity.user.User;
import com.smartshop.repository.UserRepository;
import com.smartshop.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:3000"}, maxAge = 3600, allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Value("${app.security.jwt.cookie-name:SMARTSHOP_TOKEN}")
    private String cookieName;

    @Value("${app.security.jwt.expiration:3600000}")
    private Long jwtExpiration;

    @Value("${app.security.jwt.cookie-domain:localhost}")
    private String cookieDomain;

    @Value("${app.security.jwt.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${app.security.jwt.cookie-samesite:Strict}")
    private String cookieSameSite;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    // Helper method to set cookie
    private void setCookie(HttpServletResponse response, String token) {
        int maxAge = (int) (jwtExpiration / 1000); // Convert milliseconds to seconds
        String sameSiteValue = cookieSameSite != null ? cookieSameSite : "Strict";
        
        // Build Set-Cookie header with all attributes
        StringBuilder cookieHeader = new StringBuilder();
        cookieHeader.append(cookieName).append("=").append(token);
        cookieHeader.append("; Path=/");
        cookieHeader.append("; Max-Age=").append(maxAge);
        cookieHeader.append("; HttpOnly");
        cookieHeader.append("; SameSite=").append(sameSiteValue);
        
        if (cookieSecure) {
            cookieHeader.append("; Secure");
        }
        
        // Set domain if specified and not localhost
        if (cookieDomain != null && !cookieDomain.isEmpty() && !cookieDomain.equals("localhost")) {
            cookieHeader.append("; Domain=").append(cookieDomain);
        }
        
        response.setHeader("Set-Cookie", cookieHeader.toString());
    }

    // Helper method to delete cookie
    private void deleteCookie(HttpServletResponse response) {
        String sameSiteValue = cookieSameSite != null ? cookieSameSite : "Strict";
        
        // Build Set-Cookie header to delete cookie
        StringBuilder cookieHeader = new StringBuilder();
        cookieHeader.append(cookieName).append("=");
        cookieHeader.append("; Path=/");
        cookieHeader.append("; Max-Age=0");
        cookieHeader.append("; HttpOnly");
        cookieHeader.append("; SameSite=").append(sameSiteValue);
        
        if (cookieSecure) {
            cookieHeader.append("; Secure");
        }
        
        // Set domain if specified and not localhost
        if (cookieDomain != null && !cookieDomain.isEmpty() && !cookieDomain.equals("localhost")) {
            cookieHeader.append("; Domain=").append(cookieDomain);
        }
        
        response.setHeader("Set-Cookie", cookieHeader.toString());
    }

    // 5️⃣ Đăng nhập – trả JWT token và set cookie
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, 
                                             HttpServletResponse response) {
        try {
            AuthResponse authResponse = authService.login(loginRequest);
            // Set cookie
            setCookie(response, authResponse.getToken());
            return ResponseEntity.ok(authResponse);
        } catch (RuntimeException e) {
            // Trả về error message nếu tài khoản bị khóa hoặc lỗi khác
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(403).body(errorResponse);
        } catch (Exception e) {
            // Xử lý các exception khác (BadCredentialsException, etc.)
            Map<String, String> errorResponse = new java.util.HashMap<>();
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("khóa")) {
                errorResponse.put("message", errorMessage);
            } else {
                errorResponse.put("message", "Email hoặc mật khẩu không đúng");
            }
            return ResponseEntity.status(401).body(errorResponse);
        }
    }

    // 4️⃣ Đăng ký – BCrypt và set cookie
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest,
                                                 HttpServletResponse response) {
        AuthResponse authResponse = authService.register(registerRequest);
        // Set cookie
        setCookie(response, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    // 7️⃣ Login Google – nhận idToken từ frontend
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request,
                                                        HttpServletResponse response) {
        AuthResponse authResponse = authService.loginWithGoogle(request);
        // Set cookie
        setCookie(response, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    // 8️⃣ Get current user info
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).build();
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AuthResponse response = AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(java.util.stream.Collectors.toList()))
                .build();

        return ResponseEntity.ok(response);
    }
    
    // Update user profile
    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).build();
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        AuthResponse response = authService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }
    
    // Change password
    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            authService.changePassword(userDetails.getUsername(), request);
            
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Đổi mật khẩu thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // Upload avatar
    @PostMapping("/avatar")
    public ResponseEntity<AuthResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            AuthResponse response = authService.uploadAvatar(userDetails.getUsername(), file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 9️⃣ Logout – xóa cookie
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        deleteCookie(response);
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }

    // Get Google OAuth Client ID for frontend
    @GetMapping("/google-client-id")
    public ResponseEntity<Map<String, String>> getGoogleClientId() {
        Map<String, String> response = new java.util.HashMap<>();
        response.put("clientId", googleClientId);
        return ResponseEntity.ok(response);
    }

    // Forgot Password
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", "Có lỗi xảy ra. Vui lòng thử lại sau.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // Reset Password
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getEmail(), request.getNewPassword());
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", "Có lỗi xảy ra. Vui lòng thử lại sau.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

