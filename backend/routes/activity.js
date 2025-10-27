const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all activity logs with pagination and filters
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action = '', 
      resource = '',
      userId = '',
      startDate = '',
      endDate = '',
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { isActive: true };
    
    // Action filter
    if (action) {
      query.action = action;
    }
    
    // Resource filter
    if (resource) {
      query.resource = resource;
    }
    
    // User filter
    if (userId) {
      query.user = userId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const activities = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs'
    });
  }
});

// Get activity log by ID
router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const activity = await ActivityLog.findById(req.params.id)
      .populate('user', 'name email role');
    
    if (!activity || !activity.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }
    
    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log'
    });
  }
});

// Get recent activities
router.get('/stats/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const activities = await ActivityLog.getRecentActivities(parseInt(limit));
    
    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
});

// Get activity statistics
router.get('/stats/overview', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await ActivityLog.getActivityStats(startDate, endDate);
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics'
    });
  }
});

// Get user activities
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    // Users can only view their own activities unless they're admin
    if (req.user.role !== 'admin' && req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own activities'
      });
    }
    
    const { limit = 50 } = req.query;
    const activities = await ActivityLog.getUserActivities(req.params.userId, parseInt(limit));
    
    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activities'
    });
  }
});

// Get resource activities
router.get('/resource/:resource/:resourceId', authenticateToken, async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    const activities = await ActivityLog.getResourceActivities(resource, resourceId);
    
    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get resource activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource activities'
    });
  }
});

// Clean old activity logs (admin only)
router.delete('/cleanup', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    
    const result = await ActivityLog.cleanOldLogs(daysToKeep);
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old activity logs`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Cleanup activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup activity logs'
    });
  }
});

// Export activity logs to CSV
router.get('/export/csv', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate, action, resource } = req.query;
    
    const query = { isActive: true };
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(10000); // Limit for performance
    
    // Convert to CSV format
    const csvHeader = 'Timestamp,User,Action,Resource,Description,IP Address\n';
    const csvData = activities.map(activity => {
      const user = activity.user ? activity.user.name : 'Unknown';
      const timestamp = activity.timestamp.toISOString();
      
      return `"${timestamp}","${user}","${activity.action}","${activity.resource}","${activity.description}","${activity.ipAddress || ''}"`;
    }).join('\n');
    
    const csv = csvHeader + csvData;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activity logs'
    });
  }
});

module.exports = router;


