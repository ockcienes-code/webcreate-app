const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const router = express.Router();

// Giriş sayfası
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/user/dashboard');
  }
  res.render('auth/login', { 
    title: 'WebCreate - Giriş',
    error: null 
  });
});

// Kayıt sayfası
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/user/dashboard');
  }
  res.render('auth/register', { 
    title: 'WebCreate - Kayıt',
    error: null 
  });
});

// Giriş işlemi
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', {
        title: 'WebCreate - Giriş',
        error: 'E-posta veya şifre hatalı'
      });
    }

    const isPasswordCorrect = await user.correctPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.render('auth/login', {
        title: 'WebCreate - Giriş',
        error: 'E-posta veya şifre hatalı'
      });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.render('auth/login', {
      title: 'WebCreate - Giriş',
      error: 'Bir hata oluştu'
    });
  }
});

// Kayıt işlemi - MESSAGE KULLANMIYORUZ
router.post('/register', async (req, res) => {
  console.log('🎯 KAYIT BAŞLADI - MESSAGE KULLANILMIYOR');
  
  try {
    const { name, email, password, confirmPassword, phone, company } = req.body;

    // Validasyon
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'WebCreate - Kayıt',
        error: 'Şifreler eşleşmiyor'
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'WebCreate - Kayıt',
        error: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'WebCreate - Kayıt',
        error: 'Bu e-posta adresi zaten kullanılıyor'
      });
    }

    // Kullanıcı oluştur
    const user = new User({
      name,
      email,
      password, // Bu hash'lenecek
      phone: phone || undefined,
      company: company || undefined
    });

    await user.save();
    console.log('✅ KULLANICI OLUŞTURULDU');

    // NOTIFICATION oluştur - MESSAGE DEĞİL
    try {
      const Notification = require('../models/Notification');
      const notification = new Notification({
        user: user._id,
        title: 'Hoş Geldiniz!',
        message: 'WebCreate platformuna başarıyla kayıt oldunuz.',
        type: 'system'
      });
      await notification.save();
      console.log('✅ BİLDİRİM OLUŞTURULDU');
    } catch (notifError) {
      console.log('⚠️ Bildirim oluşturulamadı:', notifError.message);
      // Bildirim hatası kaydı durdurmaz
    }

    // Session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.redirect('/user/dashboard');

  } catch (error) {
    console.error('❌ KAYIT HATASI:', error);
    
    let errorMessage = 'Kayıt sırasında bir hata oluştu';
    if (error.name === 'ValidationError') {
      errorMessage = 'Lütfen tüm gerekli alanları doldurun';
    } else if (error.code === 11000) {
      errorMessage = 'Bu e-posta adresi zaten kullanılıyor';
    }
    
    res.render('auth/register', {
      title: 'WebCreate - Kayıt',
      error: errorMessage
    });
  }
});

// Çıkış
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/auth/login');
  });
});

module.exports = router;