const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();
const fs = require('fs');

const app = express();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tlsAllowInvalidCertificates: true
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

// Middleware'ler
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session yapılandırması
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 gün
  }
}));

// View engine setup - EXPRESS-EJS-LAYOUTS'U KALDIRIYORUZ
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global değişkenler - kullanıcı bilgisi ve bildirim sayısı tüm view'lere aktarılır
app.use(async (req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  
  // Helper fonksiyonları - EJS template'lerinde kullanılacak
  res.locals.getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'zip': '📦',
      'rar': '📦',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'txt': '📃',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📽️',
      'pptx': '📽️'
    };
    return iconMap[ext] || '📎';
  };

  res.locals.formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  res.locals.formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  res.locals.getStatusText = (status) => {
    const statusMap = {
      'pending': '⏳ Beklemede',
      'in_progress': '🚀 Üretimde',
      'delivered': '✅ Teslim Edildi',
      'revision': '🔄 Revizyonda',
      'cancelled': '❌ İptal Edildi'
    };
    return statusMap[status] || status;
  };

  res.locals.getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'in_progress': 'status-in-progress',
      'delivered': 'status-delivered',
      'revision': 'status-revision',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || 'status-pending';
  };
  
  // Kullanıcı giriş yapmışsa okunmamış bildirim sayısını hesapla
  if (req.session.user) {
    try {
      const Notification = require('./models/Notification');
      res.locals.unreadNotifications = await Notification.countDocuments({
        user: req.session.user.id,
        isRead: false
      });
    } catch (error) {
      console.error('Bildirim sayısı hesaplama hatası:', error);
      res.locals.unreadNotifications = 0;
    }
  } else {
    res.locals.unreadNotifications = 0;
  }
  
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/orders', require('./routes/orders'));
app.use('/admin', require('./routes/admin'));
app.use('/messages', require('./routes/messages'));
app.use('/user', require('./routes/user'));

// Dosya indirme route'u
app.get('/files/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'uploads', 'files', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('Dosya bulunamadı');
  }
});

// Dosya önizleme route'u
app.get('/files/preview/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'uploads', 'files', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Dosya bulunamadı');
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/user/dashboard');
  }
  res.render('auth/login', { 
    title: 'WebCreate - Giriş',
    error: null 
  });
});

// 404 sayfası
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Sayfa Bulunamadı'
  });
});

// Hata yönetimi middleware'i
app.use((err, req, res, next) => {
  console.error('Uygulama hatası:', err);
  res.status(500).render('error', {
    title: 'Sunucu Hatası',
    message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
  });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 WebCreate sunucusu ${PORT} portunda çalışıyor`);
});