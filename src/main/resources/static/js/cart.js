// Cart page functionality
let currentCartItems = [];
let selectedItemIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    const authenticated = await checkAuthStatus();
    if (!authenticated) {
        window.location.href = '/auth/login.html?redirect=/cart.html';
        return;
    }
    
    await updateAuthUI();
    await loadCart();
});

async function loadCart() {
    try {
        const cart = await api.getCart();
        currentCartItems = cart.items || [];
        
        // Default: select all if none selected yet
        if (selectedItemIds.size === 0 && currentCartItems.length > 0) {
            currentCartItems.forEach(item => selectedItemIds.add(item.productId));
        }
        
        displayCart(cart);
    } catch (error) {
        console.error('Error loading cart:', error);
        document.getElementById('cartContent').innerHTML = 
            '<div style="padding: 40px; text-align: center; color: #dc2626;">Không thể tải giỏ hàng. Vui lòng thử lại sau.</div>';
    }
}

function toggleSelectAll(checked) {
    if (checked) {
        currentCartItems.forEach(item => selectedItemIds.add(item.productId));
    } else {
        selectedItemIds.clear();
    }
    updateCartUI();
}

function toggleSelectItem(productId, checked) {
    if (checked) {
        selectedItemIds.add(productId);
    } else {
        selectedItemIds.delete(productId);
    }
    updateCartUI();
}

function updateCartUI() {
    // We re-render to ensure everything is in sync, but for performance 
    // we could just update the summary. Given the scale, re-rendering is safe.
    displayCart({ items: currentCartItems });
}

function displayCart(cart) {
    const container = document.getElementById('cartContent');
    const items = cart.items || currentCartItems;
    
    if (!items || items.length === 0) {
        if (window.setCartBadgeCount) {
            window.setCartBadgeCount(0);
        }
        container.innerHTML = `
            <div class="empty-cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3.5 5h2.2l1.4 9.2a1 1 0 0 0 .99.85h9.26a1 1 0 0 0 .98-.8l1.12-5.6H7.16"/>
                    <circle cx="10" cy="19" r="1.4"/>
                    <circle cx="16.5" cy="19" r="1.4"/>
                    <line x1="3" y1="5" x2="21" y2="5" stroke-width="2"/>
                </svg>
                <h3>Giỏ hàng của bạn đang trống</h3>
                <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
                <a href="/product.html" class="button">Tiếp tục mua sắm</a>
            </div>
        `;
        return;
    }
    
    // Calculate totals based on selected items
    let selectedSubtotal = 0;
    const selectedItemsCount = items.filter(item => selectedItemIds.has(item.productId)).length;
    const allSelected = selectedItemsCount === items.length && items.length > 0;
    
    let itemsHtml = '';
    items.forEach(item => {
        const isSelected = selectedItemIds.has(item.productId);
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        const lineTotal = item.lineTotal || (price * quantity);
        const productName = escapeHtml(item.productName || 'Sản phẩm');
        
        if (isSelected) {
            selectedSubtotal += lineTotal;
        }
        
        itemsHtml += `
            <div class="cart-item">
                <label class="custom-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelectItem(${item.productId}, this.checked)">
                    <span class="checkmark"></span>
                </label>
                <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1512447608772-994891cd05d0?auto=format&fit=crop&w=640&q=80'}" 
                     class="cart-item-image" 
                     alt="${productName}">
                <div class="cart-item-info">
                    <div class="cart-item-name">
                        <a href="/product-detail.html?id=${item.productId}">${productName}</a>
                    </div>
                    <div class="cart-item-price">${formatPrice(price)}</div>
                </div>
                <div class="cart-item-quantity">
                    <input type="number" 
                           class="quantity-input" 
                           value="${quantity}" 
                           min="1"
                           onchange="updateQuantity(${item.productId}, this.value)">
                </div>
                <div class="cart-item-total">${formatPrice(lineTotal)}</div>
                <div class="cart-item-actions">
                    <button class="btn-remove" onclick="removeItem(${item.productId})" title="Xóa sản phẩm">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });
    
    const shipping = 0; // Assume 0 in cart, will be calculated in checkout
    const discount = 0; // Vouchers are handled in checkout mostly
    const totalAmount = selectedSubtotal + shipping - discount;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 400px; gap: 32px;">
            <div>
                <div class="select-all-container">
                    <label class="custom-checkbox">
                        <input type="checkbox" ${allSelected ? 'checked' : ''} onchange="toggleSelectAll(this.checked)">
                        <span class="checkmark"></span>
                    </label>
                    <span>Chọn tất cả (${items.length} sản phẩm)</span>
                </div>
                ${itemsHtml}
            </div>
            <div class="cart-summary">
                <h3 style="margin: 0 0 24px; font-size: 1.3rem;">Tóm tắt đơn hàng</h3>
                <div class="summary-row">
                    <span class="summary-label">Đã chọn</span>
                    <span class="summary-value">${selectedItemsCount} sản phẩm</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Tạm tính</span>
                    <span class="summary-value">${formatPrice(selectedSubtotal)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Tổng cộng</span>
                    <span class="summary-value summary-total">${formatPrice(totalAmount)}</span>
                </div>
                <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="goToCheckout()" class="button" ${selectedItemsCount === 0 ? 'disabled' : ''} style="text-align: center; width: 100%;">
                        Mua hàng (${selectedItemsCount})
                    </button>
                    <a href="/product.html" class="button button--ghost" style="text-align: center; width: 100%;">Tiếp tục mua sắm</a>
                </div>
            </div>
        </div>
    `;
    
    const quantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (window.setCartBadgeCount) {
        window.setCartBadgeCount(quantity);
    }
}

function goToCheckout() {
    if (selectedItemIds.size === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
        return;
    }
    
    // Save selected items to sessionStorage for checkout page
    sessionStorage.setItem('selectedItemIds', JSON.stringify(Array.from(selectedItemIds)));
    window.location.href = '/checkout.html';
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

async function updateQuantity(productId, quantity) {
    try {
        await api.updateCartItem(productId, parseInt(quantity));
        await loadCart();
    } catch (error) {
        console.error('Error updating quantity:', error);
        await loadCart();
    }
}

async function removeItem(productId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        return;
    }
    
    try {
        await api.removeCartItem(productId);
        selectedItemIds.delete(productId); // Remove from selection if deleted
        await loadCart();
    } catch (error) {
        console.error('Error removing item:', error);
    }
}



