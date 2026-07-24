// Admin Vouchers Management
let vouchers = [];
let categories = [];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Load data first
    await loadCategories();
    await loadVouchers();
});

// Load categories
async function loadCategories() {
    try {
        categories = await api.getCategories();
        renderCategoryOptions();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render category options
function renderCategoryOptions() {
    const categorySelect = document.getElementById('voucherCategory');
    if (!categorySelect) return;
    
    categorySelect.innerHTML = '<option value="">Tất cả danh mục</option>';
    if (categories && categories.length > 0) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
}

// Load vouchers
async function loadVouchers() {
    try {
        vouchers = await api.getAllVouchers();
        renderVouchersTable();
    } catch (error) {
        console.error('Error loading vouchers:', error);
        showAlert('Lỗi khi tải danh sách voucher', 'error');
    }
}

// Render vouchers table
function renderVouchersTable() {
    const tbody = document.getElementById('vouchersTableBody');
    if (!tbody) return;

    if (!vouchers || vouchers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">Không có voucher nào</td></tr>';
        return;
    }

    tbody.innerHTML = vouchers.map(voucher => {
        const typeText = voucher.type === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền';
        const valueText = voucher.type === 'PERCENTAGE' ? 
            `${voucher.value}%` : 
            formatPrice(voucher.value || 0);
        const statusBadge = voucher.isActive ? 
            '<span class="badge bg-success">Hoạt động</span>' : 
            '<span class="badge bg-secondary">Đã vô hiệu</span>';
        
        const startDate = voucher.startDate ? new Date(voucher.startDate).toLocaleDateString('vi-VN') : '-';
        const endDate = voucher.endDate ? new Date(voucher.endDate).toLocaleDateString('vi-VN') : '-';
        const minOrderText = voucher.minOrder ? formatPrice(voucher.minOrder) : '-';
        const categoryText = voucher.categoryName || 'Tất cả';
        
        return `
        <tr>
            <td>${voucher.id}</td>
            <td><strong>${voucher.code || '-'}</strong></td>
            <td>${typeText}</td>
            <td>${valueText}</td>
            <td>${minOrderText}</td>
            <td>${categoryText}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editVoucher(${voucher.id})">
                    <i class="bi bi-pencil"></i> Sửa
                </button>
                ${voucher.isActive ? `
                    <button class="btn btn-sm btn-warning me-1" onclick="disableVoucher(${voucher.id})">
                        <i class="bi bi-x-circle"></i> Vô hiệu
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteVoucher(${voucher.id})">
                    <i class="bi bi-trash"></i> Xóa
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

// Open voucher modal for adding
function openVoucherModal() {
    document.getElementById('voucherForm').reset();
    document.getElementById('voucherId').value = '';
    document.getElementById('voucherModalTitle').textContent = 'Thêm voucher';
    document.getElementById('voucherActive').checked = true;
    document.getElementById('voucherCategory').value = '';
}

// Edit voucher
async function editVoucher(voucherId) {
    try {
        const voucher = await api.getVoucher(voucherId);
        document.getElementById('voucherId').value = voucher.id;
        document.getElementById('voucherCode').value = voucher.code || '';
        document.getElementById('voucherType').value = voucher.type || '';
        document.getElementById('voucherValue').value = voucher.value || '';
        document.getElementById('minOrderValue').value = voucher.minOrder || '';
        document.getElementById('voucherCategory').value = voucher.categoryId || '';
        
        if (voucher.startDate) {
            // Convert LocalDateTime to date input format (YYYY-MM-DD)
            const startDate = new Date(voucher.startDate);
            document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        }
        if (voucher.endDate) {
            const endDate = new Date(voucher.endDate);
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        }
        
        document.getElementById('voucherActive').checked = voucher.isActive !== false;
        
        document.getElementById('voucherModalTitle').textContent = 'Sửa voucher';
        new bootstrap.Modal(document.getElementById('voucherModal')).show();
    } catch (error) {
        console.error('Error loading voucher:', error);
        showAlert('Lỗi khi tải thông tin voucher', 'error');
    }
}

// Save voucher (create or update)
async function saveVoucher() {
    try {
        const voucherId = document.getElementById('voucherId').value;
        const code = document.getElementById('voucherCode').value.trim();
        const type = document.getElementById('voucherType').value;
        const value = parseFloat(document.getElementById('voucherValue').value);
        const minOrderValue = document.getElementById('minOrderValue').value;
        const categoryId = document.getElementById('voucherCategory').value;
        const startDateStr = document.getElementById('startDate').value;
        const endDateStr = document.getElementById('endDate').value;
        const isActive = document.getElementById('voucherActive').checked;

        // Validate
        if (!code) {
            showAlert('Vui lòng nhập mã voucher', 'error');
            return;
        }
        if (!type) {
            showAlert('Vui lòng chọn loại giảm giá', 'error');
            return;
        }
        if (isNaN(value) || value <= 0) {
            showAlert('Vui lòng nhập giá trị hợp lệ', 'error');
            return;
        }
        if (!startDateStr || !endDateStr) {
            showAlert('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 'error');
            return;
        }

        // Convert date strings to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
        const startDate = startDateStr ? `${startDateStr}T00:00:00` : null;
        const endDate = endDateStr ? `${endDateStr}T23:59:59` : null;

        const formData = {
            code: code,
            type: type,
            value: value,
            minOrder: minOrderValue ? parseFloat(minOrderValue) : null,
            categoryId: categoryId ? parseInt(categoryId) : null,
            startDate: startDate,
            endDate: endDate,
            isActive: isActive
        };

        if (voucherId) {
            await api.updateVoucher(voucherId, formData);
            showAlert('Cập nhật voucher thành công!', 'success');
        } else {
            await api.createVoucher(formData);
            showAlert('Tạo voucher thành công!', 'success');
        }

        bootstrap.Modal.getInstance(document.getElementById('voucherModal')).hide();
        loadVouchers();
        document.getElementById('voucherForm').reset();
        document.getElementById('voucherId').value = '';
    } catch (error) {
        console.error('Error saving voucher:', error);
        const errorMessage = error.message || 'Có lỗi xảy ra';
        showAlert('Lỗi khi lưu voucher: ' + errorMessage, 'error');
    }
}

// Disable voucher
async function disableVoucher(voucherId) {
    if (!confirm('Bạn có chắc chắn muốn vô hiệu hóa voucher này?')) {
        return;
    }

    try {
        await api.disableVoucher(voucherId);
        showAlert('Vô hiệu hóa voucher thành công!', 'success');
        loadVouchers();
    } catch (error) {
        console.error('Error disabling voucher:', error);
        showAlert('Lỗi khi vô hiệu hóa voucher: ' + error.message, 'error');
    }
}

// Delete voucher
async function confirmDeleteVoucher(voucherId) {
    if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
        return;
    }

    try {
        await api.deleteVoucher(voucherId);
        showAlert('Xóa voucher thành công!', 'success');
        loadVouchers();
    } catch (error) {
        console.error('Error deleting voucher:', error);
        showAlert('Lỗi khi xóa voucher: ' + error.message, 'error');
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

