
// this is the mongoose.model for Event with advanced schema features
const mongoose = require('mongoose');
// console.log('Loading Event model');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['workshop', 'seminar', 'talk', 'conference', 'meeting'],
    default: 'talk'
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: [true, 'Expert is required']
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Coordinator is required']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true,
    maxlength: [200, 'Venue cannot exceed 200 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [10000, 'Capacity cannot exceed 10000']
  },
  registeredCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  requirements: {
    type: [String],
    default: []
  },
  materials: {
    type: [String],
    default: []
  },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    default: null
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ scheduledDate: 1 });
eventSchema.index({ expert: 1 });
eventSchema.index({ coordinator: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ isActive: 1 });

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  const start = this.startTime.split(':');
  const end = this.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  const durationMinutes = endMinutes - startMinutes;
  
  if (durationMinutes < 0) {
    return 'Invalid time range';
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
});

// Virtual for availability status
eventSchema.virtual('isAvailable').get(function() {
  return this.registeredCount < this.capacity;
});

// Method to register for event
eventSchema.methods.register = function() {
  if (this.registeredCount < this.capacity) {
    this.registeredCount += 1;
    return this.save();
  }
  throw new Error('Event is at full capacity');
};

// Method to cancel registration
eventSchema.methods.cancelRegistration = function() {
  if (this.registeredCount > 0) {
    this.registeredCount -= 1;
    return this.save();
  }
  throw new Error('No registrations to cancel');
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({
    scheduledDate: { $gte: new Date() },
    status: 'scheduled',
    isActive: true
  })
  .populate('expert', 'name company position profileImage')
  .populate('coordinator', 'name email')
  .sort({ scheduledDate: 1 })
  .limit(limit);
};

// Static method to find events by expert
eventSchema.statics.findByExpert = function(expertId) {
  return this.find({
    expert: expertId,
    isActive: true
  })
  .populate('expert', 'name company position')
  .populate('coordinator', 'name email')
  .sort({ scheduledDate: -1 });
};

// Static method to find events by coordinator
eventSchema.statics.findByCoordinator = function(coordinatorId) {
  return this.find({
    coordinator: coordinatorId,
    isActive: true
  })
  .populate('expert', 'name company position profileImage')
  .sort({ scheduledDate: -1 });
};

module.exports = mongoose.model('Event', eventSchema);


