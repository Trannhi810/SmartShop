// Reviews functionality
let currentUserId = null;
let currentUser = null;
let editingReviewId = null;
let isAdmin = false;
let replyingToReviewId = null;

// Initialize reviews
async function initReviews(productId) {
    await loadCurrentUser();
    await loadReviews(productId);
    await loadRatingStats(productId);
}

// Load current user info
async function loadCurrentUser() {
    try {
        const authenticated = await checkAuthStatus();
        if (authenticated) {
            currentUser = await api.getCurrentUser();
            if (currentUser) {
                currentUserId = currentUser.id;
                // Check if user is admin
                isAdmin = currentUser.roles && (
                    currentUser.roles.includes('ADMIN') || 
                    currentUser.roles.includes('ROLE_ADMIN') || 
                    currentUser.roles.some(r => r.includes('ADMIN'))
                );
            }
        }
    } catch (error) {
        console.error('Error loading current user:', error);
    }
}

// Load rating statistics
async function loadRatingStats(productId) {
    try {
        const stats = await api.getProductRatingStats(productId);
        displayRatingStats(stats);
    } catch (error) {
        console.error('Error loading rating stats:', error);
    }
}

// Display rating statistics
function displayRatingStats(stats) {
    const container = document.getElementById('ratingStats');
    if (!container) return;

    const total = stats.total || 0;
    const average = stats.average || 0;
    
    let html = `
        <div class="rating-summary">
            <div class="rating-summary__main">
                <div class="rating-summary__score">${average.toFixed(1)}</div>
                <div class="rating-summary__stars">${renderStars(average, true)}</div>
                <div class="rating-summary__count">${total} đánh giá</div>
            </div>
            <div class="rating-summary__breakdown">
                ${[5, 4, 3, 2, 1].map(rating => {
                    const count = stats[`rating${rating}`] || 0;
                    const percentage = total > 0 ? (count / total * 100).toFixed(0) : 0;
                    return `
                        <div class="rating-breakdown-item">
                            <span class="rating-breakdown-item__label">${rating} sao</span>
                            <div class="rating-breakdown-item__bar">
                                <div class="rating-breakdown-item__fill" style="width: ${percentage}%"></div>
                            </div>
                            <span class="rating-breakdown-item__count">${count}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Load reviews
async function loadReviews(productId) {
    try {
        const reviews = await api.getProductReviews(productId);
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        const container = document.getElementById('reviewsList');
        if (container) {
            container.innerHTML = '<p class="text-muted">Không thể tải đánh giá</p>';
        }
    }
}

// Display reviews
function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p class="text-muted">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>';
        return;
    }

    let html = '<div class="reviews-list">';
    reviews.forEach(review => {
        const isOwner = currentUserId && review.userId === currentUserId;
        const displayName = review.fullName || review.username || 'Người dùng';
        const avatar = review.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=random';
        const date = new Date(review.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        html += `
            <div class="review-item" data-review-id="${review.id}">
                <div class="review-item__header">
                    <div class="review-item__user">
                        <img src="${avatar}" alt="${escapeHtml(displayName)}" class="review-item__avatar">
                        <div class="review-item__user-info">
                            <div class="review-item__name">${escapeHtml(displayName)}</div>
                            <div class="review-item__date">${date}${review.isEdited ? ' <span class="review-item__edited">(Đã chỉnh sửa)</span>' : ''}</div>
                        </div>
                    </div>
                    <div class="review-item__rating">${renderStars(review.rating)}</div>
                </div>
                ${review.comment ? `<div class="review-item__comment">${escapeHtml(review.comment)}</div>` : ''}
                ${review.media && review.media.length > 0 ? `
                    <div class="review-item__media">
                        ${review.media.map(media => {
                            if (media.type === 'VIDEO') {
                                return `<video controls class="review-media"><source src="${media.url}" type="video/mp4"></video>`;
                            } else {
                                return `<img src="${media.url}" alt="Review image" class="review-media" onclick="openMediaModal('${media.url}')">`;
                            }
                        }).join('')}
                    </div>
                ` : ''}
                ${review.replyComment ? `
                    <div class="review-item__reply">
                        <div class="review-item__reply-header">
                            <strong>Phản hồi từ Shop:</strong>
                            <span class="review-item__reply-date">${new Date(review.replyAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>
                        <div class="review-item__reply-content">${escapeHtml(review.replyComment)}</div>
                    </div>
                ` : ''}
                <div class="review-item__actions">
                    ${isOwner ? `
                        <button class="btn btn-sm btn-link" onclick="editReview(${review.id})">Sửa</button>
                        <button class="btn btn-sm btn-link text-danger" onclick="deleteReview(${review.id})">Xóa</button>
                    ` : ''}
                    ${isAdmin && !review.replyComment ? `
                        <button class="btn btn-sm btn-primary" onclick="showReplyForm(${review.id})">Trả lời</button>
                    ` : ''}
                    ${isAdmin && review.replyComment ? `
                        <button class="btn btn-sm btn-link" onclick="showReplyForm(${review.id})">Sửa trả lời</button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Render stars
function renderStars(rating, showNumber = false) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '<div class="stars">';
    for (let i = 0; i < fullStars; i++) {
        html += '<span class="star star--full">★</span>';
    }
    if (hasHalfStar) {
        html += '<span class="star star--half">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<span class="star star--empty">☆</span>';
    }
    if (showNumber) {
        html += ` <span class="stars__number">${rating.toFixed(1)}</span>`;
    }
    html += '</div>';
    return html;
}

// Show review form
function showReviewForm(productId, reviewId = null) {
    const authenticated = checkAuthStatusSync();
    if (!authenticated) {
        alert('Bạn cần đăng nhập để bình luận');
        window.location.href = '/auth/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
    }

    editingReviewId = reviewId;
    const formContainer = document.getElementById('reviewFormContainer');
    if (!formContainer) return;

    const isEdit = reviewId !== null;
    formContainer.innerHTML = `
        <div class="review-form">
            <h3 class="review-form__title">${isEdit ? 'Sửa bình luận' : 'Viết bình luận'}</h3>
            <form id="reviewForm" onsubmit="submitReview(event, ${productId})">
                <div class="form-group">
                    <label>Đánh giá của bạn *</label>
                    <div class="star-rating" id="starRating">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <button type="button" class="star-rating__star" data-rating="${i}" onclick="selectRating(${i})">☆</button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="ratingInput" name="rating" value="5" required>
                </div>
                <div class="form-group">
                    <label for="commentInput">Nội dung bình luận</label>
                    <textarea id="commentInput" name="comment" rows="4" class="form-control" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."></textarea>
                </div>
                <div class="form-group">
                    <label for="mediaInput">Thêm hình ảnh/video (tùy chọn)</label>
                    <input type="file" id="mediaInput" name="files" multiple accept="image/*,video/*" class="form-control">
                    <small class="form-text text-muted">Bạn có thể chọn nhiều file (ảnh hoặc video)</small>
                    <div id="mediaPreview" class="media-preview"></div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Cập nhật' : 'Gửi bình luận'}</button>
                    <button type="button" class="btn btn-secondary" onclick="cancelReviewForm()">Hủy</button>
                </div>
            </form>
        </div>
    `;

    // Load existing review data if editing
    if (isEdit) {
        loadReviewForEdit(reviewId);
    }

    // Preview media
    document.getElementById('mediaInput').addEventListener('change', previewMedia);
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

// Select rating
function selectRating(rating) {
    document.getElementById('ratingInput').value = rating;
    const stars = document.querySelectorAll('.star-rating__star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('star-rating__star--active');
        } else {
            star.textContent = '☆';
            star.classList.remove('star-rating__star--active');
        }
    });
}

// Preview media files
function previewMedia(event) {
    const files = event.target.files;
    const preview = document.getElementById('mediaPreview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'media-preview-item';
            if (file.type.startsWith('video/')) {
                div.innerHTML = `<video controls><source src="${e.target.result}"></video><button type="button" onclick="this.parentElement.remove()">×</button>`;
            } else {
                div.innerHTML = `<img src="${e.target.result}" alt="Preview"><button type="button" onclick="this.parentElement.remove()">×</button>`;
            }
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

// Load review for editing
async function loadReviewForEdit(reviewId) {
    try {
        const reviews = await api.getProductReviews(productId);
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
            document.getElementById('ratingInput').value = review.rating;
            selectRating(review.rating);
            document.getElementById('commentInput').value = review.comment || '';
        }
    } catch (error) {
        console.error('Error loading review for edit:', error);
    }
}

// Submit review
async function submitReview(event, productId) {
    event.preventDefault();
    
    const rating = parseInt(document.getElementById('ratingInput').value);
    const comment = document.getElementById('commentInput').value;
    const filesInput = document.getElementById('mediaInput');
    const files = filesInput.files;

    try {
        if (editingReviewId) {
            await api.updateReview(editingReviewId, rating, comment, files.length > 0 ? Array.from(files) : null);
            showToast('Cập nhật bình luận thành công!', 'success');
        } else {
            await api.createReview(productId, rating, comment, files.length > 0 ? Array.from(files) : null);
            showToast('Gửi bình luận thành công!', 'success');
        }
        
        cancelReviewForm();
        await loadReviews(productId);
        await loadRatingStats(productId);
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast(error.message || 'Có lỗi xảy ra', 'error');
    }
}

// Edit review
function editReview(reviewId) {
    showReviewForm(productId, reviewId);
}

// Delete review
async function deleteReview(reviewId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
        return;
    }

    try {
        await api.deleteReview(reviewId);
        showToast('Xóa bình luận thành công!', 'success');
        await loadReviews(productId);
        await loadRatingStats(productId);
    } catch (error) {
        console.error('Error deleting review:', error);
        showToast(error.message || 'Có lỗi xảy ra', 'error');
    }
}

// Cancel review form
function cancelReviewForm() {
    editingReviewId = null;
    const formContainer = document.getElementById('reviewFormContainer');
    if (formContainer) {
        formContainer.innerHTML = '';
    }
}

// Open media modal
function openMediaModal(url) {
    // Simple modal for viewing images
    const modal = document.createElement('div');
    modal.className = 'media-modal';
    modal.innerHTML = `
        <div class="media-modal__content">
            <button class="media-modal__close" onclick="this.closest('.media-modal').remove()">×</button>
            <img src="${url}" alt="Review media">
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Check auth status synchronously (cached)
function checkAuthStatusSync() {
    return authStatus === true;
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

// Show reply form
function showReplyForm(reviewId) {
    if (!isAdmin) {
        alert('Chỉ admin mới có quyền trả lời bình luận');
        return;
    }

    replyingToReviewId = reviewId;
    const reviewItem = document.querySelector(`[data-review-id="${reviewId}"]`);
    if (!reviewItem) return;

    // Check if reply form already exists
    let existingForm = reviewItem.querySelector('.review-reply-form');
    if (existingForm) {
        existingForm.remove();
    }

    // Get existing reply if any
    const reviewItemElement = reviewItem;
    const existingReply = reviewItemElement.querySelector('.review-item__reply');
    const existingReplyText = existingReply ? existingReply.querySelector('.review-item__reply-content').textContent.trim() : '';

    const formHtml = `
        <div class="review-reply-form">
            <h4>Trả lời bình luận</h4>
            <form onsubmit="submitReply(event, ${reviewId})">
                <div class="form-group">
                    <label for="replyCommentInput_${reviewId}">Nội dung trả lời *</label>
                    <textarea id="replyCommentInput_${reviewId}" name="replyComment" rows="3" class="form-control" required>${escapeHtml(existingReplyText)}</textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary btn-sm">Gửi trả lời</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="cancelReplyForm(${reviewId})">Hủy</button>
                </div>
            </form>
        </div>
    `;

    const formDiv = document.createElement('div');
    formDiv.innerHTML = formHtml;
    reviewItem.appendChild(formDiv.firstElementChild);
    formDiv.firstElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Submit reply
async function submitReply(event, reviewId) {
    event.preventDefault();
    
    const replyInput = document.getElementById(`replyCommentInput_${reviewId}`);
    const replyComment = replyInput.value.trim();

    if (!replyComment) {
        alert('Vui lòng nhập nội dung trả lời');
        return;
    }

    try {
        await api.replyToReview(reviewId, replyComment);
        showToast('Trả lời bình luận thành công!', 'success');
        cancelReplyForm(reviewId);
        await loadReviews(productId);
    } catch (error) {
        console.error('Error replying to review:', error);
        showToast(error.message || 'Có lỗi xảy ra', 'error');
    }
}

// Cancel reply form
function cancelReplyForm(reviewId) {
    replyingToReviewId = null;
    const reviewItem = document.querySelector(`[data-review-id="${reviewId}"]`);
    if (reviewItem) {
        const form = reviewItem.querySelector('.review-reply-form');
        if (form) {
            form.remove();
        }
    }
}

// Show toast notification
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

