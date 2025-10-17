const express = require('express');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const router = express.Router();

// Kullanıcı dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Son siparişler
    const recentOrders = await Order.find({ user: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Okunmamış bildirimler
    const unreadNotifications = await Notification.countDocuments({
      user: req.session.user.id,
      isRead: false
    });

    // Sipariş istatistikleri
    const totalOrders = await Order.countDocuments({ user: req.session.user.id });
    const pendingOrders = await Order.countDocuments({ 
      user: req.session.user.id, 
      status: 'pending' 
    });
    const deliveredOrders = await Order.countDocuments({ 
      user: req.session.user.id, 
      status: 'delivered' 
    });

    res.render('user/dashboard', {
      title: 'Dashboard',
      recentOrders,
      content: 'dashboard', // Bu satırı ekleyin
      unreadNotifications,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders
      }
    });

  } catch (error) {
    console.error('Dashboard hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Dashboard yüklenirken bir hata oluştu'
    });
  }
});

// Siparişlerim sayfası
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .sort({ createdAt: -1 });

    // Popup bildirimi için session'dan mesajı al ve sil
    const success_message = req.session.success_message;
    delete req.session.success_message;

    res.render('user/orders', {
      title: 'Siparişlerim',
      orders,
      success_message // Mesajı template'e gönder
    });

  } catch (error) {
    console.error('Siparişler hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Siparişler yüklenirken bir hata oluştu'
    });
  }
});

// Bildirimler sayfası
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.session.user.id })
      .sort({ createdAt: -1 })
      .populate('relatedOrder');

    // Bildirimleri okundu olarak işaretle
    await Notification.updateMany(
      { user: req.session.user.id, isRead: false },
      { isRead: true }
    );

    res.render('user/notifications', {
      title: 'Bildirimler',
      notifications
    });

  } catch (error) {
    console.error('Bildirimler hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Bildirimler yüklenirken bir hata oluştu'
    });
  }
});

// İletişim sayfası
router.get('/contact', requireAuth, (req, res) => {
  res.render('user/contact', {
    title: 'İletişim'
  });
});

module.exports = router;