// Admin paneli özel JavaScript fonksiyonları

document.addEventListener('DOMContentLoaded', function() {
    initAdminDashboard();
    initUserManagement();
    initOrderManagement();
    initRevisionSystem();
    initMessageSystem();
});

function initAdminQuickActions() {
    // Gelecekte hızlı aksiyonlar için (Örn: Cache temizleme, bakım modu vb.)
    console.log('Hızlı aksiyonlar başlatıldı.');
}

// Admin dashboard
function initAdminDashboard() {
    // Gerçek zamanlı istatistik güncelleme
    updateAdminStats();
    
    // Sistem izleme
    initSystemMonitoring();
    
    // Hızlı aksiyonlar
    initAdminQuickActions();
}

// Kullanıcı yönetimi
function initUserManagement() {
    // Kullanıcı arama ve filtreleme
    initUserSearch();
    
    // Toplu kullanıcı işlemleri
    initBulkUserActions();
    
    // Kullanıcı istatistikleri
    loadUserStatistics();
}

// Sipariş yönetimi
function initOrderManagement() {
    // Sipariş filtreleme
    initOrderFilters();
    
    // Toplu sipariş işlemleri
    initBulkOrderActions();
    
    // Otomatik durum güncelleme
    initOrderStatusUpdates();
}

// Revizyon sistemi
function initRevisionSystem() {
    // Revizyon bildirimleri
    initRevisionNotifications();
    
    // Revizyon karar sistemi
    initRevisionDecisionSystem();
}

// Mesaj sistemi
function initMessageSystem() {
    // Mesaj okundu işaretleme
    initMessageReadStatus();
    
    // Otomatik yanıt şablonları
    initReplyTemplates();
}

// Admin istatistik güncelleme
function updateAdminStats() {
    setInterval(async () => {
        try {
            const response = await fetch('/admin/dashboard/stats');
            const data = await response.json();
            
            updateAdminStatCards(data);
        } catch (error) {
            console.error('Admin istatistik güncelleme hatası:', error);
        }
    }, 30000); // 30 saniyede bir
}

function updateAdminStatCards(stats) {
    const statElements = {
        'totalUsers': document.querySelector('[data-stat="users"]'),
        'totalOrders': document.querySelector('[data-stat="orders"]'),
        'totalMessages': document.querySelector('[data-stat="messages"]'),
        'pendingRevisions': document.querySelector('[data-stat="revisions"]')
    };
    
    Object.keys(statElements).forEach(statKey => {
        if (statElements[statKey]) {
            const currentValue = parseInt(statElements[statKey].textContent);
            const newValue = stats[statKey];
            
            if (currentValue !== newValue) {
                animateValue(statElements[statKey], currentValue, newValue, 1000);
            }
        }
    });
}

// Sistem izleme
function initSystemMonitoring() {
    // Sistem sağlık kontrolü
    checkSystemHealth();
    
    // Performans metrikleri - HATA VEREN SATIR KALDIRILDI
    // monitorPerformance(); 
}

async function checkSystemHealth() {
    try {
        const response = await fetch('/admin/system/health');
        const data = await response.json();
        
        updateHealthIndicators(data);
    } catch (error) {
        console.error('Sistem sağlık kontrolü hatası:', error);
    }
}

function updateHealthIndicators(healthData) {
    const indicators = {
        'database': document.querySelector('[data-health="database"]'),
        'storage': document.querySelector('[data-health="storage"]'),
        'email': document.querySelector('[data-health="email"]'),
        'performance': document.querySelector('[data-health="performance"]')
    };
    
    Object.keys(indicators).forEach(key => {
        if (indicators[key] && healthData[key]) {
            const status = healthData[key].status;
            indicators[key].className = `health-indicator ${status}`;
            indicators[key].title = healthData[key].message;
        }
    });
}

// Kullanıcı arama
function initUserSearch() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            searchUsers(this.value);
        }, 300));
    }
}

async function searchUsers(query) {
    try {
        const response = await fetch(`/admin/users/search?q=${encodeURIComponent(query)}`);
        const users = await response.json();
        
        updateUserTable(users);
    } catch (error) {
        console.error('Kullanıcı arama hatası:', error);
    }
}

function updateUserTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #ccc; padding: 2rem;">
                    Kullanıcı bulunamadı
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || '-'}</td>
            <td>${user.company || '-'}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="viewUserDetails('${user._id}')" class="btn" style="padding: 0.25rem 0.5rem;">
                        👁️
                    </button>
                    <button onclick="editUser('${user._id}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem;">
                        ✏️
                    </button>
                    <button onclick="deleteUser('${user._id}')" class="btn btn-danger" style="padding: 0.25rem 0.5rem;">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Sipariş filtreleme
function initOrderFilters() {
    const statusFilter = document.getElementById('orderStatusFilter');
    const dateFilter = document.getElementById('orderDateFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterOrdersByStatus(this.value);
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            filterOrdersByDate(this.value);
        });
    }
}

async function filterOrdersByStatus(status) {
    try {
        const response = await fetch(`/admin/orders/filter?status=${status}`);
        const orders = await response.json();
        
        updateOrderTable(orders);
    } catch (error) {
        console.error('Sipariş filtreleme hatası:', error);
    }
}

async function filterOrdersByDate(dateRange) {
    try {
        const response = await fetch(`/admin/orders/filter?date=${dateRange}`);
        const orders = await response.json();
        
        updateOrderTable(orders);
    } catch (error) {
        console.error('Sipariş tarih filtreleme hatası:', error);
    }
}

// Toplu kullanıcı işlemleri
function initBulkUserActions() {
    const selectAll = document.getElementById('selectAllUsers');
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    const bulkActions = document.getElementById('userBulkActions');
    
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            userCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            toggleBulkActions();
        });
    }
    
    userCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', toggleBulkActions);
    });
    
    function toggleBulkActions() {
        const selectedCount = document.querySelectorAll('.user-checkbox:checked').length;
        bulkActions.style.display = selectedCount > 0 ? 'block' : 'none';
        
        if (selectedCount > 0) {
            document.getElementById('selectedUsersCount').textContent = selectedCount;
        }
    }
}

// Kullanıcı silme
async function deleteUser(userId) {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        try {
            const response = await fetch(`/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Kullanıcı başarıyla silindi!', 'success');
                // Tabloyu yenile
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('Kullanıcı silme hatası:', error);
            showNotification('Kullanıcı silinirken bir hata oluştu!', 'error');
        }
    }
}

// Sipariş durumu güncelleme
async function updateOrderStatus(orderId, status, additionalData = {}) {
    try {
        const response = await fetch(`/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status,
                ...additionalData
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Sipariş durumu güncellendi!', 'success');
            updateOrderStatusUI(orderId, status);
        } else {
            showNotification(data.error || 'Durum güncellenirken bir hata oluştu!', 'error');
        }
    } catch (error) {
        console.error('Sipariş durumu güncelleme hatası:', error);
        showNotification('İşlem sırasında bir hata oluştu!', 'error');
    }
}

function updateOrderStatusUI(orderId, status) {
    const statusElement = document.querySelector(`[data-order="${orderId}"] .order-status`);
    if (statusElement) {
        statusElement.className = `order-status status-${status}`;
        
        const statusText = {
            'pending': '⏳ Beklemede',
            'in_progress': '🚀 Üretimde',
            'delivered': '✅ Teslim Edildi',
            'revision': '🔄 Revizyonda',
            'cancelled': '❌ İptal Edildi'
        };
        
        statusElement.textContent = statusText[status];
    }
}

// Revizyon karar sistemi
function initRevisionDecisionSystem() {
    // Revizyon modal yönetimi
    initRevisionModals();
    
    // Otomatik karar şablonları
    initDecisionTemplates();
}

function initRevisionModals() {
    // Revizyon kabul modalı
    const acceptModal = document.getElementById('acceptRevisionModal');
    if (acceptModal) {
        acceptModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    // Revizyon red modalı
    const rejectModal = document.getElementById('rejectRevisionModal');
    if (rejectModal) {
        rejectModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
}

async function submitRevisionDecision(orderId, decision, message = '') {
    try {
        const response = await fetch(`/admin/revisions/${orderId}/decision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                decision,
                counterOffer: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Revizyon kararı gönderildi!', 'success');
            closeAllModals();
            // Sayfayı yenile
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification(data.error || 'Karar gönderilirken bir hata oluştu!', 'error');
        }
    } catch (error) {
        console.error('Revizyon kararı gönderme hatası:', error);
        showNotification('İşlem sırasında bir hata oluştu!', 'error');
    }
}

// Yardımcı fonksiyonlar
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Dosya yükleme progress bar
function initFileUploadProgress() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const files = this.files;
            if (files.length > 0) {
                showUploadProgress(files);
            }
        });
    });
}

function showUploadProgress(files) {
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--dark-gray);
        border: 1px solid var(--light-gray);
        border-radius: 10px;
        padding: 1rem;
        z-index: 1000;
        min-width: 300px;
    `;
    
    progressContainer.innerHTML = `
        <h4 style="color: var(--white); margin-bottom: 1rem;">Dosya Yükleniyor...</h4>
        <div class="progress-bar" style="width: 100%; height: 4px; background: var(--medium-gray); border-radius: 2px; overflow: hidden;">
            <div class="progress-fill" style="width: 0%; height: 100%; background: var(--accent); transition: width 0.3s ease;"></div>
        </div>
        <div class="file-info" style="color: #ccc; font-size: 0.875rem; margin-top: 0.5rem;"></div>
    `;
    
    document.body.appendChild(progressContainer);
    
    // Simüle edilmiş upload progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            setTimeout(() => {
                progressContainer.remove();
                showNotification('Dosyalar başarıyla yüklendi!', 'success');
            }, 500);
        }
        
        const progressFill = progressContainer.querySelector('.progress-fill');
        const fileInfo = progressContainer.querySelector('.file-info');
        
        progressFill.style.width = progress + '%';
        fileInfo.textContent = `${Math.round(progress)}% - ${files.length} dosya`;
    }, 200);
}