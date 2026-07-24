package com.smartshop.controller;

import com.smartshop.dto.voucher.UserVoucherResponse;
import com.smartshop.dto.voucher.VoucherRequest;
import com.smartshop.dto.voucher.VoucherResponse;
import com.smartshop.service.VoucherService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    // ✅ Xem danh sách tất cả voucher (Admin)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VoucherResponse>> getAll() {
        return ResponseEntity.ok(voucherService.getAll());
    }

    // ✅ Chi tiết 1 voucher (Admin)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VoucherResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(voucherService.getById(id));
    }

    // ✅ Thêm mã giảm giá
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VoucherResponse> create(@RequestBody VoucherRequest req) {
        return ResponseEntity.ok(voucherService.create(req));
    }

    // ✅ Sửa thông tin voucher
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VoucherResponse> update(@PathVariable Long id,
                                                  @RequestBody VoucherRequest req) {
        return ResponseEntity.ok(voucherService.update(id, req));
    }

    // ✅ Xóa voucher (xóa cứng)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        voucherService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Vô hiệu hóa voucher (soft)
    @PostMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VoucherResponse> disable(@PathVariable Long id) {
        return ResponseEntity.ok(voucherService.disable(id));
    }

    // ✅ Lấy danh sách voucher còn hạn sử dụng (public)
    @GetMapping("/available")
    public ResponseEntity<List<VoucherResponse>> getAvailableVouchers() {
        return ResponseEntity.ok(voucherService.getAvailableVouchers());
    }

    // ✅ Lấy danh sách voucher của user hiện tại
    @GetMapping("/my-vouchers")
    public ResponseEntity<List<UserVoucherResponse>> getMyVouchers() {
        return ResponseEntity.ok(voucherService.getMyVouchers());
    }

    // ✅ Claim voucher (thêm voucher cho user bằng mã code)
    @PostMapping("/claim")
    public ResponseEntity<UserVoucherResponse> claimVoucher(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("Mã voucher không được để trống");
        }
        return ResponseEntity.ok(voucherService.claimVoucher(code.trim()));
    }
}


