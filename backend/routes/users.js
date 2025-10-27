const express = require('express');
const User = require('../models/User');
const Expert = require('../models/Expert');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, authorizeRole, logActivity } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const [
      totalExperts,
      totalEvents,
      upcomingEvents,
      topRatedExperts,
      recentActivities,
      monthlyEvents,
      feedbackStats
    ] = await Promise.all([
      Expert.countDocuments({ isActive: true }),
      Event.countDocuments({ isActive: true }),
      Event.findUpcoming(5),
      Expert.getTopRated(5),
      ActivityLog.getRecentActivities(10),
      Event.aggregate([
        {
          $match: {
            isActive: true,
            scheduledDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        {
          $group: {
            _id: { $month: '$scheduledDate' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Feedback.getStatistics()
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalExperts,
          totalEvents,
          upcomingEvents: upcomingEvents.length,
          totalFeedbacks: feedbackStats[0]?.totalFeedbacks || 0
        },
        upcomingEvents,
        topRatedExperts,
        recentActivities,
        monthlyEvents,
        feedbackStats: feedbackStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, authorizeRole('admin'), logActivity('update', 'user', 'Update user role'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'coordinator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'update',
      resource: 'user',
      resourceId: req.params.id,
      description: `Updated user role to ${role}`,
      details: { newRole: role, targetUser: user.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: { user },
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// Deactivate user (admin only)
router.put('/:id/deactivate', authenticateToken, authorizeRole('admin'), logActivity('update', 'user', 'Deactivate user'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'update',
      resource: 'user',
      resourceId: req.params.id,
      description: 'Deactivated user account',
      details: { targetUser: user.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    });
  }
});

// Get user activity logs
router.get('/:id/activities', authenticateToken, async (req, res) => {
  try {
    // Users can only view their own activities unless they're admin
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own activities'
      });
    }
    
    const { limit = 50 } = req.query;
    const activities = await ActivityLog.getUserActivities(req.params.id, parseInt(limit));
    
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

module.exports = router;


