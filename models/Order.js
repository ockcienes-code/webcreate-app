const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'delivered', 'revision', 'cancelled'],
    default: 'pending'
  },
  price: {
    type: Number,
    default: 0
  },
  proposedPrice: {
    type: Number
  },
  deadline: {
    type: Date
  },
  proposedDeadline: {
    type: Date
  },
  deliveryFiles: [{
    filename: String,
    originalName: String,
    path: String,
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  revisionRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'counter_offer'],
      default: 'pending'
    },
    counterOffer: String,
    requestedAt: Date
  },
  cancellationReason: String,
  adminNotes: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index'ler
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'revisionRequest.status': 1 });

// Middleware - updatedAt otomatik güncelleme
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Statik metodlar
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status }).populate('user', 'name email');
};

orderSchema.statics.getPendingRevisions = function() {
  return this.find({ 
    'revisionRequest.requested': true,
    'revisionRequest.status': 'pending'
  }).populate('user', 'name email');
};

// Instance metodlar
orderSchema.methods.updateStatus = function(newStatus, reason = '') {
  this.status = newStatus;
  if (reason) {
    this.cancellationReason = reason;
  }
  return this.save();
};

orderSchema.methods.requestRevision = function(description) {
  this.revisionRequest = {
    requested: true,
    description,
    status: 'pending',
    requestedAt: new Date()
  };
  this.status = 'revision';
  return this.save();
};

orderSchema.methods.addDeliveryFiles = function(files) {
  this.deliveryFiles.push(...files);
  this.status = 'delivered';
  return this.save();
};

// Sanal alanlar
orderSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline;
});

orderSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Order', orderSchema);