// Admin Categories Management
let categories = [];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Load data first
    await loadCategories();
    
    // Setup export buttons
    setupExportButtons();
});

// Export functions - called from onclick in HTML
window.exportCategoryExcel = async function() {
    console.log('=== exportCategoryExcel CALLED ===');
    
    try {
        // Close dropdown
        const dropdownBtn = document.querySelector('[data-bs-toggle="dropdown"]');
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown && dropdownBtn) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
            if (dropdown) dropdown.hide();
        }
        
        // Fetch file with credentials
        console.log('Fetching /api/categories/export/excel');
        const response = await fetch('/api/categories/export/excel', {
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
        a.download = `categories_${new Date().toISOString().split('T')[0]}.xlsx`;
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

window.exportCategoryPDF = async function() {
    console.log('=== exportCategoryPDF CALLED ===');
    
    try {
        // Close dropdown
        const dropdownBtn = document.querySelector('[data-bs-toggle="dropdown"]');
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown && dropdownBtn) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
            if (dropdown) dropdown.hide();
        }
        
        // Fetch file with credentials
        console.log('Fetching /api/categories/export/pdf');
        const response = await fetch('/api/categories/export/pdf', {
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
        a.download = `categories_${new Date().toISOString().split('T')[0]}.pdf`;
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

// Setup export button event listeners (backup)
function setupExportButtons() {
    console.log('=== setupExportButtons CALLED ===');
    // Functions are now global and called from onclick in HTML
    console.log('Export functions are available globally');
}

// Load categories
async function loadCategories() {
    try {
        categories = await api.getCategories();
        renderCategoriesTable();
    } catch (error) {
        console.error('Error loading categories:', error);
        showAlert('Lỗi khi tải danh sách danh mục', 'error');
    }
}

// Render categories table
function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có danh mục nào</td></tr>';
        return;
    }

    tbody.innerHTML = categories.map(category => `
        <tr>
            <td>${category.id}</td>
            <td>${category.name || ''}</td>
            <td>${category.productCount || 0}</td>
            <td>${category.description || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editCategory(${category.id})">
                    <i class="bi bi-pencil"></i> Sửa
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteCategory(${category.id})">
                    <i class="bi bi-trash"></i> Xóa
                </button>
            </td>
        </tr>
    `).join('');
}

// Open category modal for adding
function openCategoryModal() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Thêm danh mục';
}

// Edit category
async function editCategory(categoryId) {
    try {
        const category = await api.getCategory(categoryId);
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name || '';
        document.getElementById('categoryDescription').value = category.description || '';
        
        document.getElementById('categoryModalTitle').textContent = 'Sửa danh mục';
        new bootstrap.Modal(document.getElementById('categoryModal')).show();
    } catch (error) {
        console.error('Error loading category:', error);
        showAlert('Lỗi khi tải thông tin danh mục', 'error');
    }
}

// Save category (create or update)
async function saveCategory() {
    try {
        const categoryId = document.getElementById('categoryId').value;
        const formData = {
            name: document.getElementById('categoryName').value,
            description: document.getElementById('categoryDescription').value
        };

        if (categoryId) {
            await api.updateCategory(categoryId, formData);
            showAlert('Cập nhật danh mục thành công!', 'success');
        } else {
            await api.createCategory(formData);
            showAlert('Tạo danh mục thành công!', 'success');
        }

        bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
        loadCategories();
        document.getElementById('categoryForm').reset();
    } catch (error) {
        console.error('Error saving category:', error);
        showAlert('Lỗi khi lưu danh mục: ' + error.message, 'error');
    }
}

// Delete category
async function confirmDeleteCategory(categoryId) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
        return;
    }

    try {
        await api.deleteCategory(categoryId);
        showAlert('Xóa danh mục thành công!', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showAlert('Lỗi khi xóa danh mục: ' + error.message, 'error');
    }
}

// Show alert
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.warn('alertContainer not found');
        return;
    }

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

