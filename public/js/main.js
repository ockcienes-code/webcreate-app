// Genel JavaScript fonksiyonları

// DOM yüklendikten sonra
document.addEventListener('DOMContentLoaded', function() {
  initAnimations();
  initFormValidations();
  initNotifications();
});

// Animasyonları başlat
function initAnimations() {
  // Gecikmeli animasyonlar için
  const animatedElements = document.querySelectorAll('[data-animate]');
  
  animatedElements.forEach((element, index) => {
    const delay = element.dataset.delay || index * 100;
    setTimeout(() => {
      element.classList.add('animate-fade-in');
    }, delay);
  });
}

// Form validasyonları
function initFormValidations() {
  const forms = document.querySelectorAll('form[data-validate]');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!validateForm(this)) {
        e.preventDefault();
      }
    });
  });
}

// Form validasyon fonksiyonu
function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll('[required]');
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      showFieldError(field, 'Bu alan zorunludur');
      isValid = false;
    } else {
      clearFieldError(field);
    }
  });
  
  // E-posta validasyonu
  const emailFields = form.querySelectorAll('input[type="email"]');
  emailFields.forEach(field => {
    if (field.value && !isValidEmail(field.value)) {
      showFieldError(field, 'Geçerli bir e-posta adresi girin');
      isValid = false;
    }
  });
  
  return isValid;
}

// E-posta validasyonu
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Alan hata mesajı göster
function showFieldError(field, message) {
  clearFieldError(field);
  
  field.classList.add('error');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  `;
  
  field.parentNode.appendChild(errorDiv);
}

// Alan hata mesajını temizle
function clearFieldError(field) {
  field.classList.remove('error');
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

// Bildirim işlemleri
function initNotifications() {
  // Otomatik bildirimleri kapat
  const autoAlerts = document.querySelectorAll('.alert[data-auto-dismiss]');
  
  autoAlerts.forEach(alert => {
    const delay = alert.dataset.delay || 5000;
    setTimeout(() => {
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 300);
    }, delay);
  });
}

// Bildirim göster
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type}`;
  notification.innerHTML = `
    <div class="container">
      ${message}
      <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    min-width: 300px;
    animation: slideInRight 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Otomatik kapatma
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Dosya yükleme önizleme
function initFilePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!input || !preview) return;
  
  input.addEventListener('change', function(e) {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (file.type.startsWith('image/')) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;">`;
        } else {
          preview.innerHTML = `
            <div class="file-preview">
              <i class="file-icon">📄</i>
              <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
              </div>
            </div>
          `;
        }
      };
      
      reader.readAsDataURL(file);
    }
  });
}

// Dosya boyutunu formatla
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Modal işlemleri
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Dışarı tıklayınca modal kapatma
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
});

// AJAX form gönderme
function submitFormAjax(form, successCallback, errorCallback) {
  const formData = new FormData(form);
  
  fetch(form.action, {
    method: form.method,
    body: formData,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      if (successCallback) successCallback(data);
    } else {
      if (errorCallback) errorCallback(data);
    }
  })
  .catch(error => {
    console.error('Form gönderme hatası:', error);
    if (errorCallback) errorCallback({ error: 'Bir hata oluştu' });
  });
}

// Tarih formatlama
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Loading state
function setLoadingState(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.dataset.originalText = button.textContent;
    button.textContent = 'İşleniyor...';
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    button.textContent = button.dataset.originalText;
  }
}