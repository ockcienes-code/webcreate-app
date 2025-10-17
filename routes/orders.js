const express = require('express');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Sipariş oluşturma sayfası
router.get('/create', requireAuth, (req, res) => {
  res.render('user/create-order', {
    title: 'Yeni Sipariş Oluştur'
  });
});

// Sipariş oluşturma işlemi
router.post('/create', requireAuth, upload.array('files', 5), async (req, res) => {
  try {
    const { title, description } = req.body;
    const files = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path
    })) : [];

    // Yeni sipariş oluştur
    const order = new Order({
      user: req.session.user.id,
      title,
      description,
      files
    });

    await order.save();

    // Bildirim oluştur
    const notification = new Notification({
      user: req.session.user.id,
      title: 'Sipariş Oluşturuldu',
      message: `"${title}" başlıklı siparişiniz başarıyla oluşturuldu.`,
      type: 'order_approved',
      relatedOrder: order._id
    });
    await notification.save();

    res.redirect('/user/orders');

  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.render('user/create-order', {
      title: 'Yeni Sipariş Oluştur',
      content: 'create-order', // Bu satırı ekleyin
      error: 'Sipariş oluşturulurken bir hata oluştu'
    });
  }
});

// Sipariş detayı
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    
    if (!order) {
      return res.status(404).render('error', {
        title: 'Sipariş Bulunamadı',
        message: 'İstediğiniz sipariş bulunamadı.'
      });
    }

    // Kullanıcı kontrolü
    if (order.user._id.toString() !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).render('error', {
        title: 'Erişim Reddedildi',
        message: 'Bu siparişi görüntüleme yetkiniz yok.'
      });
    }

    res.render('user/order-detail', {
      title: `Sipariş: ${order.title}`,
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

// Revizyon isteği
router.post('/:id/revision', requireAuth, async (req, res) => {
  try {
    const { revisionDescription } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order || order.user.toString() !== req.session.user.id) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Sadece teslim edilen siparişler için revizyon isteyebilirsiniz' });
    }

    // Revizyon isteğini güncelle
    order.revisionRequest = {
      requested: true,
      description: revisionDescription,
      status: 'pending',
      requestedAt: new Date()
    };
    order.status = 'revision';

    await order.save();

    // Bildirim oluştur
    const notification = new Notification({
      user: req.session.user.id,
      title: 'Revizyon İsteği Gönderildi',
      message: `"${order.title}" siparişiniz için revizyon isteği gönderildi.`,
      type: 'revision_request',
      relatedOrder: order._id
    });
    await notification.save();

    res.json({ success: true, message: 'Revizyon isteği gönderildi' });

  } catch (error) {
    console.error('Revizyon isteği hatası:', error);
    res.status(500).json({ error: 'Revizyon isteği gönderilirken bir hata oluştu' });
  }
});

module.exports = router;