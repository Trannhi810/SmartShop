// Admin Dashboard
let stats = null;
let orders = [];
let products = [];
let dailyRevenueChart = null;
let monthlyRevenueChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStats(),
            loadOrders(),
            loadProducts()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Lỗi khi tải dữ liệu dashboard: ' + (error.message || 'Unknown error'), 'danger');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/dashboard/stats', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        const result = await response.json();
        stats = result.data || result;
        renderStats();
    } catch (error) {
        console.error('Error loading stats:', error);
        showAlert('Lỗi khi tải thống kê: ' + (error.message || 'Unknown error'), 'danger');
    }
}

// Load orders
async function loadOrders() {
    try {
        const response = await api.getAllOrders();
        orders = response.data || response || [];
        renderRecentOrders();
        renderRevenueCharts();
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Lỗi khi tải đơn hàng: ' + (error.message || 'Unknown error'), 'danger');
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await api.getProducts({
            page: 0,
            size: 10000,
            includeInactive: true
        });

        // Chuẩn hóa dữ liệu sản phẩm thành mảng
        if (response && Array.isArray(response.content)) {
            // Trường hợp backend trả về Page<ProductResponse>
            products = response.content;
        } else if (response && response.data && Array.isArray(response.data)) {
            // Trường hợp bọc trong ApiResponse
            products = response.data;
        } else if (Array.isArray(response)) {
            // Trường hợp trả về mảng trực tiếp
            products = response;
        } else {
            products = [];
        }

        renderLowStockProducts();
        // Re-render stats to update category count
        renderStats();
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Lỗi khi tải sản phẩm: ' + (error.message || 'Unknown error'), 'danger');
    }
}

// Render statistics cards
function renderStats() {
    if (!stats) return;

    const totalProductsEl = document.getElementById('totalProducts');
    const totalCategoriesEl = document.getElementById('totalCategories');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalUsersEl = document.getElementById('totalUsers');

    if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts || 0;
    if (totalCategoriesEl) {
        // Count unique categories from products
        const uniqueCategories = new Set(products.map(p => p.categoryId).filter(id => id != null));
        totalCategoriesEl.textContent = uniqueCategories.size;
    }
    if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
}

// Render recent orders (latest 10)
function renderRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    // Sort by createdAt descending and get latest 10
    const recentOrders = [...orders]
        .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        })
        .slice(0, 10);

    if (!recentOrders || recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có đơn hàng nào</td></tr>';
        return;
    }

    tbody.innerHTML = recentOrders.map(order => {
        const statusBadge = getStatusBadge(order.status);
        const totalAmount = order.totalAmount || 0;
        const createdAt = order.createdAt ? 
            new Date(order.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
        
        return `
        <tr>
            <td><strong>${order.orderNumber || '-'}</strong></td>
            <td>${order.customerName || order.customerEmail || '-'}</td>
            <td class="text-end">${formatPrice(totalAmount)}</td>
            <td>${statusBadge}</td>
            <td>${createdAt}</td>
        </tr>
    `;
    }).join('');
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="badge bg-warning">Chờ xử lý</span>',
        'PROCESSING': '<span class="badge bg-info">Đang xử lý</span>',
        'SHIPPED': '<span class="badge bg-primary">Đã giao hàng</span>',
        'DELIVERED': '<span class="badge bg-success">Đã nhận hàng</span>',
        'CANCELLED': '<span class="badge bg-danger">Đã hủy</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">' + status + '</span>';
}

// Calculate revenue by day (last 30 days)
function calculateDailyRevenue() {
    const dailyRevenue = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyRevenue[dateKey] = 0;
    }

    // Calculate revenue from paid/completed orders
    orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0];
        
        if ((order.paymentStatus === 'PAID' || order.status === 'DELIVERED' || order.status === 'COMPLETED') 
            && dailyRevenue.hasOwnProperty(dateKey)) {
            dailyRevenue[dateKey] += (order.totalAmount || 0);
        }
    });

    return dailyRevenue;
}

// Calculate revenue by month (last 12 months)
function calculateMonthlyRevenue() {
    const monthlyRevenue = {};
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
        monthlyRevenue[monthKey] = 0;
    }

    // Calculate revenue from paid/completed orders
    orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = orderDate.toISOString().substring(0, 7);
        
        if ((order.paymentStatus === 'PAID' || order.status === 'DELIVERED' || order.status === 'COMPLETED') 
            && monthlyRevenue.hasOwnProperty(monthKey)) {
            monthlyRevenue[monthKey] += (order.totalAmount || 0);
        }
    });

    return monthlyRevenue;
}

// Render revenue charts
function renderRevenueCharts() {
    if (orders.length === 0) return;
    
    const dailyRevenue = calculateDailyRevenue();
    const monthlyRevenue = calculateMonthlyRevenue();

    // Daily revenue chart
    renderDailyRevenueChart(dailyRevenue);
    
    // Monthly revenue chart
    renderMonthlyRevenueChart(monthlyRevenue);
}

// Render daily revenue chart
function renderDailyRevenueChart(dailyRevenue) {
    const ctx = document.getElementById('dailyRevenueChart');
    if (!ctx) return;

    const labels = Object.keys(dailyRevenue).map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const data = Object.values(dailyRevenue);

    // Destroy existing chart if exists
    if (dailyRevenueChart) {
        dailyRevenueChart.destroy();
    }

    dailyRevenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Doanh thu: ' + formatPrice(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatPriceShort(value);
                        }
                    }
                }
            }
        }
    });
}

// Render monthly revenue chart
function renderMonthlyRevenueChart(monthlyRevenue) {
    const ctx = document.getElementById('monthlyRevenueChart');
    if (!ctx) return;

    const labels = Object.keys(monthlyRevenue).map(month => {
        const [year, monthNum] = month.split('-');
        return `Tháng ${parseInt(monthNum)}/${year}`;
    });
    const data = Object.values(monthlyRevenue);

    // Destroy existing chart if exists
    if (monthlyRevenueChart) {
        monthlyRevenueChart.destroy();
    }

    monthlyRevenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: data,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Doanh thu: ' + formatPrice(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatPriceShort(value);
                        }
                    }
                }
            }
        }
    });
}

// Render low stock products (quantity <= 10)
function renderLowStockProducts() {
    const tbody = document.getElementById('lowStockProductsBody');
    if (!tbody) return;

    const lowStockProducts = products
        .filter(p => (p.stockQuantity || 0) <= 10 && (p.stockQuantity || 0) >= 0)
        .sort((a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0));

    if (!lowStockProducts || lowStockProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Không có sản phẩm nào sắp hết hàng</td></tr>';
        return;
    }

    tbody.innerHTML = lowStockProducts.map(product => {
        const stockQuantity = product.stockQuantity || 0;
        const stockBadge = stockQuantity === 0 ? 
            '<span class="badge bg-danger">Hết hàng</span>' : 
            stockQuantity <= 5 ? 
            '<span class="badge bg-warning">Sắp hết</span>' : 
            '<span class="badge bg-info">Sắp hết</span>';
        
        return `
        <tr>
            <td>
                ${product.imageUrl ? 
                    `<img src="${product.imageUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : 
                    '<span class="text-muted">No image</span>'
                }
            </td>
            <td>${product.name || ''}</td>
            <td class="text-center">${stockBadge} <strong>${stockQuantity}</strong></td>
            <td class="text-end">${formatPrice(product.price || 0)}</td>
        </tr>
    `;
    }).join('');
}

// Format price to VNĐ
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Format price short for charts (e.g., 1.5M, 500K)
function formatPriceShort(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(0) + 'K';
    }
    return price.toString();
}

// Show alert
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


// Helper function for logout
function handleLogout() {
    api.logout().then(() => {
        window.location.href = '/auth/login.html';
    }).catch(error => {
        console.error('Logout error:', error);
        window.location.href = '/auth/login.html';
    });
}

