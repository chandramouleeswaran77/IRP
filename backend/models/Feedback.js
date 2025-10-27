const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required']
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: [true, 'Expert is required']
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Attendee is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  aspects: {
    content: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    interaction: {
      type: Number,
      min: 1,
      max: 5
    },
    relevance: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  suggestions: {
    type: String,
    trim: true,
    maxlength: [500, 'Suggestions cannot exceed 500 characters']
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
feedbackSchema.index({ event: 1 });
feedbackSchema.index({ expert: 1 });
feedbackSchema.index({ attendee: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ isActive: 1 });

// Compound index to ensure one feedback per attendee per event
feedbackSchema.index({ event: 1, attendee: 1 }, { unique: true });

// Virtual for overall satisfaction score
feedbackSchema.virtual('satisfactionScore').get(function() {
  if (!this.aspects) return this.rating;
  
  const aspects = Object.values(this.aspects).filter(val => val !== undefined);
  if (aspects.length === 0) return this.rating;
  
  const average = aspects.reduce((sum, val) => sum + val, 0) / aspects.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
});

// Static method to get feedback by expert
feedbackSchema.statics.findByExpert = function(expertId) {
  return this.find({
    expert: expertId,
    isActive: true
  })
  .populate('event', 'title scheduledDate type')
  .populate('attendee', 'name email')
  .sort({ createdAt: -1 });
};

// Static method to get feedback by event
feedbackSchema.statics.findByEvent = function(eventId) {
  return this.find({
    event: eventId,
    isActive: true
  })
  .populate('attendee', 'name email')
  .sort({ createdAt: -1 });
};

// Static method to get average rating for expert
feedbackSchema.statics.getAverageRating = function(expertId) {
  return this.aggregate([
    { $match: { expert: mongoose.Types.ObjectId(expertId), isActive: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
        averageContent: { $avg: '$aspects.content' },
        averageDelivery: { $avg: '$aspects.delivery' },
        averageInteraction: { $avg: '$aspects.interaction' },
        averageRelevance: { $avg: '$aspects.relevance' }
      }
    }
  ]);
};

// Static method to get feedback statistics
feedbackSchema.statics.getStatistics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalFeedbacks: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        highRatings: {
          $sum: {
            $cond: [{ $gte: ['$rating', 4] }, 1, 0]
          }
        },
        lowRatings: {
          $sum: {
            $cond: [{ $lte: ['$rating', 2] }, 1, 0]
          }
        },
        recommendations: {
          $sum: {
            $cond: ['$wouldRecommend', 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Feedback', feedbackSchema);


