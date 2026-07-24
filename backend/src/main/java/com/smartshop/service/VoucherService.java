package com.smartshop.service;

import com.smartshop.dto.voucher.UserVoucherResponse;
import com.smartshop.dto.voucher.VoucherRequest;
import com.smartshop.dto.voucher.VoucherResponse;
import com.smartshop.entity.product.Category;
import com.smartshop.entity.user.User;
import com.smartshop.entity.voucher.UserVoucher;
import com.smartshop.entity.voucher.Voucher;
import com.smartshop.repository.CategoryRepository;
import com.smartshop.repository.UserVoucherRepository;
import com.smartshop.repository.VoucherRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final CategoryRepository categoryRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final NotificationService notificationService;

    public VoucherService(VoucherRepository voucherRepository,
                          CategoryRepository categoryRepository,
                          UserVoucherRepository userVoucherRepository,
                          NotificationService notificationService) {
        this.voucherRepository = voucherRepository;
        this.categoryRepository = categoryRepository;
        this.userVoucherRepository = userVoucherRepository;
        this.notificationService = notificationService;
    }

    // Lấy user hiện tại từ SecurityContext
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }

    // ✅ Xem danh sách tất cả voucher
    public List<VoucherResponse> getAll() {
        return voucherRepository.findAll()
                .stream()
                .map(VoucherResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public VoucherResponse getById(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        return VoucherResponse.fromEntity(voucher);
    }

    // ✅ Thêm mã giảm giá (Voucher Code)
    public VoucherResponse create(VoucherRequest req) {
        if (voucherRepository.existsByCode(req.getCode())) {
            throw new RuntimeException("Voucher code already exists");
        }

        Category category = null;
        if (req.getCategoryId() != null) {
            category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Voucher voucher = Voucher.builder()
                .code(req.getCode())
                .type(req.getType())
                .value(req.getValue())
                .minOrder(req.getMinOrder())
                .category(category)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        return VoucherResponse.fromEntity(voucherRepository.save(voucher));
    }

    // ✅ Sửa thông tin voucher
    public VoucherResponse update(Long id, VoucherRequest req) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        if (req.getCode() != null && !req.getCode().equals(voucher.getCode())) {
            if (voucherRepository.existsByCode(req.getCode())) {
                throw new RuntimeException("Voucher code already exists");
            }
            voucher.setCode(req.getCode());
        }

        if (req.getType() != null) voucher.setType(req.getType());
        if (req.getValue() != null) voucher.setValue(req.getValue());
        if (req.getMinOrder() != null) voucher.setMinOrder(req.getMinOrder());

        if (req.getCategoryId() != null) {
            Category category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            voucher.setCategory(category);
        } else {
            voucher.setCategory(null);
        }

        if (req.getStartDate() != null) voucher.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) voucher.setEndDate(req.getEndDate());
        if (req.getIsActive() != null) voucher.setIsActive(req.getIsActive());

        return VoucherResponse.fromEntity(voucherRepository.save(voucher));
    }

    // ✅ Xóa hoặc vô hiệu hóa voucher

    // Xóa cứng
    public void delete(Long id) {
        voucherRepository.deleteById(id);
    }

    // Vô hiệu hóa (soft disable)
    public VoucherResponse disable(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        voucher.setIsActive(false);
        return VoucherResponse.fromEntity(voucherRepository.save(voucher));
    }

    // ✅ Lấy danh sách voucher còn hạn sử dụng (public)
    public List<VoucherResponse> getAvailableVouchers() {
        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .filter(v -> v.getStartDate() == null || !now.isBefore(v.getStartDate()))
                .filter(v -> v.getEndDate() == null || !now.isAfter(v.getEndDate()))
                .map(VoucherResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ✅ Lấy danh sách voucher của user hiện tại
    public List<UserVoucherResponse> getMyVouchers() {
        User user = getCurrentUser();
        List<UserVoucher> userVouchers = userVoucherRepository.findByUser(user);
        return userVouchers.stream()
                .map(UserVoucherResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ✅ Claim voucher (thêm voucher cho user bằng mã code)
    public UserVoucherResponse claimVoucher(String code) {
        User user = getCurrentUser();
        
        // Tìm voucher theo code
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Mã voucher không tồn tại"));
        
        // Kiểm tra voucher có active không
        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            throw new RuntimeException("Mã voucher đã bị vô hiệu hóa");
        }
        
        // Kiểm tra thời gian hiệu lực
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException("Mã voucher chưa có hiệu lực");
        }
        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Mã voucher đã hết hạn");
        }
        
        // Kiểm tra user đã có voucher này chưa
        if (userVoucherRepository.findByUserAndVoucher(user, voucher).isPresent()) {
            throw new RuntimeException("Bạn đã sở hữu mã voucher này rồi");
        }
        
        // Tạo UserVoucher mới
        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .isUsed(false)
                .build();
        
        UserVoucher savedUserVoucher = userVoucherRepository.save(userVoucher);

        // Tạo thông báo cho user khi nhận voucher mới
        String title = "Bạn đã nhận được voucher mới!";
        String message = "Bạn đã nhận được voucher " + voucher.getCode() + ". Hãy sử dụng ngay để nhận ưu đãi!";
        notificationService.createNotification(
                user,
                title,
                message,
                "PROMOTION",
                voucher.getId()
        );
        
        return UserVoucherResponse.fromEntity(savedUserVoucher);
    }
}


