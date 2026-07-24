package com.smartshop.dto.voucher;

import com.smartshop.entity.voucher.Voucher;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class VoucherResponse {
    private Long id;
    private String code;
    private String type;
    private Double value;
    private Double minOrder;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;

    public static VoucherResponse fromEntity(Voucher v) {
        return VoucherResponse.builder()
                .id(v.getId())
                .code(v.getCode())
                .type(v.getType())
                .value(v.getValue())
                .minOrder(v.getMinOrder())
                .categoryId(v.getCategory() != null ? v.getCategory().getId() : null)
                .categoryName(v.getCategory() != null ? v.getCategory().getName() : null)
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .isActive(v.getIsActive())
                .build();
    }
}


