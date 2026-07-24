// Checkout page functionality
let appliedVoucherCheckout = null; // Store applied voucher info
let selectedItemIdsCheckout = null;

document.addEventListener('DOMContentLoaded', async () => {
    const authenticated = await checkAuthStatus();
    if (!authenticated) {
        window.location.href = '/auth/login.html?redirect=/checkout.html';
        return;
    }
    
    // Get selected items from session storage
    const savedIds = sessionStorage.getItem('selectedItemIds');
    if (savedIds) {
        selectedItemIdsCheckout = new Set(JSON.parse(savedIds));
    }
    
    // Check if voucher was applied in cart
    const savedVoucherCode = sessionStorage.getItem('appliedVoucherCode');
    if (savedVoucherCode) {
        try {
            const voucherResult = await api.applyVoucher(savedVoucherCode);
            appliedVoucherCheckout = voucherResult;
            updateVoucherUI();
        } catch (error) {
            console.error('Error loading saved voucher:', error);
            sessionStorage.removeItem('appliedVoucherCode');
        }
    }
    
    await loadCartSummary();
    
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
    
    // Update summary when shipping method changes
    document.querySelectorAll('input[name="shippingMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            loadCartSummary();
        });
    });
});

async function loadCartSummary() {
    try {
        const cart = await api.getCart();
        
        if (!cart || !cart.items || cart.items.length === 0) {
            document.getElementById('orderSummary').innerHTML = 
                '<div class="alert alert-warning">Giỏ hàng của bạn đang trống</div>';
            const submitBtn = document.getElementById('checkoutForm')?.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            return;
        }
        
        // Filter items if some were selected
        let cartItems = cart.items;
        if (selectedItemIdsCheckout) {
            cartItems = cart.items.filter(item => selectedItemIdsCheckout.has(item.productId));
        }

        if (cartItems.length === 0) {
            document.getElementById('orderSummary').innerHTML = 
                '<div class="alert alert-warning">Không có sản phẩm nào được chọn</div>';
            const submitBtn = document.getElementById('checkoutForm')?.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            return;
        }
        
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = getShippingFee();
        
        // Calculate with voucher if applied
        let discount = 0;
        if (appliedVoucherCheckout) {
            // Re-calculate discount based on selected items if needed
            // For now, assume simple discount logic or use what API returned if applicable
            discount = appliedVoucherCheckout.discount || 0;
        }
        
        const total = subtotal - discount + shippingFee;
        
        document.getElementById('orderSummary').innerHTML = `
            <div class="summary-items-list mb-3">
                ${cartItems.map(item => `
                    <div class="d-flex justify-content-between small text-muted mb-1">
                        <span>${item.productName} x ${item.quantity}</span>
                        <span>${formatPrice(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-2">
                <span>Tạm tính:</span>
                <span>${formatPrice(subtotal)}</span>
            </div>
            ${discount > 0 ? `
            <div class="d-flex justify-content-between mb-2">
                <span class="text-success">Giảm giá:</span>
                <span class="text-success">-${formatPrice(discount)}</span>
            </div>
            ` : ''}
            <div class="d-flex justify-content-between mb-2">
                <span>Phí vận chuyển:</span>
                <span>${formatPrice(shippingFee)}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between">
                <strong>Tổng cộng:</strong>
                <strong class="text-primary" style="font-size: 1.4rem;">${formatPrice(total)}</strong>
            </div>
        `;
    } catch (error) {
        console.error('Error loading cart:', error);
        document.getElementById('orderSummary').innerHTML = 
            '<div class="alert alert-danger">Không thể tải thông tin đơn hàng</div>';
    }
}

function getShippingFee() {
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked').value;
    // STANDARD = 30000, EXPRESS = 50000
    return shippingMethod === 'EXPRESS' ? 50000 : 30000;
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('shippingAddress').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Validate required fields
    if (!fullName || !phone || !address) {
        showAlert('Vui lòng điền đầy đủ thông tin bắt buộc', 'danger');
        return;
    }
    
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked')?.value || 'STANDARD';
    
    const checkoutData = {
        fullName,
        phone,
        address,
        paymentMethod,
        shippingMethod,
        voucherCode: appliedVoucherCheckout ? appliedVoucherCheckout.code : null,
        // Send selected items to server
        itemIds: selectedItemIdsCheckout ? Array.from(selectedItemIdsCheckout) : []
    };
    
    try {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang xử lý...';
        }
        
        const response = await api.checkout(checkoutData);
        
        // Clear session storage after successful checkout
        sessionStorage.removeItem('selectedItemIds');
        sessionStorage.removeItem('appliedVoucherCode');
        
        // Nếu thanh toán online (VNPAY), tạo payment URL và redirect
        if (paymentMethod === 'VNPAY') {
            try {
                showAlert('Đang chuyển đến cổng thanh toán...', 'info');
                
                // Tạo payment URL
                const paymentResponse = await api.createVNPayPayment(response.orderId);
                
                // Redirect đến cổng thanh toán VNPay
                if (paymentResponse && paymentResponse.paymentUrl) {
                    window.location.href = paymentResponse.paymentUrl;
                } else {
                    throw new Error('Không thể tạo URL thanh toán');
                }
            } catch (error) {
                console.error('Payment error:', error);
                showAlert('Lỗi khi tạo thanh toán: ' + (error.message || 'Vui lòng thử lại'), 'danger');
                
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Đặt hàng';
                }
            }
        } else {
            // COD hoặc phương thức khác: redirect đến order detail
            showAlert('Đặt hàng thành công!', 'success');
            setTimeout(() => {
                window.location.href = `/order-detail.html?id=${response.orderId}`;
            }, 2000);
        }
    } catch (error) {
        console.error('Checkout error:', error);
        const errorMessage = error.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
        showAlert(errorMessage, 'danger');
        
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đặt hàng';
        }
    }
}

function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.innerHTML = '';
    container.appendChild(alertDiv);
}

// Apply voucher in checkout
async function applyVoucherCheckout() {
    const codeInput = document.getElementById('checkoutVoucherCode');
    const messageDiv = document.getElementById('checkoutVoucherMessage');
    const code = codeInput?.value.trim();
    
    if (!code) {
        if (messageDiv) {
            messageDiv.innerHTML = '<small class="text-danger">Vui lòng nhập mã giảm giá</small>';
        }
        return;
    }
    
    try {
        const voucherResult = await api.applyVoucher(code);
        appliedVoucherCheckout = voucherResult;
        updateVoucherUI();
        await loadCartSummary();
        
        if (messageDiv) {
            messageDiv.innerHTML = '<small class="text-success">Áp dụng mã giảm giá thành công!</small>';
        }
        
        setTimeout(() => {
            if (messageDiv) messageDiv.innerHTML = '';
        }, 3000);
    } catch (error) {
        console.error('Error applying voucher:', error);
        if (messageDiv) {
            messageDiv.innerHTML = `<small class="text-danger">${error.message || 'Không thể áp dụng mã giảm giá'}</small>`;
        }
        appliedVoucherCheckout = null;
        updateVoucherUI();
        await loadCartSummary();
    }
}

// Remove voucher in checkout
async function removeVoucherCheckout() {
    appliedVoucherCheckout = null;
    sessionStorage.removeItem('appliedVoucherCode');
    
    const codeInput = document.getElementById('checkoutVoucherCode');
    if (codeInput) {
        codeInput.value = '';
        codeInput.disabled = false;
    }
    
    updateVoucherUI();
    await loadCartSummary();
    
    const messageDiv = document.getElementById('checkoutVoucherMessage');
    if (messageDiv) {
        messageDiv.innerHTML = '<small class="text-info">Đã xóa mã giảm giá</small>';
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 2000);
    }
}

// Update voucher UI
function updateVoucherUI() {
    const codeInput = document.getElementById('checkoutVoucherCode');
    const discountDiv = document.getElementById('checkoutVoucherDiscount');
    const appliedCodeSpan = document.getElementById('checkoutAppliedVoucherCode');
    
    if (appliedVoucherCheckout && appliedVoucherCheckout.discount > 0) {
        if (codeInput) {
            codeInput.value = appliedVoucherCheckout.code;
            codeInput.disabled = true;
        }
        if (discountDiv) {
            discountDiv.style.display = 'block';
        }
        if (appliedCodeSpan) {
            appliedCodeSpan.textContent = appliedVoucherCheckout.code;
        }
    } else {
        if (codeInput) {
            codeInput.disabled = false;
        }
        if (discountDiv) {
            discountDiv.style.display = 'none';
        }
    }
}
