// Main application logic for student side

// Global variables
let currentStudent = null;
let isUploading = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplikasi Kartu Siswa SMPN 1 Pamarayan loaded');
    
    // Initialize photo upload
    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('change', handlePhotoUpload);
    }
    
    // Search form submission
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await searchStudent();
        });
    }
    
    // Check if there's a success message in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success')) {
        showSuccess('Operasi berhasil dilakukan!');
    }
});

// Search student by NISN
async function searchStudent() {
    const nisnInput = document.getElementById('nisn');
    if (!nisnInput) return;
    
    const nisn = nisnInput.value.trim();
    
    // Validation
    const validation = APP_CONFIG.validateNISN(nisn);
    if (!validation.valid) {
        showError(validation.message);
        return;
    }
    
    // Show loading
    showLoading(true);
    hideError();
    hideSuccess();
    
    // API Call
    const result = await APP_CONFIG.callAPI('getSiswa', { nisn: nisn });
    
    showLoading(false);
    
    if (result.success) {
        displayStudentData(result);
        showSuccess('Data siswa ditemukan!');
    } else {
        showError(result.message || 'Data siswa tidak ditemukan');
    }
}

// Display student data
function displayStudentData(data) {
    currentStudent = data;
    
    // Update display elements
    const elements = {
        'displayNISN': data.nisn,
        'displayNama': data.nama,
        'displayTTL': data.ttl || '-',
        'displayAlamat': data.alamat || '-'
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
    
    // Update photo
    const photoElement = document.getElementById('studentPhoto');
    if (photoElement) {
        if (data.foto && data.foto.trim() !== '') {
            photoElement.src = data.foto;
            photoElement.onerror = function() {
                this.src = 'assets/default-avatar.png';
            };
        } else {
            photoElement.src = 'assets/default-avatar.png';
        }
    }
    
    // Show student data section
    const studentDataSection = document.getElementById('studentData');
    const searchForm = document.getElementById('searchForm');
    
    if (studentDataSection) studentDataSection.classList.remove('d-none');
    if (searchForm) searchForm.classList.add('d-none');
}

// Handle photo upload
async function handlePhotoUpload(event) {
    if (isUploading || !currentStudent) return;
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
    }
    
    isUploading = true;
    showLoading(true, 'Mengupload foto...');
    
    try {
        const result = await APP_CONFIG.uploadFile(file, 'Foto');
        
        if (result.success) {
            // Update student data with new photo
            const updateResult = await APP_CONFIG.callAPI('updateSiswa', {
                nisn: currentStudent.nisn,
                foto: result.url
            });
            
            if (updateResult.success) {
                // Update photo display
                const photoElement = document.getElementById('studentPhoto');
                if (photoElement) {
                    photoElement.src = result.url;
                    currentStudent.foto = result.url;
                }
                showSuccess('Foto berhasil diupload!');
            } else {
                showError('Gagal mengupdate data: ' + (updateResult.message || 'Unknown error'));
            }
        } else {
            showError('Upload gagal: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError('Terjadi kesalahan saat upload: ' + error.message);
    } finally {
        isUploading = false;
        showLoading(false);
        event.target.value = ''; // Reset input
    }
}

// Print card
function printCard() {
    if (!currentStudent) {
        showError('Data siswa tidak tersedia');
        return;
    }
    
    // Validate required data
    if (!currentStudent.nisn || !currentStudent.nama) {
        showError('Data siswa tidak lengkap');
        return;
    }
    
    // Save data to localStorage for print page
    APP_CONFIG.Session.set('printData', currentStudent);
    
    // Open print page in new tab
    window.open('cetak.html', '_blank');
}

// Reset form
function resetForm() {
    const studentDataSection = document.getElementById('studentData');
    const searchForm = document.getElementById('searchForm');
    const nisnInput = document.getElementById('nisn');
    
    if (studentDataSection) studentDataSection.classList.add('d-none');
    if (searchForm) searchForm.classList.remove('d-none');
    if (nisnInput) {
        nisnInput.value = '';
        nisnInput.focus();
    }
    
    currentStudent = null;
    hideError();
    hideSuccess();
}

// Loading state
function showLoading(show, message = 'Mencari data siswa...') {
    const loadingElement = document.getElementById('loading');
    const searchBtn = document.getElementById('searchBtn');
    
    if (loadingElement && searchBtn) {
        if (show) {
            loadingElement.classList.remove('d-none');
            searchBtn.disabled = true;
            const messageElement = loadingElement.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
        } else {
            loadingElement.classList.add('d-none');
            searchBtn.disabled = false;
        }
    }
}

// Error handling
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const nisnInput = document.getElementById('nisn');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
    
    if (nisnInput) {
        nisnInput.classList.add('is-invalid');
        const errorFeedback = document.getElementById('nisnError');
        if (errorFeedback) {
            errorFeedback.textContent = message;
        }
    }
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    const nisnInput = document.getElementById('nisn');
    
    if (errorElement) errorElement.classList.add('d-none');
    if (nisnInput) {
        nisnInput.classList.remove('is-invalid');
        const errorFeedback = document.getElementById('nisnError');
        if (errorFeedback) errorFeedback.textContent = '';
    }
}

// Success messages
function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.remove('d-none');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            successElement.classList.add('d-none');
        }, 5000);
    }
}

function hideSuccess() {
    const successElement = document.getElementById('successMessage');
    if (successElement) successElement.classList.add('d-none');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        const searchForm = document.getElementById('searchForm');
        if (searchForm && !searchForm.classList.contains('d-none')) {
            searchStudent();
        }
    }
    
    // Escape to reset
    if (e.key === 'Escape') {
        resetForm();
    }
});

// Make functions globally available
window.searchStudent = searchStudent;
window.handlePhotoUpload = handlePhotoUpload;
window.printCard = printCard;
window.resetForm = resetForm;
