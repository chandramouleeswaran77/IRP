const express = require('express');
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Expert = require('../models/Expert');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, logActivity } = require('../middleware/auth');

const router = express.Router();

// Get all feedback with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      eventId = '', 
      expertId = '',
      rating = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { isActive: true };
    
    // Event filter
    if (eventId) {
      query.event = eventId;
    }
    
    // Expert filter
    if (expertId) {
      query.expert = expertId;
    }
    
    // Rating filter
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const feedback = await Feedback.find(query)
      .populate('event', 'title scheduledDate type')
      .populate('expert', 'name company position')
      .populate('attendee', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Feedback.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

// Get feedback by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('event', 'title scheduledDate type venue')
      .populate('expert', 'name company position profileImage')
      .populate('attendee', 'name email');
    
    if (!feedback || !feedback.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

// Create new feedback
router.post('/', authenticateToken, logActivity('create', 'feedback', 'Submit feedback'), async (req, res) => {
  try {
    const { eventId, expertId, rating, comments, aspects, suggestions, wouldRecommend, isAnonymous } = req.body;
    
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event'
      });
    }
    
    // Validate expert exists
    const expert = await Expert.findById(expertId);
    if (!expert || !expert.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expert'
      });
    }
    
    // Check if feedback already exists for this event by this user
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      attendee: req.user._id,
      isActive: true
    });
    
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this event'
      });
    }
    
    const feedbackData = {
      event: eventId,
      expert: expertId,
      attendee: req.user._id,
      rating,
      comments,
      aspects,
      suggestions,
      wouldRecommend,
      isAnonymous: isAnonymous || false
    };
    
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    
    // Update expert's average rating
    await expert.updateRating(rating);
    
    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('event', 'title scheduledDate type')
      .populate('expert', 'name company position')
      .populate('attendee', 'name email');
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'create',
      resource: 'feedback',
      resourceId: feedback._id,
      description: `Submitted feedback for event: ${event.title}`,
      details: { 
        eventTitle: event.title,
        expertName: expert.name,
        rating: rating,
        isAnonymous: isAnonymous || false
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json({
      success: true,
      data: { feedback: populatedFeedback },
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// Update feedback
router.put('/:id', authenticateToken, logActivity('update', 'feedback', 'Update feedback'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback || !feedback.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    // Users can only update their own feedback unless they're admin
    if (req.user.role !== 'admin' && feedback.attendee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own feedback'
      });
    }
    
    const oldRating = feedback.rating;
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('event', 'title scheduledDate type')
    .populate('expert', 'name company position')
    .populate('attendee', 'name email');
    
    // Update expert's rating if rating changed
    if (req.body.rating && req.body.rating !== oldRating) {
      const expert = await Expert.findById(feedback.expert);
      if (expert) {
        // Recalculate average rating
        const allFeedback = await Feedback.find({ expert: expert._id, isActive: true });
        const totalRating = allFeedback.reduce((sum, fb) => sum + fb.rating, 0);
        expert.rating.average = totalRating / allFeedback.length;
        expert.rating.count = allFeedback.length;
        await expert.save();
      }
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'update',
      resource: 'feedback',
      resourceId: req.params.id,
      description: `Updated feedback for event: ${updatedFeedback.event.title}`,
      details: { 
        eventTitle: updatedFeedback.event.title,
        expertName: updatedFeedback.expert.name,
        rating: updatedFeedback.rating
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: { feedback: updatedFeedback },
      message: 'Feedback updated successfully'
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback'
    });
  }
});

// Delete feedback (soft delete)
router.delete('/:id', authenticateToken, logActivity('delete', 'feedback', 'Delete feedback'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback || !feedback.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    // Users can only delete their own feedback unless they're admin
    if (req.user.role !== 'admin' && feedback.attendee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own feedback'
      });
    }
    
    await Feedback.findByIdAndUpdate(req.params.id, { isActive: false });
    
    // Recalculate expert's rating
    const expert = await Expert.findById(feedback.expert);
    if (expert) {
      const allFeedback = await Feedback.find({ expert: expert._id, isActive: true });
      if (allFeedback.length > 0) {
        const totalRating = allFeedback.reduce((sum, fb) => sum + fb.rating, 0);
        expert.rating.average = totalRating / allFeedback.length;
        expert.rating.count = allFeedback.length;
      } else {
        expert.rating.average = 0;
        expert.rating.count = 0;
      }
      await expert.save();
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'delete',
      resource: 'feedback',
      resourceId: req.params.id,
      description: `Deleted feedback for event: ${feedback.event}`,
      details: { 
        expertName: feedback.expert,
        rating: feedback.rating
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback'
    });
  }
});

// Get feedback statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Feedback.getStatistics();
    
    res.json({
      success: true,
      data: { stats: stats[0] || {} }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics'
    });
  }
});

// Get feedback by expert
router.get('/stats/by-expert/:expertId', authenticateToken, async (req, res) => {
  try {
    const feedback = await Feedback.findByExpert(req.params.expertId);
    const avgRating = await Feedback.getAverageRating(req.params.expertId);
    
    res.json({
      success: true,
      data: { 
        feedback,
        averageRating: avgRating[0] || {}
      }
    });
  } catch (error) {
    console.error('Get feedback by expert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback by expert'
    });
  }
});

// Get feedback by event
router.get('/stats/by-event/:eventId', authenticateToken, async (req, res) => {
  try {
    const feedback = await Feedback.findByEvent(req.params.eventId);
    
    res.json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    console.error('Get feedback by event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback by event'
    });
  }
});

module.exports = router;


