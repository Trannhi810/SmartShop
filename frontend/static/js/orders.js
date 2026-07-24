// Orders page functionality
let allOrders = [];
let filteredOrders = [];
let currentFilter = 'all';
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const authenticated = await checkAuthStatus();
    if (!authenticated) {
        window.location.href = '/auth/login.html?redirect=/orders.html';
        return;
    }
    
    await updateAuthUI();
    await loadUserInfo();
    await loadOrders();
    setupEventListeners();
});

async function loadUserInfo() {
    try {
        currentUser = await api.getCurrentUser();
        if (currentUser) {
            updateSidebarUserInfo(currentUser);
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

function updateSidebarUserInfo(user) {
    const avatar = document.getElementById('sidebarAvatar');
    const username = document.getElementById('sidebarUsername');
    
    if (avatar) {
        const name = user.fullName || user.username || 'U';
        avatar.textContent = name.charAt(0).toUpperCase();
    }
    
    if (username) {
        username.textContent = user.fullName || user.username || 'Người dùng';
    }
}

function setupEventListeners() {
    // Tab filter
    const tabs = document.querySelectorAll('.orders-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.status;
            filterOrders();
        });
    });
    
    // Search
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterOrders();
            }, 300);
        });
    }
}

async function loadOrders() {
    try {
        allOrders = await api.getOrders();
        filteredOrders = [...allOrders];
        filterOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersContent').innerHTML = 
            '<div style="padding: 40px; text-align: center; color: #dc2626;">Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.</div>';
    }
}

function filterOrders() {
    const searchInput = document.getElementById('orderSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    filteredOrders = allOrders.filter(order => {
        // Filter by status
        if (currentFilter !== 'all' && order.status !== currentFilter) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const orderNumber = (order.orderNumber || order.id || '').toString().toLowerCase();
            const customerName = (order.customerName || '').toLowerCase();
            const productNames = (order.items || []).map(item => (item.productName || '').toLowerCase()).join(' ');
            
            if (!orderNumber.includes(searchTerm) && 
                !customerName.includes(searchTerm) && 
                !productNames.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    displayOrders(filteredOrders);
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContent');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.3;">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
                </svg>
                <h3 style="margin: 16px 0 8px; color: var(--color-text);">Bạn chưa có đơn hàng nào</h3>
                <p style="color: var(--color-muted); margin-bottom: 24px;">Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên</p>
                <a href="/product.html" class="button">Mua sắm ngay</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => {
        return renderOrderCard(order);
    }).join('');
}

function renderOrderCard(order) {
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);
    const statusBadgeClass = getStatusBadgeClass(order.status);
    
    const items = order.items || [];
    const itemsHtml = items.map(item => renderOrderItem(item)).join('');
    
    const canCancel = order.status === 'PENDING';
    const canReview = order.status === 'COMPLETED';
    const canConfirmReceived = order.status === 'DELIVERED';
    
    const actionsHtml = getOrderActions(order, canCancel, canReview, canConfirmReceived);
    
    // Get status display text
    const statusDisplayText = getStatusDisplayText(order.status);
    
    // Thêm thông báo đặc biệt khi đơn hàng đã giao thành công
    const deliveredNotice = order.status === 'DELIVERED' ? `
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 16px; border-radius: 6px; display: flex; align-items: center; gap: 12px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink: 0;">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div style="flex: 1;">
                <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Đơn hàng đã được giao thành công!</strong>
                <span style="color: #1e3a8a; font-size: 13px;">Vui lòng xác nhận đã nhận hàng để hoàn tất đơn hàng.</span>
            </div>
        </div>
    ` : '';
    
    return `
        <div class="order-card">
            <div class="order-status-header">
                <div class="order-status-text">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M5 12l4-4m-4 4l4 4"/>
                    </svg>
                    <span>${statusDisplayText}</span>
                </div>
                <span class="order-status-badge ${statusBadgeClass}">${statusText}</span>
            </div>
            
            ${deliveredNotice}
            
            <div class="order-items">
                ${itemsHtml}
            </div>
            
            <div class="order-total">
                <div class="order-total-label">Thành tiền:</div>
                <div class="order-total-amount">${formatPrice(order.totalAmount || 0)}</div>
            </div>
            
            ${actionsHtml}
        </div>
    `;
}

function renderOrderItem(item) {
    const productName = escapeHtml(item.productName || 'Sản phẩm');
    const variantName = item.variantName ? escapeHtml(item.variantName) : null;
    const imageUrl = item.imageUrl || 'https://images.unsplash.com/photo-1512447608772-994891cd05d0?auto=format&fit=crop&w=640&q=80';
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    const lineTotal = item.lineTotal || (price * quantity);
    
    // Calculate original price (assume 10% discount for demo)
    const originalPrice = Math.round(price * 1.1);
    
    return `
        <div class="order-item">
            <img src="${imageUrl}" 
                 class="order-item-image" 
                 alt="${productName}"
                 onerror="this.src='https://images.unsplash.com/photo-1512447608772-994891cd05d0?auto=format&fit=crop&w=640&q=80'">
            <div class="order-item-info">
                <div class="order-item-name">${productName}</div>
                ${variantName ? `<div class="order-item-variant">Phân loại hàng: ${variantName}</div>` : ''}
                <div class="order-item-price">
                    <span class="order-item-price-old">${formatPrice(originalPrice)}</span>
                    <span class="order-item-price-new">${formatPrice(price)}</span>
                </div>
            </div>
            <div class="order-item-quantity">x${quantity}</div>
        </div>
    `;
}

function getOrderActions(order, canCancel, canReview, canConfirmReceived) {
    const actions = [];
    
    if (canConfirmReceived) {
        actions.push(`
            <button class="btn-order-action btn-order-action--confirm" onclick="confirmReceived(${order.id}, this)" style="flex: 1; max-width: 300px; justify-content: center;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px;">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span style="font-size: 14px; font-weight: 600;">Đã nhận hàng</span>
            </button>
        `);
    }
    
    if (canReview) {
        actions.push(`
            <button class="btn-order-action btn-order-action--primary" onclick="reviewOrder(${order.id})">
                Đánh Giá
            </button>
        `);
    }
    
    if (canCancel) {
        actions.push(`
            <button class="btn-order-action" onclick="cancelOrderFromList(${order.id})">
                Hủy đơn hàng
            </button>
        `);
    }
    
    actions.push(`
        <a href="/order-detail.html?id=${order.id}" class="btn-order-action">
            Xem chi tiết
        </a>
    `);
    
    if (order.status === 'COMPLETED') {
        actions.push(`
            <button class="btn-order-action" onclick="requestReturn(${order.id})">
                Yêu Cầu Trả Hàng/Hoàn Tiền
            </button>
        `);
    }
    
    return actions.length > 0 ? `<div class="order-actions">${actions.join('')}</div>` : '';
}

function getStatusDisplayText(status) {
    const statusMap = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PROCESSING': 'Đang xử lý',
        'SHIPPING': 'Đang giao hàng',
        'SHIPPED': 'Đang giao hàng',
        'DELIVERED': 'Đã giao hàng - Vui lòng xác nhận đã nhận hàng',
        'COMPLETED': 'Hoàn thành',
        'CANCELLED': 'Đã hủy',
        'REFUNDED': 'Đã hoàn tiền'
    };
    return statusMap[status] || status || 'Chờ xử lý';
}

function getStatusClass(status) {
    const statusLower = (status || '').toUpperCase();
    if (statusLower.includes('PENDING')) return 'pending';
    if (statusLower.includes('PROCESSING')) return 'processing';
    if (statusLower.includes('SHIPPING') || statusLower.includes('SHIPPED')) return 'shipping';
    if (statusLower.includes('DELIVERED') || statusLower.includes('COMPLETED')) return 'delivered';
    if (statusLower.includes('CANCELLED')) return 'cancelled';
    if (statusLower.includes('REFUNDED')) return 'refunded';
    return 'pending';
}

function getStatusBadgeClass(status) {
    const statusLower = (status || '').toUpperCase();
    if (statusLower.includes('DELIVERED') || statusLower.includes('COMPLETED')) return 'completed';
    if (statusLower.includes('PENDING')) return 'pending';
    if (statusLower.includes('SHIPPING') || statusLower.includes('SHIPPED') || statusLower.includes('PROCESSING')) return 'shipping';
    if (statusLower.includes('CANCELLED')) return 'cancelled';
    return 'pending';
}

function getStatusText(status) {
    const statusMap = {
        'PENDING': 'CHỜ XÁC NHẬN',
        'CONFIRMED': 'ĐÃ XÁC NHẬN',
        'PROCESSING': 'ĐANG XỬ LÝ',
        'SHIPPING': 'ĐANG GIAO HÀNG',
        'SHIPPED': 'ĐANG GIAO HÀNG',
        'DELIVERED': 'ĐÃ GIAO HÀNG',
        'COMPLETED': 'HOÀN THÀNH',
        'CANCELLED': 'ĐÃ HỦY',
        'REFUNDED': 'ĐÃ HOÀN TIỀN'
    };
    return statusMap[status] || status || 'CHỜ XỬ LÝ';
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

// Action handlers
async function cancelOrderFromList(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
        return;
    }
    
    try {
        await api.cancelOrder(orderId);
        alert('Đã hủy đơn hàng thành công');
        await loadOrders();
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert(error.message || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.');
    }
}

async function reviewOrder(orderId) {
    try {
        // Lấy thông tin đơn hàng để có danh sách sản phẩm
        const order = await api.getOrder(orderId);
        
        if (!order || !order.items || order.items.length === 0) {
            alert('Đơn hàng không có sản phẩm để đánh giá');
            return;
        }
        
        // Nếu đơn hàng có 1 sản phẩm, chuyển trực tiếp đến trang sản phẩm đó
        if (order.items.length === 1) {
            const productId = order.items[0].productId;
            if (!productId) {
                alert('Không tìm thấy thông tin sản phẩm');
                return;
            }
            // Chuyển đến trang chi tiết sản phẩm với hash #review để tự động scroll đến phần đánh giá
            window.location.href = `/product-detail.html?id=${productId}#review`;
            return;
        }
        
        // Nếu đơn hàng có nhiều sản phẩm, hiển thị danh sách để chọn
        const productList = order.items.map((item, index) => 
            `${index + 1}. ${item.productName || 'Sản phẩm ' + (index + 1)}`
        ).join('\n');
        
        const choice = prompt(
            `Đơn hàng có ${order.items.length} sản phẩm. Vui lòng chọn số thứ tự sản phẩm muốn đánh giá:\n\n${productList}\n\nNhập số (1-${order.items.length}):`
        );
        
        if (!choice) {
            return; // Người dùng hủy
        }
        
        const selectedIndex = parseInt(choice) - 1;
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= order.items.length) {
            alert('Lựa chọn không hợp lệ');
            return;
        }
        
        const selectedProduct = order.items[selectedIndex];
        const productId = selectedProduct.productId;
        
        if (!productId) {
            alert('Không tìm thấy thông tin sản phẩm');
            return;
        }
        
        // Chuyển đến trang chi tiết sản phẩm với hash #review
        window.location.href = `/product-detail.html?id=${productId}#review`;
    } catch (error) {
        console.error('Error loading order for review:', error);
        alert('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
    }
}

function requestReturn(orderId) {
    if (confirm('Bạn có muốn yêu cầu trả hàng/hoàn tiền cho đơn hàng này?')) {
        alert('Chức năng này đang được phát triển');
    }
}

async function confirmReceived(orderId, buttonElement) {
    const confirmed = confirm('✅ Xác nhận nhận hàng\n\nBạn có chắc chắn đã nhận được hàng và hàng hóa đúng như đơn đặt?\n\nSau khi xác nhận, đơn hàng sẽ được hoàn tất.');
    if (!confirmed) {
        return;
    }
    
    const button = buttonElement;
    const originalText = button?.innerHTML;
    
    try {
        // Hiển thị loading
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 8px;"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...</span>';
        }
        
        await api.confirmReceived(orderId);
        
        // Thông báo thành công
        alert('🎉 Cảm ơn bạn!\n\nĐã xác nhận nhận hàng thành công. Đơn hàng của bạn đã được hoàn tất.');
        
        // Reload danh sách đơn hàng
        await loadOrders();
    } catch (error) {
        console.error('Error confirming received:', error);
        const errorMessage = error.message || 'Không thể xác nhận nhận hàng. Vui lòng thử lại sau.';
        alert('❌ Lỗi\n\n' + errorMessage);
        
        // Khôi phục button nếu có
        if (button && originalText) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
}

// Expose functions to global scope
window.cancelOrderFromList = cancelOrderFromList;
window.reviewOrder = reviewOrder;
window.requestReturn = requestReturn;
window.confirmReceived = confirmReceived;
