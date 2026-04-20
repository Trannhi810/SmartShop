// Home page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize carousel
    initCarousel();
    
    // Check authentication status - with retry for fresh login
    await updateAuthUI();
    
    // If redirected from login, check again after a short delay
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('login') || document.cookie.includes('SMARTSHOP_TOKEN')) {
        setTimeout(async () => {
            resetAuthStatus();
            await updateAuthUI();
        }, 500);
    }

    // Load featured categories
    await loadFeaturedCategories();
    
    // Load featured products
    await loadFeaturedProducts();

    // Setup newsletter form
    setupNewsletterForm();

    // Setup search form
    setupSearchForm();

    // Setup footer newsletter form
    setupFooterNewsletterForm();
    
    // Setup category dropdown
    setupCategoryDropdown();
});

// Carousel functionality
function initCarousel() {
    const viewport = document.querySelector('[data-carousel]');
    if (!viewport) return;
    
    const slides = viewport.querySelectorAll('.carousel__slide');
    if (slides.length === 0) return;
    
    const prevBtn = document.querySelector('[data-carousel-prev]');
    const nextBtn = document.querySelector('[data-carousel-next]');
    const dotsContainer = document.querySelector('[data-carousel-dots]');
    
    let currentSlide = 0;
    let autoPlayInterval;
    
    // Create dots if not already created
    if (dotsContainer && dotsContainer.children.length === 0) {
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel__dot' + (index === 0 ? ' is-active' : '');
            dot.setAttribute('aria-label', `Chuyển đến slide ${index + 1}`);
            dotsContainer.appendChild(dot);
        });
    }
    
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel__dot') : [];
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('is-active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === index);
        });
        currentSlide = index;
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    function prevSlide() {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }
    
    function goToSlide(index) {
        if (index >= 0 && index < slides.length) {
            showSlide(index);
        }
    }
    
    // Setup dot click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    // Auto-play carousel
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000);
    }
    
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
    
    startAutoPlay();
    
    // Pause on hover
    if (viewport) {
        viewport.addEventListener('mouseenter', stopAutoPlay);
        viewport.addEventListener('mouseleave', startAutoPlay);
    }
}

async function updateAuthUI() {
    // Export for external calls
    window.updateAuthUI = updateAuthUI;
    
    // Auth status logic...

    try {
        console.log('Updating auth UI...');
        const authenticated = await checkAuthStatus();
        console.log('Auth status:', authenticated);
        
        const anonymousDiv = document.getElementById('headerAccountAnonymous');
        const authDiv = document.getElementById('headerAccountAuth');
        const wishlistLink = document.getElementById('wishlistLink');
        const cartLink = document.getElementById('cartLink');
        
        if (!anonymousDiv || !authDiv) {
            console.error('Header elements not found');
            return;
        }
        
        if (authenticated) {
            console.log('User is authenticated, showing auth UI');
            // Show authenticated UI
            anonymousDiv.classList.add('d-none');
            authDiv.classList.remove('d-none');
            
            // Update links
            if (wishlistLink) wishlistLink.href = '/wishlist.html';
            if (cartLink) cartLink.href = '/cart.html';
            
            // Load user info
            try {
                const user = await api.getCurrentUser();
                console.log('User info:', user);
                
                if (user) {
                    const userProfileLink = document.getElementById('userProfileLink');
                    const userName = document.getElementById('userName');
                    const adminChip = document.getElementById('adminChip');
                    const logoutForm = document.getElementById('logoutForm');
                    
                    // Set user name
                    if (userName) {
                        const displayName = user.fullName || user.username || user.email || 'Người dùng';
                        userName.textContent = displayName;
                        console.log('Set user name to:', displayName);
                        
                        // Also set name in dropdown menu
                        const userMenuName = document.getElementById('userMenuName');
                        if (userMenuName) {
                            userMenuName.textContent = displayName;
                        }
                    }
                    
                    // Check if user is admin
                    const isAdmin = user.roles && (user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN') || user.roles.some(r => r.includes('ADMIN')));
                    console.log('Is admin:', isAdmin);
                    
                    // Get admin menu link
                    const adminMenuLink = document.getElementById('adminMenuLink');
                    
                    if (isAdmin) {
                        // Show admin chip
                        if (adminChip) {
                            adminChip.classList.remove('d-none');
                        }
                        
                        // Show admin chip in dropdown menu
                        const userMenuChip = document.getElementById('userMenuChip');
                        if (userMenuChip) {
                            userMenuChip.classList.remove('d-none');
                        }
                        
                        // Show admin menu link
                        if (adminMenuLink) {
                            adminMenuLink.classList.remove('d-none');
                        }
                    } else {
                        // Hide admin chip
                        if (adminChip) {
                            adminChip.classList.add('d-none');
                        }
                        
                        // Hide admin chip in dropdown menu
                        const userMenuChip = document.getElementById('userMenuChip');
                        if (userMenuChip) {
                            userMenuChip.classList.add('d-none');
                        }
                        
                        // Hide admin menu link
                        if (adminMenuLink) {
                            adminMenuLink.classList.add('d-none');
                        }
                    }
                    
                    // Setup dropdown menu toggle (only once)
                    if (userProfileLink && !userProfileLink.dataset.menuListenerAdded) {
                        userProfileLink.href = '#';
                        userProfileLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            toggleUserMenu();
                        });
                        userProfileLink.dataset.menuListenerAdded = 'true';
                    }
                    
                    // Setup dropdown menu (only once)
                    if (!document.getElementById('userMenu')?.dataset.setup) {
                        setupUserMenu();
                        document.getElementById('userMenu').dataset.setup = 'true';
                    }
                    
                    // Setup logout button in dropdown menu
                    const logoutButton = document.getElementById('logoutButton');
                    if (logoutButton && !logoutButton.dataset.listenerAdded) {
                        logoutButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            await handleLogout();
                        });
                        logoutButton.dataset.listenerAdded = 'true';
                    }
                }
            } catch (error) {
                console.error('Error loading user info:', error);
                // Still show auth UI even if user info fails to load
            }
            await refreshCartBadge();
        } else {
            console.log('User is not authenticated, showing anonymous UI');
            // Show anonymous UI
            anonymousDiv.classList.remove('d-none');
            authDiv.classList.add('d-none');
            
            // Update links to redirect to login
            if (wishlistLink) wishlistLink.href = '/auth/login.html?redirect=/wishlist.html';
            if (cartLink) cartLink.href = '/auth/login.html?redirect=/cart.html';
            hideCartBadge();
        }
    } catch (error) {
        console.error('Error updating auth UI:', error);
    }
}

// Load Featured Categories
async function loadFeaturedCategories() {
    try {
        const container = document.getElementById('featuredCategoriesGrid');
        if (!container) {
            console.error('Featured categories container not found');
            return;
        }

        console.log('Fetching categories from API...');
        const categories = await api.getCategories();
        console.log('Categories API response:', categories);
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="text-center" style="grid-column: 1 / -1;"><p>Chưa có danh mục nào</p></div>';
            return;
        }

        // Lấy 6 danh mục đầu tiên (hoặc tất cả nếu ít hơn 6)
        const featuredCategories = categories.slice(0, 6);
        
        // Màu sắc cho các category cards (rotate nếu có nhiều hơn 6)
        const categoryColors = [
            { class: 'category-icon-card__circle--audio', svg: 'audio' },
            { class: 'category-icon-card__circle--wearable', svg: 'wearable' },
            { class: 'category-icon-card__circle--fashion', svg: 'fashion' },
            { class: 'category-icon-card__circle--home', svg: 'home' },
            { class: 'category-icon-card__circle--computing', svg: 'computing' },
            { class: 'category-icon-card__circle--accessories', svg: 'accessories' }
        ];
        
        // SVG icons cho các category
        const categoryIcons = {
            audio: '<path d="M5 14v2a3 3 0 0 0 3 3h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H5m14 0h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a3 3 0 0 0 3-3v-2m0 0a7 7 0 1 0-14 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>',
            wearable: '<rect x="7" y="7" width="10" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"></rect><path d="M9 4.5 10.5 7m4 0L15 4.5M9 19.5 10.5 17m4 0 1.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
            fashion: '<path d="M9 5.5 6.5 8 5 21h14l-1.5-13L15 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M9 5.5c.5.7 1.3 1.1 2 1.1s1.5-.4 2-1.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M12 6.6V3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
            home: '<path d="M4 11.5 12 5l8 6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.5 10.5V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M10 20v-4.5a2 2 0 0 1 4 0V20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
            computing: '<rect x="5" y="6" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"></rect><path d="M4 18h16m-10 0 .8 2h2.4l.8-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>',
            accessories: '<path d="M7.5 3h9l1.5 4h-12z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M6 7h12v7.5A4.5 4.5 0 0 1 13.5 19h-3A4.5 4.5 0 0 1 6 14.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M9.5 11h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>'
        };

        container.innerHTML = featuredCategories.map((category, index) => {
            const colorConfig = categoryColors[index % categoryColors.length];
            const iconSvg = categoryIcons[colorConfig.svg] || categoryIcons.accessories;
            
            return `
                <a class="category-icon-card" href="/product.html?category=${category.id}">
                    <div class="category-icon-card__circle ${colorConfig.class}">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            ${iconSvg}
                        </svg>
                    </div>
                    <span class="category-icon-card__label">${escapeHtml(category.name)}</span>
                </a>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading categories:', error);
        const container = document.getElementById('featuredCategoriesGrid');
        if (container) {
            container.innerHTML = '<div class="text-center" style="grid-column: 1 / -1;"><p class="text-danger">Không thể tải danh mục. Vui lòng thử lại sau.</p></div>';
        }
    }
}

async function loadFeaturedProducts() {
    try {
        const container = document.getElementById('featuredProductsGrid');
        if (!container) {
            console.error('Featured products container not found');
            return;
        }

        // Load sản phẩm được yêu thích - sort theo createdAt desc để lấy sản phẩm mới nhất
        console.log('Fetching featured products from API...');
        const response = await api.getProducts({
            page: 0,
            size: 8, // Lấy 8 sản phẩm để chọn 4 sản phẩm tốt nhất
            sort: 'createdAt',
            direction: 'desc'
        });
        console.log('Products API Response:', response);
        
        // Kiểm tra xem response là array hay object có content property
        let products = [];
        if (Array.isArray(response)) {
            products = response;
            console.log(`Loaded ${products.length} products from API`);
        } else if (response && response.content && Array.isArray(response.content)) {
            products = response.content;
            console.log(`Loaded ${products.length} products from response.content`);
        } else if (response && Array.isArray(response.data)) {
            products = response.data;
            console.log(`Loaded ${products.length} products from response.data`);
        } else {
            console.error('Unexpected response format:', response);
            container.innerHTML = '<div class="text-center" style="grid-column: 1 / -1;"><p class="text-danger">Định dạng dữ liệu không đúng</p></div>';
            return;
        }

        // Lấy 4 sản phẩm đầu tiên (sản phẩm mới nhất)
        const featuredProducts = products.slice(0, 4);

        if (featuredProducts.length === 0) {
            container.innerHTML = '<div class="text-center" style="grid-column: 1 / -1;"><p>Chưa có sản phẩm nào</p></div>';
            return;
        }

        container.innerHTML = featuredProducts.map(product => {
            // Xử lý image URL - giống như products.js
            let imageUrl = product.imageUrl || '';
            const placeholderImage = 'https://via.placeholder.com/300x300/e2e8f0/94a3b8?text=No+Image';
            
            if (!imageUrl || 
                imageUrl.trim() === '' || 
                imageUrl.includes('example.com') ||
                imageUrl.includes('placeholder')) {
                imageUrl = placeholderImage;
            }
            
            const safeImageUrl = imageUrl.replace(/'/g, "\\'");
            const description = product.description ? 
                (product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description) : 
                'Sản phẩm chất lượng cao từ SmartShop';
            
            return `
                <a class="product-card" href="/product-detail.html?id=${product.id}">
                    <div class="product-card__image" style="background-image: url('${safeImageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>
                    <div class="product-card__body">
                        <h3 class="product-card__title">${escapeHtml(product.name || 'Sản phẩm')}</h3>
                        <p class="product-card__price">${formatPrice(product.price || 0)}</p>
                        <p class="product-card__description">${escapeHtml(description)}</p>
                    </div>
                </a>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        const container = document.getElementById('featuredProductsGrid');
        if (container) {
            container.innerHTML = '<div class="text-center" style="grid-column: 1 / -1;"><p class="text-danger">Không thể tải sản phẩm. Vui lòng thử lại sau.</p></div>';
        }
    }
}

// Utility function để escape HTML
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

function setupNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            try {
                // You can implement newsletter subscription API here
                // For now, just show an alert
                alert('Cảm ơn bạn đã đăng ký nhận bản tin! Chúng tôi sẽ gửi email về ' + email);
                emailInput.value = '';
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        });
    }
}

async function handleLogout() {
    try {
        await api.logout();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if logout API fails
        window.location.href = '/';
    }
}

function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    if (searchForm && searchInput) {
        // Handle form submission
        searchForm.addEventListener('submit', handleSearch);
        
        // Optional: Handle Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
            }
        });
    }
}

function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim() : '';
    
    if (keyword) {
        // Redirect to products page with search query
        window.location.href = `/product.html?q=${encodeURIComponent(keyword)}`;
    } else {
        // If empty, just go to products page
        window.location.href = '/product.html';
    }
    
    return false;
}

function setupFooterNewsletterForm() {
    const form = document.getElementById('footerNewsletterForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email) {
                // You can implement newsletter subscription API here
                alert('Cảm ơn bạn đã đăng ký nhận bản tin! Chúng tôi sẽ gửi email về ' + email);
                emailInput.value = '';
            }
        });
    }
}

// User menu dropdown functionality
function setupUserMenu() {
    const userProfileLink = document.getElementById('userProfileLink');
    const userMenu = document.getElementById('userMenu');
    
    if (!userProfileLink || !userMenu) return;
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const isClickInside = userProfileLink.contains(e.target) || userMenu.contains(e.target);
        if (!isClickInside && !userMenu.classList.contains('d-none')) {
            closeUserMenu();
        }
    });
    
    // Close dropdown when clicking on menu links (except logout button which is handled separately)
    const menuLinks = userMenu.querySelectorAll('.user-menu__link:not(.user-menu__link--logout)');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeUserMenu();
        });
    });
}

function toggleUserMenu() {
    const userProfileLink = document.getElementById('userProfileLink');
    const userMenu = document.getElementById('userMenu');
    
    if (!userProfileLink || !userMenu) return;
    
    const isOpen = !userMenu.classList.contains('d-none');
    
    if (isOpen) {
        closeUserMenu();
    } else {
        openUserMenu();
    }
}

function openUserMenu() {
    const userProfileLink = document.getElementById('userProfileLink');
    const userMenu = document.getElementById('userMenu');
    
    if (!userProfileLink || !userMenu) return;
    
    userMenu.classList.remove('d-none');
    userProfileLink.setAttribute('aria-expanded', 'true');
}

function closeUserMenu() {
    const userProfileLink = document.getElementById('userProfileLink');
    const userMenu = document.getElementById('userMenu');
    
    if (!userProfileLink || !userMenu) return;
    
    userMenu.classList.add('d-none');
    userProfileLink.setAttribute('aria-expanded', 'false');
}

// Setup Category Dropdown
async function setupCategoryDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    const dropdownBtn = document.getElementById('categoryDropdownBtn');
    const dropdownMenu = document.getElementById('categoryDropdownMenu');
    
    if (!dropdown || !dropdownBtn || !dropdownMenu) return;
    
    // Toggle dropdown
    dropdownBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
        dropdown.setAttribute('aria-expanded', !isExpanded);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Load categories
    try {
        dropdownMenu.innerHTML = '<div class="nav__dropdown-loading">Đang tải...</div>';
        const categories = await api.getCategories();
        
        if (!categories || categories.length === 0) {
            dropdownMenu.innerHTML = '<div class="nav__dropdown-empty">Không có danh mục nào</div>';
            return;
        }
        
        // Render categories
        dropdownMenu.innerHTML = categories.map(category => {
            return `
                <button class="nav__dropdown-item" 
                        data-category-id="${category.id}"
                        onclick="filterByCategory(${category.id}, '${escapeHtml(category.name)}')">
                    ${escapeHtml(category.name)}
                </button>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading categories:', error);
        dropdownMenu.innerHTML = '<div class="nav__dropdown-empty">Lỗi khi tải danh mục</div>';
    }
}

// Filter products by category
function filterByCategory(categoryId, categoryName) {
    // Navigate to products page with category filter
    window.location.href = `/product.html?category=${categoryId}`;
}

function ensureCartBadge() {
    const cartLink = document.getElementById('cartLink');
    if (!cartLink) return null;
    cartLink.classList.add('header__icon--cart');
    let badge = document.getElementById('cartBadge');
    if (!badge) {
        badge = document.createElement('span');
        badge.id = 'cartBadge';
        badge.className = 'header__cart-badge d-none';
        cartLink.appendChild(badge);
    }
    return badge;
}

function hideCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.classList.add('d-none');
    }
}

function setCartBadgeCount(count) {
    const badge = ensureCartBadge();
    if (!badge) return;
    const displayValue = typeof count === 'number' && count > 99 ? '99+' : (count || 0);
    if (count && count > 0) {
        badge.textContent = displayValue;
        badge.classList.remove('d-none');
    } else {
        badge.textContent = '0';
        badge.classList.add('d-none');
    }
}

function getQuantityFromCart(cart) {
    if (!cart) return 0;
    if (typeof cart.totalQuantity === 'number') {
        return cart.totalQuantity;
    }
    if (Array.isArray(cart.items)) {
        return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    return 0;
}

async function refreshCartBadge() {
    const badge = ensureCartBadge();
    if (!badge) return;
    if (authStatus !== true) {
        hideCartBadge();
        return;
    }

    try {
        const cart = await api.getCart();
        const quantity = getQuantityFromCart(cart);
        setCartBadgeCount(quantity);
    } catch (error) {
        console.error('Error refreshing cart badge:', error);
    }
}

window.refreshCartBadge = refreshCartBadge;
window.setCartBadgeCount = setCartBadgeCount;
window.hideCartBadge = hideCartBadge;
