// Admin Products Management
let products = [];
let categories = [];
let currentPage = 0;
let totalPages = 0;
let totalElements = 0;
const pageSize = 10;

let currentFilters = {
    categoryId: '',
    sort: 'id',
    direction: 'asc'
};

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== DOMContentLoaded FIRED ===');
    
    // Set default values for sort dropdowns
    const sortBy = document.getElementById('sortBy');
    const sortDirection = document.getElementById('sortDirection');
    if (sortBy) sortBy.value = 'id';
    if (sortDirection) sortDirection.value = 'asc';
    
    // Load data first
    await loadCategories();
    await loadProducts();
    
    // Setup export buttons - Attach ONLY ONCE, directly to buttons
    setupExportButtons();
});

// Export functions - called from onclick in HTML
window.exportToExcel = async function() {
    console.log('=== exportToExcel CALLED ===');
    
    try {
        // Close dropdown
        const dropdownBtn = document.getElementById('exportDropdownBtn');
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown && dropdownBtn) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
            if (dropdown) dropdown.hide();
        }
        
        // Fetch file with credentials
        console.log('Fetching /api/products/export/excel');
        const response = await fetch('/api/products/export/excel', {
            method: 'GET',
            credentials: 'include' // Important: include cookies for JWT
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
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

window.exportToPDF = async function() {
    console.log('=== exportToPDF CALLED ===');
    
    try {
        // Close dropdown
        const dropdownBtn = document.getElementById('exportDropdownBtn');
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown && dropdownBtn) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
            if (dropdown) dropdown.hide();
        }
        
        // Fetch file with credentials
        console.log('Fetching /api/products/export/pdf');
        const response = await fetch('/api/products/export/pdf', {
            method: 'GET',
            credentials: 'include' // Important: include cookies for JWT
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
   
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.pdf`;
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

// Setup export button event listeners - Simple backend API calls (backup)
function setupExportButtons() {
    console.log('=== setupExportButtons CALLED ===');
    // Functions are now global and called from onclick in HTML
    console.log('Export functions are available globally');
}

// Load products
async function loadProducts() {
    try {
        // Build query parameters
        const params = {
            page: currentPage, 
            size: pageSize,
            includeInactive: true,
            sort: currentFilters.sort,
            direction: currentFilters.direction
        };
        
        // Add category filter if selected
        if (currentFilters.categoryId) {
            params.categoryId = currentFilters.categoryId;
        }
        
        const response = await api.getProducts(params);
        console.log('Admin Products API response:', response);
        
        // Handle Page object response (from paginated API)
        if (response && response.content && Array.isArray(response.content)) {
            products = response.content;
            totalPages = response.totalPages || 0;
            totalElements = response.totalElements || 0;
        } else if (Array.isArray(response)) {
            products = response;
            totalPages = 1;
            totalElements = response.length;
        } else {
            products = [];
            totalPages = 0;
            totalElements = 0;
        }
        
        renderProductsTable();
        renderPagination();
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Lỗi khi tải danh sách sản phẩm: ' + (error.message || 'Unknown error'), 'error');
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Lỗi khi tải dữ liệu</td></tr>';
        }
    }
}

// Load categories for select
async function loadCategories() {
    try {
        categories = await api.getCategories();
        
        // Populate category select in modal
        const select = document.getElementById('productCategory');
        if (select) {
            select.innerHTML = '<option value="">Chọn danh mục</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
        
        // Populate category filter dropdown
        const filterSelect = document.getElementById('categoryFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Tất cả danh mục</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                filterSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Apply filters and sorting
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const sortDirection = document.getElementById('sortDirection');
    
    currentFilters.categoryId = categoryFilter ? categoryFilter.value : '';
    currentFilters.sort = sortBy ? sortBy.value : 'id';
    currentFilters.direction = sortDirection ? sortDirection.value : 'asc';
    
    currentPage = 0; // Reset to first page
    loadProducts();
}

// Reset filters
function resetFilters() {
    currentFilters = {
        categoryId: '',
        sort: 'id',
        direction: 'asc'
    };
    
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const sortDirection = document.getElementById('sortDirection');
    
    if (categoryFilter) categoryFilter.value = '';
    if (sortBy) sortBy.value = 'id';
    if (sortDirection) sortDirection.value = 'asc';
    
    currentPage = 0; // Reset to first page
    loadProducts();
}

// Render products table
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Không có sản phẩm nào</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        // Handle isActive field - check both isActive and active
        let isActiveValue = product.isActive !== undefined ? product.isActive : (product.active !== undefined ? product.active : true);
        let isProductActive = false;
        if (typeof isActiveValue === 'boolean') {
            isProductActive = isActiveValue;
        } else if (typeof isActiveValue === 'string') {
            isProductActive = isActiveValue === 'true' || isActiveValue === '1';
        } else if (typeof isActiveValue === 'number') {
            isProductActive = isActiveValue === 1;
        } else {
            isProductActive = isActiveValue !== false && isActiveValue !== 'false' && isActiveValue !== 0 && isActiveValue !== '0';
        }
        
        const statusBadge = isProductActive ? 
            '<span class="badge bg-success">Hoạt động</span>' : 
            '<span class="badge bg-secondary">Ngưng hoạt động</span>';
        
        return `
        <tr>
            <td>${product.id}</td>
            <td>
                ${product.imageUrl ? 
                    `<img src="${product.imageUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : 
                    '<span class="text-muted">No image</span>'
                }
            </td>
            <td>${product.name || ''}</td>
            <td class="text-end">${formatPrice(product.price || 0)}</td>
            <td class="text-center">${product.stockQuantity || product.stock || 0}</td>
            <td>${product.categoryName || 'N/A'}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-primary me-1" onclick="editProduct(${product.id})" title="Sửa sản phẩm">
                        <i class="bi bi-pencil"></i> Sửa
                    </button>
                    <button class="btn btn-sm ${isProductActive ? 'btn-warning' : 'btn-success'} me-1" 
                            onclick="toggleProductStatus(${product.id}, ${!isProductActive})"
                            title="${isProductActive ? 'Ngưng hoạt động' : 'Kích hoạt'}">
                        <i class="bi bi-${isProductActive ? 'pause-circle' : 'play-circle'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteProduct(${product.id})" title="Xóa sản phẩm">
                        <i class="bi bi-trash"></i> Xóa
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// Open product modal for adding
function openProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Thêm sản phẩm';
    clearImagePreview();
    hideCurrentImage();
}

// Preview image function
function previewImage(input) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
            hideCurrentImage(); // Hide current image when new image is selected
        };
        reader.readAsDataURL(file);
    } else {
        clearImagePreview();
    }
}

// Clear image preview
function clearImagePreview() {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('productImage');
    
    previewContainer.style.display = 'none';
    preview.src = '';
    if (fileInput) {
        fileInput.value = '';
    }
}

// Show current image (when editing)
function showCurrentImage(imageUrl) {
    const container = document.getElementById('currentImageContainer');
    const img = document.getElementById('currentImage');
    if (imageUrl) {
        img.src = imageUrl;
        container.style.display = 'block';
    } else {
        hideCurrentImage();
    }
}

// Hide current image
function hideCurrentImage() {
    const container = document.getElementById('currentImageContainer');
    container.style.display = 'none';
}

// Edit product
async function editProduct(productId) {
    try {
        const product = await api.getProduct(productId);
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productStock').value = product.stockQuantity || product.stock || '';
        document.getElementById('productCategory').value = product.categoryId || '';
        
        // Set created_at if available
        if (product.createdAt) {
            const date = new Date(product.createdAt);
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            document.getElementById('productCreatedAt').value = localDate.toISOString().slice(0, 16);
        } else {
            document.getElementById('productCreatedAt').value = '';
        }
        
        // Show current image if exists
        if (product.imageUrl) {
            showCurrentImage(product.imageUrl);
        } else {
            hideCurrentImage();
        }
        
        // Clear preview when editing
        clearImagePreview();
        
        document.getElementById('productModalTitle').textContent = 'Sửa sản phẩm';
        new bootstrap.Modal(document.getElementById('productModal')).show();
    } catch (error) {
        console.error('Error loading product:', error);
        showAlert('Lỗi khi tải thông tin sản phẩm', 'error');
    }
}

// Save product (create or update)
async function saveProduct() {
    try {
        const productId = document.getElementById('productId').value;
        const formData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stockQuantity: parseInt(document.getElementById('productStock').value),
            categoryId: parseInt(document.getElementById('productCategory').value)
        };

        // Add created_at if provided (only for create, not update)
        if (!productId) {
            const createdAt = document.getElementById('productCreatedAt').value;
            if (createdAt) {
                // Convert datetime-local format to ISO string for backend
                formData.createdAt = new Date(createdAt).toISOString();
            }
        }

        let result;
        if (productId) {
            result = await api.updateProduct(productId, formData);
            showAlert('Cập nhật sản phẩm thành công!', 'success');
        } else {
            result = await api.createProduct(formData);
            showAlert('Tạo sản phẩm thành công!', 'success');
        }

        // Upload image if available
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            try {
                // Validate file type
                if (!imageFile.type.startsWith('image/')) {
                    showAlert('File phải là hình ảnh!', 'error');
                    return;
                }

                // Validate file size (10MB)
                if (imageFile.size > 10 * 1024 * 1024) {
                    showAlert('Kích thước file phải nhỏ hơn 10MB!', 'error');
                    return;
                }

                const formDataImg = new FormData();
                formDataImg.append('file', imageFile); // API expects 'file' parameter
                const productIdToUpload = productId || result.id;
                await api.uploadProductImage(productIdToUpload, formDataImg);
                showAlert('Upload ảnh sản phẩm thành công!', 'success');
            } catch (error) {
                console.error('Upload image error:', error);
                showAlert('Lỗi khi upload ảnh: ' + (error.message || 'Upload failed'), 'error');
                // Don't return here, continue to reload products
            }
        }

        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        loadProducts();
        document.getElementById('productForm').reset();
    } catch (error) {
        console.error('Error saving product:', error);
        showAlert('Lỗi khi lưu sản phẩm: ' + error.message, 'error');
    }
}

// Delete product
async function confirmDeleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        return;
    }

    try {
        await api.deleteProduct(productId);
        showAlert('Xóa sản phẩm thành công!', 'success');
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('Lỗi khi xóa sản phẩm: ' + error.message, 'error');
    }
}

// Format price to VNĐ
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Toggle product status
async function toggleProductStatus(productId, isActive) {
    if (!confirm(`Bạn có chắc chắn muốn ${isActive ? 'kích hoạt' : 'ngưng hoạt động'} sản phẩm này?`)) {
        return;
    }

    try {
        await api.toggleProductStatus(productId);
        showAlert(`Đã ${isActive ? 'kích hoạt' : 'ngưng hoạt động'} sản phẩm thành công!`, 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error toggling product status:', error);
        showAlert('Lỗi khi cập nhật trạng thái sản phẩm: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Export functions removed - now handled by backend API

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

// Render pagination
function renderPagination() {
    const paginationEl = document.getElementById('adminPagination');
    const showingCountEl = document.getElementById('showingCount');
    const totalCountEl = document.getElementById('totalCount');
    
    if (showingCountEl) showingCountEl.textContent = products.length;
    if (totalCountEl) totalCountEl.textContent = totalElements;
    
    if (!paginationEl) return;
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Prev button
    const prevDisabled = currentPage === 0 ? 'disabled' : '';
    html += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Trước</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 0; i < totalPages; i++) {
        const active = currentPage === i ? 'active' : '';
        html += `
            <li class="page-item ${active}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i + 1}</a>
            </li>
        `;
    }
    
    // Next button
    const nextDisabled = currentPage >= totalPages - 1 ? 'disabled' : '';
    html += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Sau</a>
        </li>
    `;
    
    paginationEl.innerHTML = html;
}

function changePage(page) {
    if (page < 0 || page >= totalPages) return;
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

