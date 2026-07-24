// Order detail page functionality
const FALLBACK_IMAGE_URL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 120%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23737b7f%22 font-size=%2220%22 font-family=%22Inter%2C%20sans-serif%22%3ENo%20image%3C/text%3E%3C/svg%3E';
let orderId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const authenticated = await checkAuthStatus();
    if (!authenticated) {
        window.location.href = '/auth/login.html';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('id');
    
    if (!orderId) {
        document.getElementById('orderDetail').innerHTML = 
            '<div style="padding: 40px; text-align: center; color: #dc2626;">Không tìm thấy đơn hàng</div>';
        return;
    }
    
    await loadOrderDetail();
});

async function loadOrderDetail() {
    try {
        const order = await api.getOrder(orderId);
        displayOrder(order);
    } catch (error) {
        console.error('Error loading order:', error);
        document.getElementById('orderDetail').innerHTML = 
            '<div style="padding: 40px; text-align: center; color: #dc2626;">Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.</div>';
    }
}

function displayOrder(order) {
    const container = document.getElementById('orderDetail');
    
    const canCancel = order.status === 'PENDING' || order.status === 'PROCESSING';
    
    // Calculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => {
        const itemTotal = item.lineTotal || (item.price * item.quantity);
        return sum + itemTotal;
    }, 0);
    
    // Get voucher discount and shipping fee if available
    const voucherDiscount = order.voucherDiscount || 0;
    const shippingFee = order.shippingFee || 0;
    // Use finalTotal from backend response (already accounts for paidAmount)
    // If not available, fallback to calculation
    const finalTotal = order.finalTotal !== undefined ? order.finalTotal : (subtotal - voucherDiscount + shippingFee);
    
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);
    const paymentStatusClass = getPaymentStatusClass(order.paymentStatus);
    const paymentStatusText = getPaymentStatusText(order.paymentStatus);
    
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'N/A';
    
        const itemsHtml = order.items && order.items.length > 0 ? order.items.map(item => {
        const itemTotal = item.lineTotal || (item.price * item.quantity);
        const productName = escapeHtml(item.productName || 'N/A');
        const variantName = item.variantName ? escapeHtml(item.variantName) : null;
            const itemImage = item.imageUrl && item.imageUrl.trim() ? item.imageUrl : FALLBACK_IMAGE_URL;
        
        return `
            <div class="order-item-detail">
                <img src="${itemImage}" 
                     class="order-item-image" 
                     alt="${productName}"
                     onerror="this.onerror=null; this.src='${FALLBACK_IMAGE_URL}'">
                <div class="order-item-content">
                    <div class="order-item-name">
                        <a href="/product-detail.html?id=${item.productId}">${productName}</a>
                    </div>
                    ${variantName ? `<div class="order-item-variant">${variantName}</div>` : ''}
                    <div class="order-item-meta">
                        <span>Số lượng: ${item.quantity || 0}</span>
                        <span>Đơn giá: ${formatPrice(item.price || 0)}</span>
                    </div>
                </div>
                <div class="order-item-price">${formatPrice(itemTotal)}</div>
            </div>
        `;
    }).join('') : '<div style="text-align: center; padding: 40px; color: var(--color-muted);">Không có sản phẩm</div>';
    
    container.innerHTML = `
        <div class="order-detail-grid">
            <div>
                <div class="order-detail-card">
                    <h3 class="card-title">Thông tin đơn hàng</h3>
                    <div class="detail-grid">
                        <div class="detail-group">
                            <span class="detail-label">Mã đơn hàng</span>
                            <span class="detail-value">#${order.orderNumber || order.id}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Ngày đặt</span>
                            <span class="detail-value">${orderDate}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Trạng thái</span>
                            <span class="order-status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Phương thức thanh toán</span>
                            <span class="detail-value">${getPaymentMethodText(order.paymentMethod)}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Trạng thái thanh toán</span>
                            <span class="order-status-badge ${paymentStatusClass}">${paymentStatusText}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Số điện thoại</span>
                            <span class="detail-value">${escapeHtml(order.customerPhone || 'N/A')}</span>
                        </div>
                        <div class="detail-group" style="grid-column: 1 / -1;">
                            <span class="detail-label">Địa chỉ giao hàng</span>
                            <span class="detail-value detail-value--address">${escapeHtml(order.shippingAddress || 'N/A')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="order-detail-card">
                    <h3 class="card-title">Sản phẩm đã đặt</h3>
                    <div class="order-items-list">
                        ${itemsHtml}
                    </div>
                </div>
                
                ${canCancel ? `
                    <div class="order-detail-card">
                        <div class="order-actions">
                            <button class="btn-action btn-action--danger" onclick="cancelOrder()">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                Hủy đơn hàng
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div>
                <div class="order-summary-card">
                    <h3 class="card-title">Tóm tắt đơn hàng</h3>
                    <div class="total-row">
                        <span class="total-label">Tạm tính</span>
                        <span class="total-value">${formatPrice(subtotal)}</span>
                    </div>
                    ${voucherDiscount > 0 ? `
                    <div class="total-row">
                        <span class="total-label">
                            Giảm giá${order.voucherCode ? ` (${escapeHtml(order.voucherCode)})` : ''}
                        </span>
                        <span class="total-value total-value--discount">-${formatPrice(voucherDiscount)}</span>
                    </div>
                    ` : ''}
                    <div class="total-row">
                        <span class="total-label">Phí vận chuyển</span>
                        <span class="total-value">${formatPrice(shippingFee)}</span>
                    </div>
                    <div class="order-total-section">
                        <div class="total-row final">
                            <span>Tổng cộng</span>
                            <span>${formatPrice(finalTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    const statusLower = (status || '').toUpperCase();
    if (statusLower.includes('PENDING') || statusLower.includes('PROCESSING')) return 'pending';
    if (statusLower.includes('CONFIRMED')) return 'confirmed';
    if (statusLower.includes('SHIPPED') || statusLower.includes('SHIPPING')) return 'shipping';
    if (statusLower.includes('DELIVERED') || statusLower.includes('COMPLETED')) return 'delivered';
    if (statusLower.includes('CANCELLED')) return 'cancelled';
    return 'pending';
}

function getPaymentStatusClass(status) {
    const statusLower = (status || '').toUpperCase();
    if (statusLower.includes('PENDING')) return 'pending';
    if (statusLower.includes('PAID')) return 'delivered';
    if (statusLower.includes('FAILED')) return 'cancelled';
    if (statusLower.includes('REFUNDED')) return 'pending';
    return 'pending';
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Helper functions for status display
function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xử lý',
        'PROCESSING': 'Đang xử lý',
        'SHIPPED': 'Đã giao hàng',
        'DELIVERED': 'Đã nhận hàng',
        'CANCELLED': 'Đã hủy',
        'COMPLETED': 'Hoàn thành'
    };
    return statusMap[status] || status;
}

function getPaymentMethodText(method) {
    const methodMap = {
        'COD': 'Thanh toán khi nhận hàng',
        'VNPAY': 'VNPay'
    };
    return methodMap[method] || method || 'N/A';
}

function getPaymentStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ thanh toán',
        'PAID': 'Đã thanh toán',
        'FAILED': 'Thanh toán thất bại',
        'REFUNDED': 'Đã hoàn tiền'
    };
    return statusMap[status] || status || 'N/A';
}

function getPaymentStatusBadge(status) {
    const badgeMap = {
        'PENDING': 'bg-warning',
        'PAID': 'bg-success',
        'FAILED': 'bg-danger',
        'REFUNDED': 'bg-info'
    };
    return badgeMap[status] || 'bg-secondary';
}

async function cancelOrder() {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
        return;
    }
    
    try {
        await api.cancelOrder(orderId);
        showAlert('Đã hủy đơn hàng thành công', 'success');
        setTimeout(() => {
            loadOrderDetail();
        }, 1000);
    } catch (error) {
        console.error('Error cancelling order:', error);
        const errorMessage = error.message || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.';
        showAlert(errorMessage, 'error');
    }
}

// Expose cancelOrder to global scope so it can be called from onclick
window.cancelOrder = cancelOrder;

function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
    alertDiv.style.cssText = 'padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem;';
    if (type === 'error') {
        alertDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        alertDiv.style.color = '#dc2626';
        alertDiv.style.border = '1px solid rgba(239, 68, 68, 0.2)';
    } else {
        alertDiv.style.background = 'rgba(34, 197, 94, 0.1)';
        alertDiv.style.color = '#16a34a';
        alertDiv.style.border = '1px solid rgba(34, 197, 94, 0.2)';
    }
    alertDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

