// Authentication & User Management

// Show Modal - FIXED for proper centering
function showModal(type) {
    const modal = document.getElementById('authModal');
    modal.style.display = 'flex'; // Use flex for centering
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    if (type === 'login') {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
    } else {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    }
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="checkbox"])');
        if (firstInput) firstInput.focus();
    }, 100);
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Switch between forms
function switchForm(type) {
    if (type === 'login') {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginEmail').focus();
    } else {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
        document.getElementById('signupEmail').focus();
    }
}

// Handle Signup - Database Version
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const ageCheck = document.getElementById('ageCheck').checked;
    const termsCheck = document.getElementById('termsCheck').checked;
    
    // Validation
    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }
    
    if (!ageCheck) {
        alert('You must be 18 years or older to use this service.');
        return;
    }
    
    if (!termsCheck) {
        alert('You must agree to the Community Guidelines and Privacy Policy.');
        return;
    }
    
    try {
        // Check if using database backend or localStorage fallback
        if (typeof AuthAPI !== 'undefined') {
            const response = await AuthAPI.signup(email, password);
            localStorage.setItem('anondate_token', response.token);
            localStorage.setItem('anondate_user', JSON.stringify(response.user));
        } else {
            // Fallback to localStorage for demo without backend
            const existing = localStorage.getItem(`user_${email}`);
            if (existing) {
                alert('Email already registered!');
                return;
            }
            
            const user = {
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                email: email,
                password: btoa(password + 'salt'), // Demo only - use bcrypt in production
                createdAt: new Date().toISOString(),
                profile: {
                    anonName: `User#${Math.floor(Math.random() * 10000)}`,
                    bio: '',
                    preferences: {
                        gender: 'any',
                        ageMin: 18,
                        ageMax: 80
                    }
                }
            };
            
            localStorage.setItem(`user_${email}`, JSON.stringify(user));
            localStorage.setItem('anondate_token', user.id);
            localStorage.setItem('anondate_auth', JSON.stringify({
                email: email,
                timestamp: new Date().toISOString()
            }));
        }
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(error.message || 'Signup failed. Please try again.');
    }
}

// Handle Login - Database Version
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        if (typeof AuthAPI !== 'undefined') {
            const response = await AuthAPI.login(email, password);
            localStorage.setItem('anondate_token', response.token);
            localStorage.setItem('anondate_user', JSON.stringify(response.user));
        } else {
            // Fallback to localStorage
            const userData = localStorage.getItem(`user_${email}`);
            if (!userData) {
                alert('User not found!');
                return;
            }
            
            const user = JSON.parse(userData);
            if (user.password !== btoa(password + 'salt')) {
                alert('Invalid password!');
                return;
            }
            
            localStorage.setItem('anondate_token', user.id);
            localStorage.setItem('anondate_auth', JSON.stringify({
                email: email,
                timestamp: new Date().toISOString()
            }));
        }
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(error.message || 'Login failed. Please check your credentials.');
    }
}

// Logout
function logout() {
    localStorage.removeItem('anondate_token');
    localStorage.removeItem('anondate_user');
    localStorage.removeItem('anondate_auth');
    window.location.href = 'index.html';
}

// Check Auth Status
function checkAuth() {
    const token = localStorage.getItem('anondate_token');
    if (!token && !window.location.href.includes('index.html')) {
        window.location.href = 'index.html';
    }
    return token;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // If already logged in on index page, redirect to dashboard
    if (window.location.href.includes('index.html') || window.location.pathname === '/') {
        if (localStorage.getItem('anondate_token')) {
            window.location.href = 'dashboard.html';
        }
    }
});