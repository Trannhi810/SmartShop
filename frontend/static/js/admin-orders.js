// Admin Orders Management
let orders = [];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Load data first
    await loadOrders();
    
    // Setup export buttons
    setupExportButtons();
    
    // Filter listeners
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    
    if (searchInput) searchInput.addEventListener('input', filterOrders);
    if (statusFilter) statusFilter.addEventListener('change', filterOrders);
    if (fromDate) fromDate.addEventListener('change', filterOrders);
    if (toDate) toDate.addEventListener('change', filterOrders);
});

// Export functions - called from onclick in HTML
window.exportOrderExcel = async function() {
    console.log('=== exportOrderExcel CALLED ===');
    
    try {
        // Close dropdown
        const dropdownBtn = document.querySelector('[data-bs-toggle="dropdown"]');
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown && dropdownBtn) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
            if (dropdown) dropdown.hide();
        }
        
        // Fetch file with credentials
        console.log('Fetching /api/orders/export/excel');
        const response = await fetch('/api/orders/export/excel', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Excel file downloaded successfully');
        showAlert('Xuất Excel thành công!', 'success');
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showAlert('Lỗi khi xuất Excel: ' + error.message, 'error');
    }
};

window.exportOrderPDF = async function() {
    console.log('=== exportOrderPDF CALLED ===');
    
    try {
        // Close dropdown
        const dropdownBtn = document.querySelector('[data-bs-toggle="dropdown"]');
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown && dropdownBtn) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
            if (dropdown) dropdown.hide();
        }
        
        // Fetch file with credentials
        console.log('Fetching /api/orders/export/pdf');
        const response = await fetch('/api/orders/export/pdf', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('PDF file downloaded successfully');
        showAlert('Xuất PDF thành công!', 'success');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showAlert('Lỗi khi xuất PDF: ' + error.message, 'error');
    }
};

// Setup export button event listeners
function setupExportButtons() {
    console.log('=== setupExportButtons CALLED ===');
    const excelBtn = document.getElementById('exportExcelBtn');
    const pdfBtn = document.getElementById('exportPdfBtn');

    if (excelBtn) {
        excelBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            await exportOrderExcel();
        });
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            await exportOrderPDF();
        });
    }
    console.log('Export button listeners attached');
}

// Load orders
async function loadOrders() {
    try {
        const response = await api.getAllOrders();
        // Handle ApiResponse wrapper - response.data contains the list
        orders = response.data || response || [];
        console.log('Loaded orders:', orders);
        
        // Update stats overview
        updateStats(orders);
        
        renderOrdersTable(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Lỗi khi tải danh sách đơn hàng: ' + (error.message || 'Unknown error'), 'error');
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Lỗi khi tải dữ liệu</td></tr>';
        }
    }
}

// Update stats overview
function updateStats(ordersToStats) {
    const totalOrders = ordersToStats.length;
    const totalRevenue = ordersToStats
        .filter(o => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = ordersToStats.filter(o => o.status === 'PENDING').length;
    const shippingOrders = ordersToStats.filter(o => o.status === 'SHIPPING' || o.status === 'SHIPPED').length;

    const totalOrdersEl = document.getElementById('totalOrdersStat');
    const totalRevenueEl = document.getElementById('totalRevenueStat');
    const pendingOrdersEl = document.getElementById('pendingOrdersStat');
    const shippingOrdersEl = document.getElementById('shippingOrdersStat');

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalRevenueEl) totalRevenueEl.textContent = formatPrice(totalRevenue);
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
    if (shippingOrdersEl) shippingOrdersEl.textContent = shippingOrders;
}

// Filter orders
function filterOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let filtered = orders.filter(order => {
        const matchSearch = !searchTerm || 
            (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) ||
            (order.customerName && order.customerName.toLowerCase().includes(searchTerm));

        const matchStatus = !statusFilter || order.status === statusFilter;

        let matchDate = true;
        if (fromDate || toDate) {
            const orderDate = new Date(order.createdAt);
            if (fromDate) {
                const from = new Date(fromDate);
                if (orderDate < from) matchDate = false;
            }
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                if (orderDate > to) matchDate = false;
            }
        }

        return matchSearch && matchStatus && matchDate;
    });

    renderOrdersTable(filtered);
}

// Render orders table
function renderOrdersTable(ordersToRender) {
    const tbody = document.getElementById('ordersTableBody');
    const countLabel = document.getElementById('orderCountLabel');
    if (!tbody) return;

    if (countLabel) {
        countLabel.textContent = `Hiển thị ${ordersToRender.length} đơn hàng`;
    }

    if (!ordersToRender || ordersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted">Không có đơn hàng nào khớp với bộ lọc</td></tr>';
        return;
    }

    tbody.innerHTML = ordersToRender.map(order => {
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
            <td class="ps-4 text-muted">#${order.id}</td>
            <td><span class="fw-bold text-primary">${order.orderNumber || '-'}</span></td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <i class="bi bi-person text-secondary"></i>
                    </div>
                    <div>
                        <div class="fw-medium">${order.customerName || 'Khách hàng lẻ'}</div>
                        <div class="small text-muted">${order.customerEmail || ''}</div>
                    </div>
                </div>
            </td>
            <td class="fw-bold">${formatPrice(totalAmount)}</td>
            <td>${statusBadge}</td>
            <td class="text-muted small">${createdAt}</td>
            <td class="pe-4 text-end">
                <div class="d-flex justify-content-end gap-2">
                    <button class="button button--ghost button--small" onclick="viewOrderDetail(${order.id})" title="Xem chi tiết">
                        <i class="bi bi-eye"></i> Chi tiết
                    </button>
                    ${order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'REFUNDED' ? `
                        <div class="dropdown">
                            <button class="button button--primary button--small dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Xử lý
                            </button>
                            <ul class="dropdown-menu shadow-sm border-0">
                                ${getStatusOptions(order.id, order.status)}
                            </ul>
                        </div>
                    ` : `
                        <span class="admin-chip p-1 px-2 border-0" style="background: #f1f5f9; color: #64748b;">
                            <i class="bi bi-check2-all me-1"></i> Đóng
                        </span>
                    `}
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="admin-chip" style="background: #fef3c7; color: #92400e;"><i class="bi bi-clock me-1"></i> Chờ xác nhận</span>',
        'CONFIRMED': '<span class="admin-chip" style="background: #e0f2fe; color: #075985;"><i class="bi bi-check-circle me-1"></i> Đã xác nhận</span>',
        'PROCESSING': '<span class="admin-chip" style="background: #e0e7ff; color: #3730a3;"><i class="bi bi-gear me-1"></i> Đang xử lý</span>',
        'SHIPPING': '<span class="admin-chip" style="background: #fdf2f8; color: #9d174d;"><i class="bi bi-truck me-1"></i> Đang giao</span>',
        'SHIPPED': '<span class="admin-chip" style="background: #fdf2f8; color: #9d174d;"><i class="bi bi-truck me-1"></i> Đang giao</span>',
        'DELIVERED': '<span class="admin-chip" style="background: #dcfce7; color: #166534;"><i class="bi bi-box-seam me-1"></i> Đã giao hàng</span>',
        'COMPLETED': '<span class="admin-chip" style="background: #ecfdf5; color: #065f46;"><i class="bi bi-patch-check me-1"></i> Hoàn thành</span>',
        'CANCELLED': '<span class="admin-chip" style="background: #fee2e2; color: #991b1b;"><i class="bi bi-x-circle me-1"></i> Đã hủy</span>',
        'REFUNDED': '<span class="admin-chip" style="background: #f3f4f6; color: #374151;"><i class="bi bi-arrow-counterclockwise me-1"></i> Đã hoàn tiền</span>'
    };
    return badges[status] || `<span class="admin-chip">${status}</span>`;
}

// Get status options for dropdown
function getStatusOptions(orderId, currentStatus) {
    const options = {
        'PENDING': [
            { val: 'PROCESSING', label: '⚙️ Bắt đầu xử lý' },
            { val: 'CANCELLED', label: '❌ Hủy đơn hàng' }
        ],
        'CONFIRMED': [
            { val: 'PROCESSING', label: '⚙️ Bắt đầu xử lý' },
            { val: 'CANCELLED', label: '❌ Hủy đơn hàng' }
        ],
        'PROCESSING': [
            { val: 'SHIPPING', label: '🚚 Giao hàng' },
            { val: 'CANCELLED', label: '❌ Hủy đơn hàng' }
        ],
        'SHIPPING': [
            { val: 'DELIVERED', label: '✅ Đã giao hàng' }
        ],
        'SHIPPED': [
            { val: 'DELIVERED', label: '✅ Đã giao hàng' }
        ],
        'DELIVERED': [
            { val: 'COMPLETED', label: '🏁 Hoàn thành' }
        ]
    };
    
    const currentOptions = options[currentStatus] || [];
    return currentOptions.map(opt => `
        <li><a class="dropdown-item py-2" href="javascript:void(0)" onclick="updateOrderStatus(${orderId}, '${opt.val}')">${opt.label}</a></li>
    `).join('');
}

// View order detail
async function viewOrderDetail(orderId) {
    try {
        const response = await api.getOrderDetail(orderId);
        // Handle ApiResponse wrapper if needed
        const order = response.data || response;
        
        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }
        
        const modalBody = document.getElementById('orderDetailBody');
        
        // Get customer info from order or items
        const customerName = order.customerName || 'N/A';
        const customerEmail = order.customerEmail || 'N/A';
        const customerPhone = order.customerPhone || 'N/A';
        
        modalBody.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light h-100">
                        <h6 class="text-uppercase fw-bold text-muted small mb-3">Thông tin đơn hàng</h6>
                        <div class="mb-2"><strong>Mã đơn:</strong> <span class="text-primary fw-bold">${order.orderNumber || '-'}</span></div>
                        <div class="mb-2"><strong>Ngày đặt:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</div>
                        <div class="mb-0"><strong>Trạng thái:</strong> ${getStatusBadge(order.status || 'PENDING')}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light h-100">
                        <h6 class="text-uppercase fw-bold text-muted small mb-3">Thông tin khách hàng</h6>
                        <div class="mb-2"><strong>Họ tên:</strong> ${customerName}</div>
                        <div class="mb-2"><strong>SĐT:</strong> ${customerPhone}</div>
                        <div class="mb-0"><strong>Email:</strong> ${customerEmail}</div>
                    </div>
                </div>
                <div class="col-md-12">
                    <div class="p-3 rounded-3 border">
                        <h6 class="text-uppercase fw-bold text-muted small mb-2">Địa chỉ giao hàng</h6>
                        <div class="text-dark">${order.shippingAddress || '-'}</div>
                    </div>
                </div>
            </div>

            ${order.voucherCode ? `
                <div class="mt-4 p-3 rounded-3 border-start border-4 border-info bg-info bg-opacity-10">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-ticket-perforated fs-4 me-3 text-info"></i>
                        <div>
                            <div class="fw-bold text-info">Voucher áp dụng: ${order.voucherCode}</div>
                            <div class="small">Đã giảm ${formatPrice(order.voucherDiscount || 0)} vào tổng đơn hàng</div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <h6 class="mt-4 fw-bold mb-3 d-flex align-items-center">
                <i class="bi bi-box me-2"></i> Danh sách sản phẩm
            </h6>
            <div class="table-responsive">
                <table class="table table-hover align-middle border-top">
                    <thead class="bg-light">
                        <tr class="small text-uppercase text-muted">
                            <th class="py-3">Sản phẩm</th>
                            <th class="text-center py-3">SL</th>
                            <th class="text-end py-3">Đơn giá</th>
                            <th class="text-end py-3">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items && order.items.length > 0 ? order.items.map(item => `
                            <tr>
                                <td class="py-3">
                                    <div class="fw-medium">${item.productName || 'N/A'}</div>
                                    ${item.variantName ? `<div class="small text-muted">${item.variantName}</div>` : ''}
                                </td>
                                <td class="text-center">${item.quantity || 0}</td>
                                <td class="text-end text-muted">${formatPrice(item.price || 0)}</td>
                                <td class="text-end fw-bold">${formatPrice(item.lineTotal || (item.price || 0) * (item.quantity || 0))}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" class="text-center py-4">Không có sản phẩm</td></tr>'}
                    </tbody>
                    <tfoot class="bg-light bg-opacity-50">
                        <tr>
                            <td colspan="3" class="text-end py-2 text-muted">Tạm tính:</td>
                            <td class="text-end py-2">${formatPrice((order.items || []).reduce((sum, item) => sum + (item.lineTotal || (item.price || 0) * (item.quantity || 0)), 0))}</td>
                        </tr>
                        ${order.voucherDiscount && order.voucherDiscount > 0 ? `
                            <tr>
                                <td colspan="3" class="text-end py-2 text-muted">Giảm giá:</td>
                                <td class="text-end py-2 text-danger">-${formatPrice(order.voucherDiscount || 0)}</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td colspan="3" class="text-end py-2 text-muted">Phí vận chuyển:</td>
                            <td class="text-end py-2">${formatPrice(order.shippingFee || 0)}</td>
                        </tr>
                        <tr class="fs-5">
                            <td colspan="3" class="text-end py-3 fw-bold">Tổng cộng:</td>
                            <td class="text-end py-3 fw-bold text-primary">${formatPrice(
                                (order.items || []).reduce((sum, item) => sum + (item.lineTotal || (item.price || 0) * (item.quantity || 0)), 0) 
                                - (order.voucherDiscount || 0) 
                                + (order.shippingFee || 0)
                            )}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            ${order.statusHistory && order.statusHistory.length > 0 ? `
                <h6 class="mt-4 fw-bold mb-3 d-flex align-items-center">
                    <i class="bi bi-clock-history me-2"></i> Lịch sử đơn hàng
                </h6>
                <div class="ms-2 ps-4 border-start position-relative">
                    ${order.statusHistory.map((history, idx) => `
                        <div class="mb-3 position-relative">
                            <div class="position-absolute start-0 top-0 translate-middle-x bg-white p-1" style="margin-left: -25px;">
                                <div class="rounded-circle bg-primary" style="width: 10px; height: 10px;"></div>
                            </div>
                            <div class="small fw-bold text-primary">${history.newStatus || '-'}</div>
                            <div class="text-muted small">${history.createdAt ? new Date(history.createdAt).toLocaleString('vi-VN') : '-'}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        new bootstrap.Modal(document.getElementById('orderDetailModal')).show();
    } catch (error) {
        console.error('Error loading order detail:', error);
        showAlert('Lỗi khi tải chi tiết đơn hàng: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    
    // Get status display name
    const statusNames = {
        'PENDING': 'Chờ xử lý',
        'PROCESSING': 'Đang xử lý',
        'SHIPPED': 'Đã giao hàng',
        'DELIVERED': 'Đã nhận hàng',
        'CANCELLED': 'Đã hủy'
    };
    const statusDisplay = statusNames[newStatus] || newStatus;
    
    if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng sang "${statusDisplay}"?`)) {
        // Reset select to current value
        const select = event?.target;
        if (select) select.value = '';
        return;
    }

    try {
        await api.updateOrderStatus(orderId, newStatus);
        showAlert('Cập nhật trạng thái đơn hàng thành công!', 'success');
        await loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showAlert('Lỗi khi cập nhật trạng thái đơn hàng: ' + (error.message || 'Unknown error'), 'error');
        // Reset select on error
        const select = event?.target;
        if (select) select.value = '';
    }
}

// Format price to VNĐ
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Show alert
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

