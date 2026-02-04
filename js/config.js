// ======================
// KONFIGURASI APLIKASI
// ======================

// GANTI DENGAN URL WEB APP ANDA SETELAH DEPLOY
const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Data Sekolah
const SCHOOL_CONFIG = {
    name: 'SMP NEGERI 1 PAMARAYAN',
    address: 'Jl. Blok Pekalongan Kec. Pamarayan Kab. Serang Banten 42176',
    phone: '(0254) 123456',
    email: 'info@smpn1pamarayan.sch.id',
    website: 'www.smpn1pamarayan.sch.id'
};

// Warna Tema
const THEME_COLORS = {
    primary: '#1a237e',
    secondary: '#283593',
    success: '#4CAF50',
    danger: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
};

// Ukuran Kartu (dalam mm)
const CARD_SIZE = {
    width: 85.6,
    height: 53.98
};

// Helper Functions
async function callAPI(action, params = {}) {
    try {
        const url = new URL(API_URL);
        url.searchParams.append('action', action);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        console.log('Calling API:', url.toString());
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            message: 'Koneksi ke server gagal. Periksa koneksi internet Anda.'
        };
    }
}

async function uploadFile(file, type) {
    try {
        if (!file) {
            throw new Error('File tidak dipilih');
        }
        
        // Validasi ukuran file (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('Ukuran file maksimal 2MB');
        }
        
        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Format file harus JPG atau PNG');
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_URL}?action=upload${type}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Upload Result:', result);
        return result;
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            message: error.message || 'Upload file gagal'
        };
    }
}

// Session Management
const Session = {
    set: function(key, value) {
        try {
            if (typeof value === 'object') {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, value);
            }
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    get: function(key) {
        try {
            const value = localStorage.getItem(key);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },
    
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    },
    
    isLoggedIn: function() {
        const token = this.get('admin_token');
        if (!token) return false;
        
        // Simple token validation
        try {
            const decoded = atob(token);
            const [username, expiry] = decoded.split(':');
            return parseInt(expiry) > Date.now();
        } catch {
            return false;
        }
    },
    
    login: function(token) {
        return this.set('admin_token', token);
    },
    
    logout: function() {
        this.remove('admin_token');
        window.location.href = 'index.html';
    }
};

// Format NISN validation
function validateNISN(nisn) {
    if (!nisn || nisn.length !== 10) {
        return { valid: false, message: 'NISN harus 10 digit' };
    }
    
    if (!/^\d+$/.test(nisn)) {
        return { valid: false, message: 'NISN harus berupa angka' };
    }
    
    return { valid: true, message: '' };
}

// Show notification
function showNotification(message, type = 'info') {
    const alertClass = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    }[type];
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container') || document.body;
    container.prepend(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
    showNotification('Terjadi kesalahan dalam aplikasi', 'error');
});

// Export untuk penggunaan global
if (typeof window !== 'undefined') {
    window.APP_CONFIG = {
        API_URL,
        SCHOOL_CONFIG,
        THEME_COLORS,
        CARD_SIZE,
        callAPI,
        uploadFile,
        Session,
        validateNISN,
        showNotification
    };
    
    // Auto update API_URL from localStorage if exists
    const savedApiUrl = localStorage.getItem('api_url');
    if (savedApiUrl) {
        window.APP_CONFIG.API_URL = savedApiUrl;
    }
}
