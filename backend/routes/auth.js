const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { generateToken, authenticateToken, logActivity } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile','email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    try {
      console.log('OAuth callback reached - User:', req.user);
      
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user._id);
      console.log('Generated token:', token);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
      console.log('Redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }
  }
);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.profile,
        token: generateToken(req.user._id)
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, department, phone } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (phone) updateData.phone = phone;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'update',
      resource: 'user',
      resourceId: req.user._id,
      description: 'User updated profile',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: {
        user: user.profile
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log logout activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'logout',
      resource: 'user',
      description: 'User logged out',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user._id);
    
    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Check if user is authenticated
router.get('/check', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: true,
      user: req.user.profile
    }
  });
});

// Get user from session (for OAuth callback)
router.get('/session-user', (req, res) => {
  if (req.user) {
    const token = generateToken(req.user._id);
    res.json({
      success: true,
      data: {
        user: req.user.profile,
        token: token
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'No active session'
    });
  }
});

module.exports = router;



