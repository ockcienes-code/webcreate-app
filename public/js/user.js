// Kullanıcı paneli özel JavaScript fonksiyonları

document.addEventListener('DOMContentLoaded', function() {
    initUserDashboard();
    initOrderManagement();
    initNotificationSystem();
});

// Dashboard işlemleri
function initUserDashboard() {
    // Canlı istatistik güncelleme
    updateLiveStats();
    
    // Hızlı işlemler
    initQuickActions();
}

// Sipariş yönetimi
function initOrderManagement() {
    // Sipariş filtreleme
    const filterSelect = document.getElementById('orderFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterOrders(this.value);
        });
    }
    
    // Sipariş arama
    const searchInput = document.getElementById('orderSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchOrders(this.value);
        });
    }
}

// Bildirim sistemi
function initNotificationSystem() {
    // Gerçek zamanlı bildirim kontrolü
    setInterval(checkNewNotifications, 30000); // 30 saniyede bir
    
    // Bildirim okundu işaretleme
    markNotificationsAsRead();
}

// Canlı istatistik güncelleme
function updateLiveStats() {
    // Her 60 saniyede bir istatistikleri güncelle
    setInterval(async () => {
        try {
            const response = await fetch('/user/dashboard/stats');
            const data = await response.json();
            
            // İstatistikleri güncelle
            updateStatCards(data);
        } catch (error) {
            console.error('İstatistik güncelleme hatası:', error);
        }
    }, 60000);
}

// İstatistik kartlarını güncelle
function updateStatCards(stats) {
    const statCards = document.querySelectorAll('.stat-number');
    
    statCards.forEach(card => {
        const statType = card.closest('.stat-card').querySelector('.stat-label').textContent;
        let newValue = 0;
        
        switch(statType) {
            case 'Toplam Sipariş':
                newValue = stats.totalOrders;
                break;
            case 'Bekleyen Sipariş':
                newValue = stats.pendingOrders;
                break;
            case 'Teslim Edilen':
                newValue = stats.deliveredOrders;
                break;
            case 'Okunmamış Bildirim':
                newValue = stats.unreadNotifications;
                break;
        }
        
        // Animasyonlu sayma efekti
        animateValue(card, parseInt(card.textContent), newValue, 1000);
    });
}

// Sayı animasyonu
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Sipariş filtreleme
function filterOrders(status) {
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const rowStatus = row.querySelector('.status-badge').className;
            if (rowStatus.includes(`status-${status}`)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Sipariş arama
function searchOrders(query) {
    const rows = document.querySelectorAll('tbody tr');
    const lowerQuery = query.toLowerCase();
    
    rows.forEach(row => {
        const title = row.cells[0].textContent.toLowerCase();
        const description = row.cells[1].textContent.toLowerCase();
        
        if (title.includes(lowerQuery) || description.includes(lowerQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Hızlı işlemler
function initQuickActions() {
    // Hızlı sipariş oluşturma
    const quickOrderBtn = document.getElementById('quickOrder');
    if (quickOrderBtn) {
        quickOrderBtn.addEventListener('click', function() {
            window.location.href = '/orders/create';
        });
    }
    
    // Toplu işlemler
    initBulkActions();
}

// Toplu işlemler
function initBulkActions() {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    const bulkActions = document.getElementById('bulkActions');
    
    if (checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const selectedCount = document.querySelectorAll('.order-checkbox:checked').length;
                
                if (selectedCount > 0) {
                    bulkActions.style.display = 'block';
                    document.getElementById('selectedCount').textContent = selectedCount;
                } else {
                    bulkActions.style.display = 'none';
                }
            });
        });
    }
}

// Bildirim kontrolü
async function checkNewNotifications() {
    try {
        const response = await fetch('/user/notifications/count');
        const data = await response.json();
        
        if (data.unreadCount > 0) {
            updateNotificationBadge(data.unreadCount);
            showNewNotificationAlert(data.unreadCount);
        }
    } catch (error) {
        console.error('Bildirim kontrol hatası:', error);
    }
}

// Bildirim badge güncelleme
function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    const notificationLink = document.querySelector('a[href="/user/notifications"]');
    
    if (badge) {
        badge.textContent = count;
    } else if (notificationLink) {
        const newBadge = document.createElement('span');
        newBadge.className = 'notification-badge';
        newBadge.style.cssText = `
            background: var(--danger);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            margin-left: 5px;
            animation: pulse 2s infinite;
        `;
        newBadge.textContent = count;
        notificationLink.appendChild(newBadge);
    }
}

// Yeni bildirim uyarısı
function showNewNotificationAlert(count) {
    if (!document.hidden) {
        showNotification(`📢 ${count} yeni bildiriminiz var!`, 'info');
    }
}

// Bildirimleri okundu olarak işaretle
async function markNotificationsAsRead() {
    // Sayfa yüklendiğinde görüntülenen bildirimleri okundu olarak işaretle
    const notificationElements = document.querySelectorAll('.notification-item:not(.read)');
    
    if (notificationElements.length > 0) {
        const notificationIds = Array.from(notificationElements).map(el => el.dataset.id);
        
        try {
            await fetch('/user/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notificationIds })
            });
            
            // Yerel olarak okundu olarak işaretle
            notificationElements.forEach(el => {
                el.classList.add('read');
            });
        } catch (error) {
            console.error('Bildirim okundu işaretleme hatası:', error);
        }
    }
}

// Sipariş durumu takibi
function trackOrderStatus(orderId) {
    // WebSocket veya polling ile gerçek zamanlı durum takibi
    const eventSource = new EventSource(`/orders/${orderId}/stream`);
    
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        updateOrderStatus(orderId, data.status, data.message);
    };
    
    eventSource.onerror = function(error) {
        console.error('SSE hatası:', error);
        eventSource.close();
    };
}

// Sipariş durumu güncelleme
function updateOrderStatus(orderId, status, message) {
    const statusElement = document.querySelector(`[data-order="${orderId}"] .status-badge`);
    
    if (statusElement) {
        // Mevcut durum class'larını temizle
        statusElement.className = 'status-badge';
        // Yeni durum class'ını ekle
        statusElement.classList.add(`status-${status}`);
        
        // Durum metnini güncelle
        const statusText = {
            'pending': 'Beklemede',
            'in_progress': 'Üretimde',
            'delivered': 'Teslim Edildi',
            'revision': 'Revizyonda',
            'cancelled': 'İptal Edildi'
        };
        statusElement.textContent = statusText[status];
        
        // Bildirim göster
        if (message) {
            showNotification(message, 'info');
        }
    }
}

// Dosya indirme
function downloadFile(fileId, filename) {
    // İndirme işlemini başlat
    const link = document.createElement('a');
    link.href = `/files/download/${fileId}`;
    link.download = filename;
    link.click();
}

// Toplu dosya indirme
function downloadMultipleFiles(fileIds) {
    fileIds.forEach(fileId => {
        downloadFile(fileId, '');
    });
}

// Sipariş önizleme
function previewOrder(orderId) {
    // Modal içinde sipariş önizlemesi göster
    openModal('orderPreviewModal');
    
    // Önizleme verilerini yükle
    loadOrderPreview(orderId);
}

async function loadOrderPreview(orderId) {
    try {
        const response = await fetch(`/orders/${orderId}/preview`);
        const data = await response.json();
        
        // Önizleme modalını doldur
        document.getElementById('previewTitle').textContent = data.title;
        document.getElementById('previewDescription').textContent = data.description;
        document.getElementById('previewFiles').innerHTML = data.files.map(file => `
            <div class="file-item">
                <span>${file.originalName}</span>
                <button onclick="downloadFile('${file._id}', '${file.originalName}')">İndir</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Önizleme yükleme hatası:', error);
        showNotification('Önizleme yüklenirken bir hata oluştu', 'error');
    }
}