// Wishlist page functionality
let allWishlistItems = [];

document.addEventListener('DOMContentLoaded', async () => {
    const authenticated = await checkAuthStatus();
    if (!authenticated) {
        window.location.href = '/auth/login.html?redirect=/wishlist.html';
        return;
    }
    
    await updateAuthUI();
    await loadWishlist();
    
});

async function loadWishlist() {
    try {
        allWishlistItems = await api.getWishlist();
        displayWishlist(allWishlistItems);
    } catch (error) {
        console.error('Error loading wishlist:', error);
        document.getElementById('wishlistContent').innerHTML = 
            '<div class="alert alert-danger">Không thể tải danh sách yêu thích</div>';
    }
}


function displayWishlist(items) {
    const container = document.getElementById('wishlistContent');
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-wishlist">
                <svg class="empty-wishlist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h3>Danh sách yêu thích trống</h3>
                <p>Bạn chưa có sản phẩm nào trong danh sách yêu thích</p>
                <a href="/product.html" class="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>
                    </svg>
                    Tiếp tục mua sắm
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="wishlist-grid">
            ${items.map(item => {
                const price = item.price || 0;
                const imageUrl = item.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image';
                return `
                <div class="wishlist-item" onclick="window.location.href='/product-detail.html?id=${item.productId}'">
                    <div class="wishlist-item__favorite-icon" onclick="event.stopPropagation(); removeFromWishlist(${item.productId})">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </div>
                    <div class="wishlist-item__image-wrapper">
                        <img src="${imageUrl}" 
                             class="wishlist-item__image" 
                             alt="${item.productName || 'Sản phẩm'}"
                             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    </div>
                    <div class="wishlist-item__body">
                        <h3 class="wishlist-item__title">${item.productName || 'Sản phẩm'}</h3>
                        <div class="wishlist-item__price">${formatPrice(price)}</div>
                    </div>
                </div>
            `;
            }).join('')}
        </div>
    `;
}


async function addToCartFromWishlist(productId) {
    try {
        await api.addToCart(productId, null, 1);
        showToast('Đã thêm vào giỏ hàng');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Không thể thêm vào giỏ hàng', 'error');
    }
}

async function removeFromWishlist(productId) {
    try {
        await api.removeFromWishlist(productId);
        await loadWishlist();
        showToast('Đã xóa khỏi danh sách yêu thích');
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showToast('Không thể xóa', 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'wishlist-toast';
    toast.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(37, 99, 235, 0.95)';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function updateAuthUI() {
    const authenticated = await checkAuthStatus();
    if (authenticated) {
        document.getElementById('loginLink').classList.add('d-none');
        document.getElementById('logoutLink').classList.remove('d-none');
    } else {
        document.getElementById('loginLink').classList.remove('d-none');
        document.getElementById('logoutLink').classList.add('d-none');
    }
}

async function handleLogout() {
    try {
        await api.logout();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

