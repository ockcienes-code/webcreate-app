// Kullanıcı giriş kontrolü
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Admin kontrolü
exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Erişim Reddedildi',
      message: 'Bu sayfaya erişim yetkiniz yok.'
    });
  }
  next();
};