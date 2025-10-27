const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check user role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user can access resource
const authorizeResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Coordinator can only access their own resources
      if (req.user.role === 'coordinator') {
        const resourceId = req.params.id || req.body.coordinator || req.body.createdBy;
        
        if (resourceId && resourceId !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only access your own resources'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Resource authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Middleware to log activity
const logActivity = (action, resource, description) => {
  return async (req, res, next) => {
    try {
      // Store activity data in request for later use
      req.activityData = {
        action,
        resource,
        description: description || `${action} ${resource}`,
        userId: req.user?._id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };
      
      next();
    } catch (error) {
      console.error('Activity logging middleware error:', error);
      next(); // Don't block the request if logging fails
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeResource,
  generateToken,
  logActivity
};


