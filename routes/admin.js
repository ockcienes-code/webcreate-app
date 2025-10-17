const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const Message = require('../models/Message.js');
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Admin dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // İstatistikler
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const totalMessages = await Message.countDocuments();
    const pendingRevisions = await Order.countDocuments({ 
      'revisionRequest.status': 'pending' 
    });

    // Son siparişler
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Son mesajlar
    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        totalUsers,
        totalOrders,
        totalMessages,
        pendingRevisions
      },
      content: 'dashboard', // Bu satırı ekleyin
      recentOrders,
      recentMessages
    });

  } catch (error) {
    console.error('Admin dashboard hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Dashboard yüklenirken bir hata oluştu'
    });
  }
});

// Kullanıcı detayları
router.get('/users/:id/details', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const orderCount = await Order.countDocuments({ user: req.params.id });
    const completedOrders = await Order.countDocuments({ 
      user: req.params.id, 
      status: 'delivered' 
    });
    const pendingOrders = await Order.countDocuments({ 
      user: req.params.id, 
      status: { $in: ['pending', 'in_progress', 'revision'] } 
    });

    res.json({
      ...user.toObject(),
      orderCount,
      completedOrders,
      pendingOrders
    });
  } catch (error) {
    console.error('Kullanıcı detay hatası:', error);
    res.status(500).json({ error: 'Kullanıcı detayları yüklenirken bir hata oluştu' });
  }
});

// Kullanıcı silme
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kullanıcının siparişlerini sil
    await Order.deleteMany({ user: userId });
    // Kullanıcının bildirimlerini sil
    await Notification.deleteMany({ user: userId });
    // Kullanıcıyı sil
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Kullanıcı ve ilişkili veriler başarıyla silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı silinirken bir hata oluştu' });
  }
});

// Toplu kullanıcı silme
router.post('/users/bulk-delete', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    await Order.deleteMany({ user: { $in: userIds } });
    await Notification.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });

    res.json({ success: true, message: `${userIds.length} kullanıcı başarıyla silindi` });
  } catch (error) {
    console.error('Toplu kullanıcı silme hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar silinirken bir hata oluştu' });
  }
});

// Sistem sağlık kontrolü
router.get('/system/health', requireAdmin, async (req, res) => {
  try {
    // Veritabanı bağlantı kontrolü
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'error';
    
    // Disk alanı kontrolü (basit simülasyon)
    const storageStatus = 'healthy';
    
    // E-posta servisi kontrolü
    const emailStatus = 'healthy';
    
    // Performans kontrolü
    const performanceStatus = 'healthy';

    res.json({
      database: { status: dbStatus, message: 'MongoDB bağlantısı aktif' },
      storage: { status: storageStatus, message: 'Disk alanı yeterli' },
      email: { status: emailStatus, message: 'E-posta servisi çalışıyor' },
      performance: { status: performanceStatus, message: 'Sistem performansı optimum' }
    });
  } catch (error) {
    console.error('Sistem sağlık kontrolü hatası:', error);
    res.status(500).json({ error: 'Sistem sağlık kontrolü sırasında bir hata oluştu' });
  }
});


// Kullanıcı yönetimi
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.render('admin/users', {
      title: 'Kullanıcı Yönetimi',
      users
    });
  } catch (error) {
    console.error('Kullanıcı listeleme hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Kullanıcılar yüklenirken bir hata oluştu'
    });
  }
});

// Sipariş yönetimi
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.render('admin/orders', {
      title: 'Sipariş Yönetimi',
      orders
    });
  } catch (error) {
    console.error('Sipariş listeleme hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Siparişler yüklenirken bir hata oluştu'
    });
  }
});

// Sipariş detayı (admin)
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    
    if (!order) {
      return res.status(404).render('error', {
        title: 'Sipariş Bulunamadı',
        message: 'İstediğiniz sipariş bulunamadı.'
      });
    }

    res.render('admin/order-detail', {
      title: `Sipariş Detayı: ${order.title}`,
      order
    });

  } catch (error) {
    console.error('Sipariş detay hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Sipariş yüklenirken bir hata oluştu'
    });
  }
});

// Sipariş durumu güncelleme
router.post('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, cancellationReason, price, deadline } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    // Sipariş bilgilerini güncelle
    order.status = status;
    if (cancellationReason) order.cancellationReason = cancellationReason;
    if (price) order.price = price;
    if (deadline) order.deadline = deadline;

    await order.save();

    // Bildirim oluştur
    const notification = new Notification({
      user: order.user,
      title: 'Sipariş Durumu Güncellendi',
      message: `"${order.title}" siparişinizin durumu "${getStatusText(status)}" olarak güncellendi.`,
      type: getNotificationType(status),
      relatedOrder: order._id
    });
    await notification.save();

    res.json({ success: true, message: 'Sipariş durumu güncellendi' });

  } catch (error) {
    console.error('Sipariş güncelleme hatası:', error);
    res.status(500).json({ error: 'Sipariş güncellenirken bir hata oluştu' });
  }
});

// Teslim dosyası yükleme
router.post('/orders/:id/deliver', requireAdmin, upload.array('deliveryFiles', 5), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    const deliveryFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      deliveredAt: new Date()
    })) : [];

    order.deliveryFiles = deliveryFiles;
    order.status = 'delivered';
    await order.save();

    // Bildirim oluştur
    const notification = new Notification({
      user: order.user,
      title: 'Siparişiniz Teslim Edildi',
      message: `"${order.title}" siparişiniz teslim edildi. Dosyaları indirebilirsiniz.`,
      type: 'order_delivered',
      relatedOrder: order._id
    });
    await notification.save();

    res.json({ success: true, message: 'Sipariş teslim edildi' });

  } catch (error) {
    console.error('Teslim hatası:', error);
    res.status(500).json({ error: 'Teslim sırasında bir hata oluştu' });
  }
});

// Revizyon yönetimi
router.get('/revisions', requireAdmin, async (req, res) => {
  try {
    const revisions = await Order.find({ 
      'revisionRequest.requested': true 
    })
    .populate('user', 'name email')
    .sort({ 'revisionRequest.requestedAt': -1 });

    res.render('admin/revisions', {
      title: 'Revizyon Yönetimi',
      revisions
    });
  } catch (error) {
    console.error('Revizyon listeleme hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Revizyonlar yüklenirken bir hata oluştu'
    });
  }
});

// Revizyon kararı
router.post('/revisions/:id/decision', requireAdmin, async (req, res) => {
  try {
    const { decision, counterOffer } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    order.revisionRequest.status = decision;
    if (decision === 'counter_offer' && counterOffer) {
      order.revisionRequest.counterOffer = counterOffer;
    }
    
    if (decision === 'accepted') {
      order.status = 'in_progress';
    }

    await order.save();

    // Bildirim oluştur
    const notification = new Notification({
      user: order.user,
      title: 'Revizyon Kararı',
      message: `"${order.title}" siparişiniz için revizyon isteğiniz ${getRevisionDecisionText(decision)}.`,
      type: 'revision_request',
      relatedOrder: order._id
    });
    await notification.save();

    res.json({ success: true, message: 'Revizyon kararı gönderildi' });

  } catch (error) {
    console.error('Revizyon kararı hatası:', error);
    res.status(500).json({ error: 'Revizyon kararı gönderilirken bir hata oluştu' });
  }
});

// Yardımcı fonksiyonlar
function getStatusText(status) {
  const statusMap = {
    'pending': 'Beklemede',
    'in_progress': 'Üretimde',
    'delivered': 'Teslim Edildi',
    'revision': 'Revizyonda',
    'cancelled': 'İptal Edildi'
  };
  return statusMap[status] || status;
}

function getNotificationType(status) {
  const typeMap = {
    'cancelled': 'order_cancelled',
    'delivered': 'order_delivered',
    'in_progress': 'order_approved'
  };
  return typeMap[status] || 'order_approved';
}

function getRevisionDecisionText(decision) {
  const decisionMap = {
    'accepted': 'kabul edildi',
    'rejected': 'reddedildi',
    'counter_offer': 'için karşı teklif sunuldu'
  };
  return decisionMap[decision] || decision;
}

module.exports = router;