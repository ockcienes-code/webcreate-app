const express = require('express');
const Message = require('../models/Message.js');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// E-posta transporter'ı oluştur
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ---------------------------
// İLETİŞİM FORMU
// ---------------------------
router.post('/contact', requireAuth, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const user = req.session.user;

    if (!subject || !message) {
      return res.render('user/contact', { 
        title: 'İletişim',
        error: 'Lütfen konu ve mesaj alanlarını doldurun.',
        subject: subject,
        message: message
      });
    }

    const newMessage = new Message({
      name: name || user.name,
      email: email || user.email,
      subject,
      message
    });

    await newMessage.save();

    // Admin'e e-posta gönder (isteğe bağlı)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `WebCreate İletişim: ${subject}`,
        html: `
          <h2>Yeni İletişim Formu</h2>
          <p><strong>Ad:</strong> ${user.name}</p>
          <p><strong>E-posta:</strong> ${user.email}</p>
          <p><strong>Konu:</strong> ${subject}</p>
          <p><strong>Mesaj:</strong></p>
          <p>${message}</p>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
      // E-posta hatası form gönderimini engellemez
    }

    res.render('user/contact', { 
      title: 'İletişim',
      success: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.'
    });

  } catch (error) {
    console.error('İletişim formu hatası:', error);
    res.render('user/contact', { 
      title: 'İletişim',
      error: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
      subject: req.body.subject,
      message: req.body.message
    });
  }
});

// ---------------------------
// ADMIN MESAJ LİSTELEME
// ---------------------------
router.get('/admin', requireAdmin, async (req, res) => { // Bu zaten doğru
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.render('admin/messages', {
      title: 'Mesaj Yönetimi',
      content: 'admin',
      messages
    });
  } catch (error) {
    console.error('Mesaj listeleme hatası:', error);
    res.status(500).render('error', {
      title: 'Hata',
      message: 'Mesajlar yüklenirken bir hata oluştu'
    });
  }
});

// ---------------------------
// MESAJ YANITLAMA
// ---------------------------
router.post('/admin/:id/reply', requireAdmin, async (req, res) => {
  try {
    const { replyMessage } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }

    // Yanıt e-postası gönder
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: message.email,
      subject: `RE: ${message.subject}`,
      html: `
        <h2>WebCreate Destek Yanıtı</h2>
        <p>Sayın ${message.name},</p>
        <p>Mesajınıza yanıtınız:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
          ${replyMessage}
        </div>
        <p>Teşekkür ederiz,<br>WebCreate Ekibi</p>
      `
    };
    await transporter.sendMail(mailOptions);

    // Mesajı güncelle
    message.replied = true;
    message.replyMessage = replyMessage;
    message.isRead = true;
    await message.save();

    res.json({ success: true, message: 'Yanıt başarıyla gönderildi' });

  } catch (error) {
    console.error('Mesaj yanıtlama hatası:', error);
    res.status(500).json({ error: 'Yanıt gönderilirken bir hata oluştu' });
  }
});

// ---------------------------
// MESAJ OKUNDU İŞARETLEME
// ---------------------------
router.post('/admin/:id/read', requireAdmin, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Mesaj okundu işaretleme hatası:', error);
    res.status(500).json({ error: 'İşlem sırasında bir hata oluştu' });
  }
});

// ---------------------------
// MESAJ SİLME
// ---------------------------
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mesaj silme hatası:', error);
    res.status(500).json({ error: 'Mesaj silinirken bir hata oluştu' });
  }
});

module.exports = router;
