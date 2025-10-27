const express = require('express');
const Event = require('../models/Event');
const Expert = require('../models/Expert');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, authorizeRole, logActivity } = require('../middleware/auth');

const router = express.Router();

// Get all events with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type = '', 
      status = '',
      expertId = '',
      coordinatorId = '',
      startDate = '',
      endDate = '',
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;
    
    const query = { isActive: true };
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Type filter
    if (type) {
      query.type = type;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Expert filter
    if (expertId) {
      query.expert = expertId;
    }
    
    // Coordinator filter
    if (coordinatorId) {
      query.coordinator = coordinatorId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const events = await Event.find(query)
      .populate('expert', 'name company position profileImage')
      .populate('coordinator', 'name email')
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Event.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('expert', 'name company position profileImage email phone')
      .populate('coordinator', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('feedback');
    
    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
});

// Create new event
router.post('/', authenticateToken, logActivity('create', 'event', 'Add new event'), async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      coordinator: req.body.coordinator || req.user._id,
      createdBy: req.user._id
    };
    
    // Validate expert exists
    const expert = await Expert.findById(eventData.expert);
    if (!expert || !expert.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expert selected'
      });
    }
    
    // Validate coordinator exists
    const coordinator = await User.findById(eventData.coordinator);
    if (!coordinator || !coordinator.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinator selected'
      });
    }
    
    const event = new Event(eventData);
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('expert', 'name company position profileImage')
      .populate('coordinator', 'name email')
      .populate('createdBy', 'name email');
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'create',
      resource: 'event',
      resourceId: event._id,
      description: `Created new event: ${event.title}`,
      details: { 
        eventTitle: event.title, 
        expertName: expert.name,
        scheduledDate: event.scheduledDate,
        venue: event.venue
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json({
      success: true,
      data: { event: populatedEvent },
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// Update event
router.put('/:id', authenticateToken, logActivity('update', 'event', 'Update event'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('expert', 'name company position profileImage')
    .populate('coordinator', 'name email')
    .populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'update',
      resource: 'event',
      resourceId: req.params.id,
      description: `Updated event: ${event.title}`,
      details: { 
        eventTitle: event.title,
        status: event.status,
        scheduledDate: event.scheduledDate
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: { event },
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// Delete event (soft delete)
router.delete('/:id', authenticateToken, logActivity('delete', 'event', 'Delete event'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'delete',
      resource: 'event',
      resourceId: req.params.id,
      description: `Deleted event: ${event.title}`,
      details: { 
        eventTitle: event.title,
        expertName: event.expert,
        scheduledDate: event.scheduledDate
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

// Update event status
router.put('/:id/status', authenticateToken, logActivity('update', 'event', 'Update event status'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
    .populate('expert', 'name company position profileImage')
    .populate('coordinator', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'update',
      resource: 'event',
      resourceId: req.params.id,
      description: `Updated event status to ${status}`,
      details: { 
        eventTitle: event.title,
        oldStatus: event.status,
        newStatus: status
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: { event },
      message: `Event status updated to ${status}`
    });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event status'
    });
  }
});

// Register for event
router.post('/:id/register', authenticateToken, logActivity('create', 'event', 'Register for event'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    if (event.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration'
      });
    }
    
    await event.register();
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'create',
      resource: 'event',
      resourceId: req.params.id,
      description: `Registered for event: ${event.title}`,
      details: { 
        eventTitle: event.title,
        registeredCount: event.registeredCount
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Successfully registered for the event',
      data: { registeredCount: event.registeredCount }
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register for event'
    });
  }
});

// Get upcoming events
router.get('/stats/upcoming', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const events = await Event.findUpcoming(parseInt(limit));
    
    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events'
    });
  }
});

// Get events by coordinator
router.get('/stats/by-coordinator/:coordinatorId', authenticateToken, async (req, res) => {
  try {
    const events = await Event.findByCoordinator(req.params.coordinatorId);
    
    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Get events by coordinator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events by coordinator'
    });
  }
});

module.exports = router;


