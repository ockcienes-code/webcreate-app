const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  replied: { type: Boolean, default: false },
  replyMessage: String,
  category: { type: String, default: 'general' },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

// Middleware - updatedAt otomatik güncelleme
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index'ler
messageSchema.index({ email: 1, createdAt: -1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ priority: 1 });

// Statik metodlar
messageSchema.statics.getUnreadCount = function() {
  return this.countDocuments({ isRead: false });
};

messageSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

messageSchema.statics.getUrgentMessages = function() {
  return this.find({ 
    priority: 'urgent',
    status: { $in: ['new', 'in_progress'] }
  }).sort({ createdAt: -1 });
};

// Instance metodlar
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

messageSchema.methods.reply = function(replyMessage) {
  this.replied = true;
  this.replyMessage = replyMessage;
  this.status = 'resolved';
  return this.save();
};

messageSchema.methods.assignToAdmin = function(adminId) {
  this.assignedTo = adminId;
  this.status = 'in_progress';
  return this.save();
};

// Sanal alanlar
messageSchema.virtual('isNew').get(function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo && this.status === 'new';
});

messageSchema.virtual('responseTime').get(function() {
  if (!this.replied) return null;
  return this.updatedAt - this.createdAt;
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
