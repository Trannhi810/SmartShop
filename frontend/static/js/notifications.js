// Notification system
class NotificationManager {
    constructor() {
        this.notificationIcon = null;
        this.notificationMenu = null;
        this.unreadBadge = null;
        this.pollInterval = null;
    }

    init() {
        // Tìm các element
        this.notificationIcon = document.getElementById('notificationIcon');
        this.notificationMenu = document.getElementById('notificationMenu');
        this.unreadBadge = document.getElementById('notificationBadge');

        if (!this.notificationIcon) {
            return; // Không có icon thông báo, không khởi tạo
        }

        // Event listeners
        this.notificationIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMenu();
        });

        // Mark all as read button
        const markAllBtn = document.getElementById('markAllReadBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.markAllAsRead();
            });
        }

        // Đóng menu khi click bên ngoài
        document.addEventListener('click', (e) => {
            if (this.notificationMenu && 
                !this.notificationMenu.contains(e.target) && 
                !this.notificationIcon.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Load notifications và bắt đầu polling
        this.loadNotifications();
        this.startPolling();
    }

    toggleMenu() {
        if (!this.notificationMenu) return;
        
        const isOpen = !this.notificationMenu.classList.contains('d-none');
        if (isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (!this.notificationMenu) return;
        this.notificationMenu.classList.remove('d-none');
        this.loadNotifications();
    }

    closeMenu() {
        if (!this.notificationMenu) return;
        this.notificationMenu.classList.add('d-none');
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();
            
            if (data.success && data.data) {
                this.renderNotifications(data.data);
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async updateUnreadCount() {
        try {
            const response = await fetch('/api/notifications/unread-count');
            const data = await response.json();
            
            if (data.success && data.data && data.data.count !== undefined) {
                const count = data.data.count;
                if (this.unreadBadge) {
                    if (count > 0) {
                        this.unreadBadge.textContent = count > 99 ? '99+' : count;
                        this.unreadBadge.classList.remove('d-none');
                    } else {
                        this.unreadBadge.classList.add('d-none');
                    }
                }
            }
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    }

    renderNotifications(notifications) {
        if (!this.notificationMenu) return;

        const container = this.notificationMenu.querySelector('.notification-list');
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <p>Không có thông báo nào</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.isRead ? '' : 'unread'}" 
                 data-id="${notif.id}" 
                 data-type="${notif.type}" 
                 data-reference-id="${notif.referenceId || ''}">
                <div class="notification-content">
                    <h4 class="notification-title">${this.escapeHtml(notif.title)}</h4>
                    <p class="notification-message">${this.escapeHtml(notif.message || '')}</p>
                    <span class="notification-time">${this.formatTime(notif.createdAt)}</span>
                </div>
                ${!notif.isRead ? '<span class="notification-dot"></span>' : ''}
            </div>
        `).join('');

        // Thêm event listeners cho các notification items
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleNotificationClick(item);
            });
        });
    }

    async handleNotificationClick(item) {
        const notificationId = item.dataset.id;
        const type = item.dataset.type;
        const referenceId = item.dataset.referenceId;

        // Đánh dấu là đã đọc
        if (!item.classList.contains('read')) {
            try {
                await fetch(`/api/notifications/${notificationId}/mark-read`, {
                    method: 'PUT'
                });
                item.classList.add('read');
                item.classList.remove('unread');
                item.querySelector('.notification-dot')?.remove();
                this.updateUnreadCount();
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Điều hướng dựa trên type
        if (type === 'ORDER' && referenceId) {
            window.location.href = `/order-detail.html?id=${referenceId}`;
        } else if (type === 'PROMOTION' && referenceId) {
            window.location.href = `/user/vouchers.html`;
        } else {
            // Mặc định điều hướng đến trang đơn hàng
            window.location.href = `/orders.html`;
        }

        this.closeMenu();
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        
        return date.toLocaleDateString('vi-VN');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startPolling() {
        // Cập nhật số lượng thông báo chưa đọc mỗi 30 giây
        this.pollInterval = setInterval(() => {
            this.updateUnreadCount();
        }, 30000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async markAllAsRead() {
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'PUT'
            });
            this.loadNotifications();
            this.updateUnreadCount();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }
}

// Khởi tạo khi DOM ready
let notificationManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
    notificationManager.init();
});

