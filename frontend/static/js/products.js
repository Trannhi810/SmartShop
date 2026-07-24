// Products page functionality
let currentPage = 0;
const pageSize = 12; // Số lượng sản phẩm trên mỗi trang

document.addEventListener('DOMContentLoaded', async () => {
    await updateAuthUI();
    
    // Get search keyword & page from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get('q') || '';
    const pageParam = urlParams.get('page');
    
    if (pageParam && !isNaN(pageParam)) {
        // Giao diện (URL) dùng index bắt đầu từ 1, API nội bộ dùng index bắt đầu từ 0
        currentPage = Math.max(0, parseInt(pageParam) - 1);
    }
    
    // Set search input value if keyword exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchKeyword) {
        searchInput.value = searchKeyword;
    }
    
    // Load products
    await loadProducts();
});

async function loadProducts() {
    // Get search keyword and category from URL
    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('q') || urlParams.get('keyword') || '';
    const categoryId = urlParams.get('category') || urlParams.get('categoryId') || null;

    const params = {
        page: currentPage,
        size: pageSize,
        sort: 'createdAt',
        direction: 'desc'
    };

    // API supports both 'keyword' and 'q' parameter
    if (keyword) {
        params.keyword = keyword;
    }
    
    // Add category filter if provided
    if (categoryId) {
        params.category = categoryId;
        params.categoryId = categoryId; // Support both parameter names
    }

    try {
        console.log('Loading products với params:', params);
        const response = await api.getProducts(params);
        console.log('Products API response:', response);
        
        // Handle paginated response
        let products = [];
        let totalPages = 0;
        
        console.log('API Response data:', response);

        if (response && response.content) {
            products = response.content;
            // Spring Boot 3.x trả về pagination info trong nested object "page"
            // Cấu trúc mới: { content: [...], page: { totalPages, totalElements, size, number } }
            // Cấu trúc cũ: { content: [...], totalPages, totalElements, ... }
            if (response.page) {
                totalPages = response.page.totalPages;
            } else {
                totalPages = response.totalPages;
            }
        } else if (response && response.data) {
            // Some APIs wrap content in data
            products = Array.isArray(response.data) ? response.data : (response.data.content || []);
            totalPages = response.totalPages || response.total_pages || response.data.totalPages || 1;
        } else if (Array.isArray(response)) {
            // Fallback for direct array (calculate mock pages if possible, or default to 1)
            products = response;
            totalPages = 1;
        }

        console.log('Extracted totalPages:', totalPages);
        displayProducts(products);
        
        // Render pagination - ensure we at least show 1 page
        renderPagination(totalPages || 1, currentPage);
    } catch (error) {
        console.error('Error loading products:', error);
        const container = document.getElementById('productsGrid');
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <p style="color: #dc2626;">Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
                    <p style="color: #dc2626; font-size: 0.9rem; margin-top: 8px;">Lỗi: ${error.message || 'Unknown error'}</p>
                </div>
            `;
        }
    }
}


function displayProducts(products) {
    const container = document.getElementById('productsGrid');
    
    // Get search keyword from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get('q') || '';
    
    if (products.length === 0) {
        if (searchKeyword) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>Không tìm thấy sản phẩm nào với từ khóa "${escapeHtml(searchKeyword)}"</p>
                    <a href="/product.html" style="margin-top: 16px; color: var(--color-primary); text-decoration: underline;">Xem tất cả sản phẩm</a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>Không có sản phẩm nào</p>
                </div>
            `;
        }
        return;
    }

    container.innerHTML = products.map(product => {
        // Xử lý image URL - giống như trang chủ
        let imageUrl = product.imageUrl || '';
        const placeholderImage = 'https://via.placeholder.com/300x300/e2e8f0/94a3b8?text=No+Image';
        
        // Nếu imageUrl là null, rỗng, hoặc là example.com thì dùng placeholder
        if (!imageUrl || 
            imageUrl.trim() === '' || 
            imageUrl.includes('example.com') ||
            imageUrl.includes('placeholder')) {
            imageUrl = placeholderImage;
        }
        
        // Làm sạch URL - loại bỏ các ký tự nguy hiểm nhưng giữ nguyên URL hợp lệ
        // Thay thế dấu nháy đơn bằng dấu nháy kép để tránh lỗi CSS
        const safeImageUrl = imageUrl.replace(/'/g, "\\'");
        
        return `
        <a href="/product-detail.html?id=${product.id}" class="product-card">
            <div class="product-card__image" style="background-image: url('${safeImageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>
            <div class="product-card__body">
                <h3 class="product-card__title">${escapeHtml(product.name)}</h3>
                <p class="product-card__description">${escapeHtml((product.description || '').substring(0, 100))}${product.description && product.description.length > 100 ? '...' : ''}</p>
                <p class="product-card__price">${formatPrice(product.price || 0)}</p>
            </div>
        </a>
        `;
    }).join('');
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


async function addToCart(productId, variantId, quantity) {
    const authenticated = await checkAuthStatus();
    if (!authenticated) {
        window.location.href = '/auth/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }

    try {
        await api.addToCart(productId, variantId, quantity);
        // Show success message
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 12px 20px; border-radius: 8px; background: rgba(34, 197, 94, 0.1); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.2);';
        alert.textContent = 'Đã thêm vào giỏ hàng';
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    } catch (error) {
        console.error('Error adding to cart:', error);
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 12px 20px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2);';
        alert.textContent = 'Không thể thêm vào giỏ hàng';
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
}

function renderPagination(totalPages, current) {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;

    // Ẩn pagination nếu chỉ có 1 trang hoặc không có sản phẩm
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    // Tính toán các số trang cần hiển thị
    function getPageNumbers(total, cur) {
        if (total <= 7) {
            // Hiển thị tất cả nếu <= 7 trang
            return Array.from({ length: total }, (_, i) => i);
        }
        // Luôn hiển thị: trang đầu, trang cuối, trang hiện tại, và 1 trang kề 2 bên
        const pages = new Set();
        pages.add(0);                    // Trang đầu
        pages.add(total - 1);            // Trang cuối
        pages.add(cur);                  // Trang hiện tại
        if (cur - 1 >= 0) pages.add(cur - 1);  // Trang trước
        if (cur + 1 < total) pages.add(cur + 1); // Trang sau
        return Array.from(pages).sort((a, b) => a - b);
    }

    const pageNumbers = getPageNumbers(totalPages, current);
    let html = '';

    // Nút Prev
    if (current <= 0) {
        html += `<li class="pagination__item"><span class="pagination__link disabled">&laquo;</span></li>`;
    } else {
        html += `<li class="pagination__item"><a href="javascript:void(0)" class="pagination__link" onclick="changePage(${current - 1})" aria-label="Trang trước">&laquo;</a></li>`;
    }

    // Các số trang (với dấu ... ở giữa nếu cần)
    for (let idx = 0; idx < pageNumbers.length; idx++) {
        const i = pageNumbers[idx];
        // Chèn dấu "..." nếu có khoảng trống
        if (idx > 0 && i - pageNumbers[idx - 1] > 1) {
            html += `<li class="pagination__item"><span class="pagination__link" style="border:none;background:transparent;cursor:default;">...</span></li>`;
        }
        const active = current === i ? 'active' : '';
        html += `<li class="pagination__item"><a href="javascript:void(0)" class="pagination__link ${active}" onclick="changePage(${i})">${i + 1}</a></li>`;
    }

    // Nút Next
    if (current >= totalPages - 1) {
        html += `<li class="pagination__item"><span class="pagination__link disabled">&raquo;</span></li>`;
    } else {
        html += `<li class="pagination__item"><a href="javascript:void(0)" class="pagination__link" onclick="changePage(${current + 1})" aria-label="Trang tiếp">&raquo;</a></li>`;
    }

    paginationEl.innerHTML = html;
}

function changePage(page) {
    const url = new URL(window.location);
    // Giữ nguyên các params hiện tại (q, category...) chỉ thay page
    url.searchParams.set('page', page + 1); // URL dùng index bắt đầu từ 1
    window.location.href = url.toString();
}
