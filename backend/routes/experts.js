const express = require('express');
const Expert = require('../models/Expert');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, authorizeRole, logActivity } = require('../middleware/auth');

const router = express.Router();

// Get all experts with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      expertise = '', 
      company = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { isActive: true };
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Expertise filter
    if (expertise) {
      query.expertise = { $in: [expertise] };
    }
    
    // Company filter
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const experts = await Expert.find(query)
      .populate('addedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Expert.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        experts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get experts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experts'
    });
  }
});

// Get expert by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id)
      .populate('addedBy', 'name email');
    
    if (!expert || !expert.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }
    
    // Get expert's events
    const events = await Event.findByExpert(req.params.id);
    
    // Get expert's feedback
    const feedback = await Feedback.findByExpert(req.params.id);
    
    res.json({
      success: true,
      data: {
        expert,
        events,
        feedback
      }
    });
  } catch (error) {
    console.error('Get expert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert'
    });
  }
});

// Create new expert
router.post('/', authenticateToken, logActivity('create', 'expert', 'Add new expert'), async (req, res) => {
  try {
    const expertData = {
      ...req.body,
      addedBy: req.user._id
    };
    
    const expert = new Expert(expertData);
    await expert.save();
    
    const populatedExpert = await Expert.findById(expert._id)
      .populate('addedBy', 'name email');
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'create',
      resource: 'expert',
      resourceId: expert._id,
      description: `Added new expert: ${expert.name}`,
      details: { expertName: expert.name, company: expert.company },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json({
      success: true,
      data: { expert: populatedExpert },
      message: 'Expert added successfully'
    });
  } catch (error) {
    console.error('Create expert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expert'
    });
  }
});

// Update expert
router.put('/:id', authenticateToken, logActivity('update', 'expert', 'Update expert'), async (req, res) => {
  try {
    const expert = await Expert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('addedBy', 'name email');
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'update',
      resource: 'expert',
      resourceId: req.params.id,
      description: `Updated expert: ${expert.name}`,
      details: { expertName: expert.name, company: expert.company },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: { expert },
      message: 'Expert updated successfully'
    });
  } catch (error) {
    console.error('Update expert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expert'
    });
  }
});

// Delete expert (soft delete)
router.delete('/:id', authenticateToken, logActivity('delete', 'expert', 'Delete expert'), async (req, res) => {
  try {
    const expert = await Expert.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      action: 'delete',
      resource: 'expert',
      resourceId: req.params.id,
      description: `Deleted expert: ${expert.name}`,
      details: { expertName: expert.name, company: expert.company },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Expert deleted successfully'
    });
  } catch (error) {
    console.error('Delete expert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expert'
    });
  }
});

// Get top rated experts
router.get('/stats/top-rated', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const experts = await Expert.getTopRated(parseInt(limit));
    
    res.json({
      success: true,
      data: { experts }
    });
  } catch (error) {
    console.error('Get top rated experts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top rated experts'
    });
  }
});

// Get experts by expertise
router.get('/stats/by-expertise', authenticateToken, async (req, res) => {
  try {
    const { expertise } = req.query;
    
    if (!expertise) {
      return res.status(400).json({
        success: false,
        message: 'Expertise parameter is required'
      });
    }
    
    const experts = await Expert.findByExpertise(expertise);
    
    res.json({
      success: true,
      data: { experts }
    });
  } catch (error) {
    console.error('Get experts by expertise error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experts by expertise'
    });
  }
});

// Export experts to CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const experts = await Expert.find({ isActive: true })
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Convert to CSV format
    const csvHeader = 'Name,Email,Phone,Company,Position,Expertise,Rating,Added By,Added Date\n';
    const csvData = experts.map(expert => {
      const expertise = expert.expertise.join('; ');
      const addedBy = expert.addedBy ? expert.addedBy.name : 'Unknown';
      const addedDate = expert.createdAt.toISOString().split('T')[0];
      
      return `"${expert.name}","${expert.email}","${expert.phone}","${expert.company}","${expert.position}","${expertise}","${expert.rating.average}","${addedBy}","${addedDate}"`;
    }).join('\n');
    
    const csv = csvHeader + csvData;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=experts.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export experts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export experts'
    });
  }
});

module.exports = router;


