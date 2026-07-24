// API Client Utility
const API_BASE_URL = '/api';

// Check if user is authenticated (JWT is in httpOnly cookie, so we check via API)
let authStatus = null;

async function checkAuthStatus() {
    // Always check fresh if status is null (force check after login/logout)
    if (authStatus !== null && authStatus === true) {
        // Only use cached true status, but verify if it's a fresh check needed
        return authStatus;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: 'include'
        });
        authStatus = response.ok;
        return authStatus;
    } catch (error) {
        console.error('Auth check error:', error);
        authStatus = false;
        return false;
    }
}

// Check if user is authenticated (synchronous check using cached status)
function isAuthenticated() {
    // For immediate check, we'll use a simple approach
    // The actual check will be done async when needed
    return authStatus === true;
}

// Reset auth status (call after login/logout)
function resetAuthStatus() {
    authStatus = null;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const config = {
        ...options,
        headers,
        credentials: 'include' // Include cookies for JWT (httpOnly cookie)
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (response.status === 401) {
            // Unauthorized - update auth status and redirect to login
            authStatus = false;
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/auth/')) {
                window.location.href = `/auth/login.html?redirect=${encodeURIComponent(currentPath)}`;
            }
            return null;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        // Handle 204 No Content (empty response body)
        if (response.status === 204) {
            return null;
        }

        // Try to parse JSON, but handle empty responses gracefully
        const text = await response.text();
        if (!text || text.trim() === '') {
            return null;
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            // If parsing fails, return null for DELETE/empty responses
            if (response.status === 200 || response.status === 201) {
                return null;
            }
            throw e;
        }
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// API methods
const api = {
    // Auth
    login: async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies
            body: JSON.stringify({ username, password })
        });
        return response;
    },
    register: (data) => {
        return fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    loginWithGoogle: (idToken) => {
        return apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken })
        });
    },
    logout: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        resetAuthStatus();
        return response;
    },
    
    // Get current user
    getCurrentUser: () => {
        return apiRequest('/auth/me');
    },
    
    // Update user profile
    updateProfile: (data) => {
        return apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // Change password
    changePassword: (currentPassword, newPassword, confirmPassword) => {
        return fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword
            })
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.message || 'Đổi mật khẩu thất bại');
                }).catch(() => {
                    throw new Error(`Đổi mật khẩu thất bại: ${res.status} ${res.statusText}`);
                });
            }
            return res.json();
        });
    },
    
    // Upload avatar
    uploadAvatar: (formData) => {
        return fetch(`${API_BASE_URL}/auth/avatar`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.message || 'Upload failed');
                }).catch(() => {
                    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
                });
            }
            return res.json();
        });
    },

    // Products
    getProducts: (params = {}) => {
        // Chỉ thêm query string nếu có params
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] != null && params[key] !== '') {
                queryParams.append(key, params[key]);
            }
        });
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        console.log('Calling API:', `${API_BASE_URL}${endpoint}`);
        return apiRequest(endpoint);
    },
    getProduct: (id) => {
        return apiRequest(`/products/${id}`);
    },

    // Cart
    getCart: () => {
        return apiRequest('/cart');
    },
    addToCart: (productId, variantId, quantity) => {
        return apiRequest('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ productId, variantId, quantity })
        });
    },
    updateCartItem: (productId, quantity) => {
        return apiRequest('/cart/items', {
            method: 'PUT',
            body: JSON.stringify({ productId, quantity })
        });
    },
    removeCartItem: (productId) => {
        return apiRequest(`/cart/items/${productId}`, { method: 'DELETE' });
    },
    clearCart: () => {
        return apiRequest('/cart', { method: 'DELETE' });
    },
    applyVoucher: (code) => {
        return apiRequest('/cart/apply-voucher', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    },
    checkout: (data) => {
        return apiRequest('/checkout', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // Payment
    createVNPayPayment: (orderId) => {
        return apiRequest('/payments/vnpay/create', {
            method: 'POST',
            body: JSON.stringify({ orderId })
        });
    },

    // Orders
    getOrders: () => {
        return apiRequest('/orders/my');
    },
    getOrder: (id) => {
        return apiRequest(`/orders/${id}`);
    },
    cancelOrder: (id, reason) => {
        return apiRequest(`/orders/${id}/cancel?reason=${encodeURIComponent(reason || '')}`, {
            method: 'POST'
        });
    },
    confirmReceived: (id) => {
        return apiRequest(`/orders/${id}/confirm-received`, {
            method: 'POST'
        });
    },

    // Wishlist
    getWishlist: () => {
        return apiRequest('/wishlist');
    },
    addToWishlist: (productId) => {
        return apiRequest(`/wishlist/${productId}`, {
            method: 'POST'
        });
    },
    removeFromWishlist: (productId) => {
        return apiRequest(`/wishlist/${productId}`, { method: 'DELETE' });
    },

    // Reviews
    getProductReviews: (productId) => {
        return apiRequest(`/reviews/product/${productId}`);
    },
    getProductRatingStats: (productId) => {
        return apiRequest(`/reviews/product/${productId}/stats`);
    },
    createReview: (productId, rating, comment, files) => {
        const formData = new FormData();
        // Đảm bảo productId và rating được convert thành string (FormData tự động làm điều này)
        formData.append('productId', String(productId));
        formData.append('rating', String(rating));
        if (comment) formData.append('comment', comment);
        if (files && files.length > 0) {
            files.forEach(file => formData.append('files', file));
        }
        return fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            credentials: 'include',
            // Không set Content-Type header, để browser tự động set multipart/form-data với boundary
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.message || 'Tạo bình luận thất bại');
                }).catch(() => {
                    throw new Error(`Tạo bình luận thất bại: ${res.status} ${res.statusText}`);
                });
            }
            return res.json();
        });
    },
    updateReview: (reviewId, rating, comment, files) => {
        const formData = new FormData();
        formData.append('rating', String(rating));
        if (comment) formData.append('comment', comment);
        if (files && files.length > 0) {
            files.forEach(file => formData.append('files', file));
        }
        return fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
            method: 'PUT',
            credentials: 'include',
            // Không set Content-Type header, để browser tự động set multipart/form-data với boundary
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.message || 'Sửa bình luận thất bại');
                }).catch(() => {
                    throw new Error(`Sửa bình luận thất bại: ${res.status} ${res.statusText}`);
                });
            }
            return res.json();
        });
    },
    deleteReview: (reviewId) => {
        return apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
    },
    replyToReview: (reviewId, replyComment) => {
        return apiRequest(`/reviews/${reviewId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ replyComment })
        });
    },

    // Vouchers
    getVouchers: () => {
        return apiRequest('/vouchers');
    },
    getAvailableVouchers: () => {
        return apiRequest('/vouchers/available');
    },
    getVoucherByCode: (code) => {
        return apiRequest(`/vouchers/${code}`);
    },
    getMyVouchers: () => {
        return apiRequest('/vouchers/my-vouchers');
    },
    claimVoucher: (code) => {
        return apiRequest('/vouchers/claim', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    },

    // Admin - Products CRUD
    createProduct: (data) => {
        return apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    updateProduct: (id, data) => {
        return apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    deleteProduct: (id) => {
        return apiRequest(`/products/${id}`, { method: 'DELETE' });
    },
    uploadProductImage: (id, formData) => {
        return fetch(`${API_BASE_URL}/products/${id}/image`, {
            method: 'POST',
            credentials: 'include',
            body: formData
            // Note: Don't set Content-Type header, let browser set it with boundary for multipart/form-data
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.message || 'Upload failed');
                }).catch(() => {
                    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
                });
            }
            return res.json();
        });
    },
    toggleProductStatus: (id) => {
        return apiRequest(`/products/${id}/toggle-status`, {
            method: 'PUT'
        });
    },

    // Admin - Categories CRUD
    getCategories: () => {
        return apiRequest('/categories');
    },
    getCategory: (id) => {
        return apiRequest(`/categories/${id}`);
    },
    createCategory: (data) => {
        return apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    updateCategory: (id, data) => {
        return apiRequest(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    deleteCategory: (id) => {
        return apiRequest(`/categories/${id}`, { method: 'DELETE' });
    },

    // Admin - Users
    getAllUsers: () => {
        return apiRequest('/admin/users');
    },
    updateUserStatus: (userId, isActive) => {
        return apiRequest(`/admin/users/${userId}/status?isActive=${isActive}`, {
            method: 'PUT'
        });
    },
    updateUserRoles: (userId, roles) => {
        return apiRequest(`/admin/users/${userId}/roles`, {
            method: 'PUT',
            body: JSON.stringify({ roles })
        });
    },

    // Admin - Orders
    getAllOrders: () => {
        return apiRequest('/admin/orders');
    },
    getOrderDetail: (orderId) => {
        return apiRequest(`/orders/${orderId}`);
    },
    updateOrderStatus: (orderId, status) => {
        return apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ newStatus: status })
        });
    },

    // Admin - Vouchers CRUD
    getAllVouchers: () => {
        return apiRequest('/vouchers');
    },
    getVoucher: (id) => {
        return apiRequest(`/vouchers/${id}`);
    },
    createVoucher: (data) => {
        return apiRequest('/vouchers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    updateVoucher: (id, data) => {
        return apiRequest(`/vouchers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    deleteVoucher: (id) => {
        return apiRequest(`/vouchers/${id}`, { method: 'DELETE' });
    },
    disableVoucher: (id) => {
        return apiRequest(`/vouchers/${id}/disable`, { method: 'POST' });
    }
};

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.insertBefore(alertDiv, document.body.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
}

function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';
    }
}

