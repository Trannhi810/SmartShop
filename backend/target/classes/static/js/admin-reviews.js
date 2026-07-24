// Admin Reviews Management
let currentPage = 0;
let currentSize = 20;
let totalPages = 0;
let currentReviewId = null;
let replyModal = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Bootstrap modal
    replyModal = new bootstrap.Modal(document.getElementById('replyModal'));
    
    // Load reviews
    await loadReviews();
    
    // Setup filter inputs
    document.getElementById('pageInput').addEventListener('change', () => {
        currentPage = parseInt(document.getElementById('pageInput').value) || 0;
        loadReviews();
    });
    
    document.getElementById('sizeInput').addEventListener('change', () => {
        currentSize = parseInt(document.getElementById('sizeInput').value) || 20;
        currentPage = 0;
        document.getElementById('pageInput').value = 0;
        loadReviews();
    });
});

// Load reviews
async function loadReviews() {
    try {
        const productId = document.getElementById('filterProductId').value;
        const userId = document.getElementById('filterUserId').value;
        const rating = document.getElementById('filterRating').value;
        
        const params = {
            page: currentPage,
            size: currentSize
        };
        
        if (productId) params.productId = productId;
        if (userId) params.userId = userId;
        if (rating) params.rating = rating;
        
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/api/reviews/admin?${queryString}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách đánh giá');
        }
        
        const data = await response.json();
        displayReviews(data.content || data);
        updatePagination(data);
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsTableBody').innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    Lỗi: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Display reviews
function displayReviews(reviews) {
    const tbody = document.getElementById('reviewsTableBody');
    
    if (!reviews || reviews.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    Không có đánh giá nào
                </td>
            </tr>
        `;
        return;
    }
    
    // Group reviews by product to find latest comment
    const productReviewsMap = new Map();
    reviews.forEach(review => {
        const productId = review.productId;
        if (!productReviewsMap.has(productId)) {
            productReviewsMap.set(productId, []);
        }
        productReviewsMap.get(productId).push(review);
    });
    
    // Sort reviews by product and get latest comment for each product
    const productLatestComments = new Map();
    productReviewsMap.forEach((productReviews, productId) => {
        const sorted = productReviews.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        productLatestComments.set(productId, sorted[0]);
    });
    
    let html = '';
    reviews.forEach(review => {
        const latestComment = productLatestComments.get(review.productId);
        const isLatest = latestComment && latestComment.id === review.id;
        
        const comment = review.comment || '<em class="text-muted">Không có comment</em>';
        const commentPreview = comment.length > 100 
            ? comment.substring(0, 100) + '...' 
            : comment;
        
        const replyComment = review.replyComment || '';
        const replyPreview = replyComment.length > 50 
            ? replyComment.substring(0, 50) + '...' 
            : replyComment;
        
        const createdAt = new Date(review.createdAt).toLocaleString('vi-VN');
        const replyAt = review.replyAt 
            ? new Date(review.replyAt).toLocaleString('vi-VN')
            : '';
        
        html += `
            <tr>
                <td>${review.id}</td>
                <td>
                    <a href="/product/product-detail.html?id=${review.productId}" target="_blank">
                        ${escapeHtml(review.productName || 'N/A')}
                    </a>
                </td>
                <td>${escapeHtml(review.fullName || review.username || 'N/A')}</td>
                <td>
                    <span class="badge bg-warning text-dark">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)} ${review.rating}/5
                    </span>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${escapeHtml(comment)}">
                        ${commentPreview}
                    </div>
                    ${isLatest ? '<span class="badge bg-success ms-1">Mới nhất</span>' : ''}
                </td>
                <td>
                    ${latestComment && latestComment.id !== review.id 
                        ? `<div class="text-truncate" style="max-width: 200px;" title="${escapeHtml(latestComment.comment || '')}">
                            ${(latestComment.comment || '').substring(0, 50)}...
                           </div>`
                        : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    ${replyComment 
                        ? `<div class="text-truncate" style="max-width: 150px;" title="${escapeHtml(replyComment)}">
                            ${replyPreview}
                           </div>
                           <small class="text-muted d-block">${replyAt}</small>`
                        : '<span class="text-muted">Chưa trả lời</span>'}
                </td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openReplyModal(${review.id}, ${review.replyComment ? `'${escapeHtml(replyComment)}'` : 'null'})" title="Trả lời">
                        <i class="bi bi-reply"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReview(${review.id})" title="Xóa">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Update pagination
function updatePagination(data) {
    totalPages = data.totalPages || 0;
    const totalElements = data.totalElements || 0;
    
    document.getElementById('reviewsInfo').textContent = 
        `Hiển thị ${data.number * data.size + 1} - ${Math.min((data.number + 1) * data.size, totalElements)} / ${totalElements} đánh giá`;
    
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${data.number === 0 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${data.number - 1}); return false;">Trước</a>`;
    pagination.appendChild(prevLi);
    
    // Page numbers
    const startPage = Math.max(0, data.number - 2);
    const endPage = Math.min(totalPages - 1, data.number + 2);
    
    if (startPage > 0) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        firstLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(0); return false;">1</a>`;
        pagination.appendChild(firstLi);
        
        if (startPage > 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(ellipsisLi);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === data.number ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i + 1}</a>`;
        pagination.appendChild(li);
    }
    
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(ellipsisLi);
        }
        
        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        lastLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${totalPages - 1}); return false;">${totalPages}</a>`;
        pagination.appendChild(lastLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${data.number >= totalPages - 1 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${data.number + 1}); return false;">Sau</a>`;
    pagination.appendChild(nextLi);
}

// Go to page
function goToPage(page) {
    currentPage = page;
    document.getElementById('pageInput').value = page;
    loadReviews();
}

// Reset filters
function resetFilters() {
    document.getElementById('filterProductId').value = '';
    document.getElementById('filterUserId').value = '';
    document.getElementById('filterRating').value = '';
    document.getElementById('pageInput').value = 0;
    document.getElementById('sizeInput').value = 20;
    currentPage = 0;
    currentSize = 20;
    loadReviews();
}

// Open reply modal
function openReplyModal(reviewId, existingReply) {
    currentReviewId = reviewId;
    const replyInput = document.getElementById('replyCommentInput');
    replyInput.value = existingReply || '';
    replyModal.show();
}

// Submit reply
async function submitReply() {
    if (!currentReviewId) return;
    
    const replyComment = document.getElementById('replyCommentInput').value.trim();
    if (!replyComment) {
        alert('Vui lòng nhập nội dung trả lời');
        return;
    }
    
    try {
        await api.replyToReview(currentReviewId, replyComment);
        replyModal.hide();
        showToast('Trả lời đánh giá thành công!', 'success');
        await loadReviews();
    } catch (error) {
        console.error('Error replying to review:', error);
        alert(error.message || 'Có lỗi xảy ra khi trả lời đánh giá');
    }
}

// Delete review
async function deleteReview(reviewId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
        return;
    }
    
    try {
        await api.deleteReview(reviewId);
        showToast('Xóa đánh giá thành công!', 'success');
        await loadReviews();
    } catch (error) {
        console.error('Error deleting review:', error);
        alert(error.message || 'Có lỗi xảy ra khi xóa đánh giá');
    }
}

// Escape HTML
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

// Show toast notification
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

