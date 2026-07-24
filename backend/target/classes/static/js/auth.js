// Authentication functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const emailField = document.getElementById('emailField');
    const passwordField = document.getElementById('passwordField');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    // Reset errors
    emailField.classList.remove('form-field--error');
    passwordField.classList.remove('form-field--error');
    if (emailError) emailError.style.display = 'none';
    if (passwordError) passwordError.style.display = 'none';
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email) {
        emailField.classList.add('form-field--error');
        if (emailError) {
            emailError.textContent = 'Email là bắt buộc';
            emailError.style.display = 'block';
        }
        return;
    }
    
    if (!password) {
        passwordField.classList.add('form-field--error');
        if (passwordError) {
            passwordError.textContent = 'Mật khẩu là bắt buộc';
            passwordError.style.display = 'block';
        }
        return;
    }
    
    // Disable submit button
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';
    }
    
    try {
        // API expects username, so we use email as username
        const response = await api.login(email, password);
        
        if (response.ok) {
            const data = await response.json();
            // Token is set via cookie, reset auth status to force fresh check
            if (typeof resetAuthStatus === 'function') {
                resetAuthStatus();
            }
            showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
            
            // Redirect after short delay to allow cookie to be set
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
                // Add login parameter to trigger refresh check
                const separator = redirectUrl.includes('?') ? '&' : '?';
                window.location.href = `${redirectUrl}${separator}login=success`;
            }, 1000);
        } else {
            // Parse error response
            const error = await response.json().catch(() => ({ message: 'Đăng nhập thất bại' }));
            const errorMessage = error.message || 'Email hoặc mật khẩu không đúng';
            
            // Hiển thị thông báo lỗi - đặc biệt cho tài khoản bị khóa
            if (errorMessage.includes('khóa') || errorMessage.includes('bị khóa')) {
                showAlert(errorMessage, 'danger');
            } else {
                showAlert(errorMessage, 'danger');
            }
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Đăng nhập';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error.message && error.message.includes('khóa') 
            ? error.message 
            : 'Đăng nhập thất bại. Vui lòng thử lại.';
        showAlert(errorMessage, 'danger');
        
        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng nhập';
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const usernameField = document.getElementById('usernameField');
    const fullNameField = document.getElementById('fullNameField');
    const emailField = document.getElementById('emailField');
    const passwordField = document.getElementById('passwordField');
    const usernameError = document.getElementById('usernameError');
    const fullNameError = document.getElementById('fullNameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    // Reset errors
    usernameField.classList.remove('form-field--error');
    fullNameField.classList.remove('form-field--error');
    emailField.classList.remove('form-field--error');
    passwordField.classList.remove('form-field--error');
    if (usernameError) usernameError.style.display = 'none';
    if (fullNameError) fullNameError.style.display = 'none';
    if (emailError) emailError.style.display = 'none';
    if (passwordError) passwordError.style.display = 'none';
    
    const username = document.getElementById('username').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    let hasError = false;
    
    // Validation
    if (!username) {
        usernameField.classList.add('form-field--error');
        if (usernameError) {
            usernameError.textContent = 'Tên đăng nhập là bắt buộc';
            usernameError.style.display = 'block';
        }
        hasError = true;
    } else if (username.length < 3) {
        usernameField.classList.add('form-field--error');
        if (usernameError) {
            usernameError.textContent = 'Tên đăng nhập phải có ít nhất 3 ký tự';
            usernameError.style.display = 'block';
        }
        hasError = true;
    } else if (username.length > 50) {
        usernameField.classList.add('form-field--error');
        if (usernameError) {
            usernameError.textContent = 'Tên đăng nhập không được quá 50 ký tự';
            usernameError.style.display = 'block';
        }
        hasError = true;
    }
    
    if (!email) {
        emailField.classList.add('form-field--error');
        if (emailError) {
            emailError.textContent = 'Email là bắt buộc';
            emailError.style.display = 'block';
        }
        hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailField.classList.add('form-field--error');
        if (emailError) {
            emailError.textContent = 'Email không hợp lệ';
            emailError.style.display = 'block';
        }
        hasError = true;
    }
    
    if (!password) {
        passwordField.classList.add('form-field--error');
        if (passwordError) {
            passwordError.textContent = 'Mật khẩu là bắt buộc';
            passwordError.style.display = 'block';
        }
        hasError = true;
    } else if (password.length < 6) {
        passwordField.classList.add('form-field--error');
        if (passwordError) {
            passwordError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            passwordError.style.display = 'block';
        }
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    // Disable submit button
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';
    }
    
    try {
        const response = await api.register({
            username: username,
            fullName: fullName || null, // Allow empty fullName
            email,
            password
        });
        
        if (response.ok) {
            showAlert('Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
            setTimeout(() => {
                window.location.href = '/auth/login.html';
            }, 2000);
        } else {
            const error = await response.json().catch(() => ({ message: 'Đăng ký thất bại' }));
            const errorMessage = error.message || 'Đăng ký thất bại';
            showAlert(errorMessage, 'danger');
            
            // Handle field-specific errors if provided by API
            if (error.errors) {
                if (error.errors.username) {
                    usernameField.classList.add('form-field--error');
                    if (usernameError) {
                        usernameError.textContent = error.errors.username;
                        usernameError.style.display = 'block';
                    }
                }
                if (error.errors.fullName) {
                    fullNameField.classList.add('form-field--error');
                    if (fullNameError) {
                        fullNameError.textContent = error.errors.fullName;
                        fullNameError.style.display = 'block';
                    }
                }
                if (error.errors.email) {
                    emailField.classList.add('form-field--error');
                    if (emailError) {
                        emailError.textContent = error.errors.email;
                        emailError.style.display = 'block';
                    }
                }
                if (error.errors.password) {
                    passwordField.classList.add('form-field--error');
                    if (passwordError) {
                        passwordError.textContent = error.errors.password;
                        passwordError.style.display = 'block';
                    }
                }
            }
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Đăng ký';
            }
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('Đăng ký thất bại. Vui lòng thử lại.', 'danger');
        
        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng ký';
        }
    }
}

function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    
    // Map Bootstrap alert types to new CSS classes
    const alertClassMap = {
        'success': 'alert--success',
        'danger': 'alert--error',
        'error': 'alert--error',
        'warning': 'alert--warning',
        'info': 'alert--warning'
    };
    
    const alertClass = alertClassMap[type] || 'alert--error';
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass}`;
    alertDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 300);
        }
    }, 5000);
}

