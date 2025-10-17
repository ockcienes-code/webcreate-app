const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  expiresAt: {
  type: Date
},
  relatedMessage: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Message'
},
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Statik metodlar
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

notificationSchema.statics.getUserNotifications = function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('relatedOrder', 'title status')
    .populate('relatedMessage', 'subject')
};

notificationSchema.statics.createSystemNotification = function(userId, title, message, type = 'system') {
  return this.create({
    user: userId,
    title,
    message,
    type,
    isRead: false
  });
};

// Instance metodlar
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

notificationSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Middleware - Eski bildirimleri temizle
notificationSchema.pre('save', function(next) {
  // 30 günden eski bildirimleri otomatik silmek için
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 gün
  next();

});

module.exports = mongoose.model('Notification', notificationSchema);
  