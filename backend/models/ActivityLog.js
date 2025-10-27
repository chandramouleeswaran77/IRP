const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'create', 'read', 'update', 'delete',
      'login', 'logout', 'register',
      'export', 'import', 'upload', 'download'
    ]
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    enum: ['user', 'expert', 'event', 'feedback', 'system']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resource: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ isActive: 1 });

// Compound index for efficient queries
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1 });

// Static method to log activity
activityLogSchema.statics.logActivity = function(data) {
  const log = new this({
    user: data.userId,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId || null,
    description: data.description,
    details: data.details || {},
    ipAddress: data.ipAddress,
    userAgent: data.userAgent
  });
  
  return log.save();
};

// Static method to get user activities
activityLogSchema.statics.getUserActivities = function(userId, limit = 50) {
  return this.find({
    user: userId,
    isActive: true
  })
  .populate('user', 'name email')
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to get resource activities
activityLogSchema.statics.getResourceActivities = function(resource, resourceId) {
  return this.find({
    resource: resource,
    resourceId: resourceId,
    isActive: true
  })
  .populate('user', 'name email')
  .sort({ timestamp: -1 });
};

// Static method to get recent activities
activityLogSchema.statics.getRecentActivities = function(limit = 100) {
  return this.find({
    isActive: true
  })
  .populate('user', 'name email')
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to get activity statistics
activityLogSchema.statics.getActivityStats = function(startDate, endDate) {
  const matchStage = {
    isActive: true
  };
  
  if (startDate && endDate) {
    matchStage.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        resources: {
          $push: {
            resource: '$_id.resource',
            count: '$count',
            lastActivity: '$lastActivity'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
};

// Static method to clean old logs (for maintenance)
activityLogSchema.statics.cleanOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    isActive: true
  });
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);


