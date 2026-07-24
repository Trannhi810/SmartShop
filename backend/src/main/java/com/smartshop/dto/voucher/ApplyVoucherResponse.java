package com.smartshop.dto.voucher;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplyVoucherResponse {
    private Long voucherId;
    private String code;
    private Double originalTotal;
    private Double discount;
    private Double finalTotal;
}


