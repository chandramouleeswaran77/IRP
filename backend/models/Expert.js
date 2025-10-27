const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Expert name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  expertise: {
    type: [String],
    required: [true, 'At least one expertise area is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one expertise area is required'
    }
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  profileImage: {
    type: String,
    default: ''
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    }
  },
  socialLinks: {
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
expertSchema.index({ name: 1 });
expertSchema.index({ email: 1 });
expertSchema.index({ company: 1 });
expertSchema.index({ expertise: 1 });
expertSchema.index({ 'rating.average': -1 });
expertSchema.index({ isActive: 1 });

// Virtual for full address
expertSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr.street && !addr.city && !addr.state && !addr.country) {
    return '';
  }
  return [addr.street, addr.city, addr.state, addr.country, addr.zipCode]
    .filter(Boolean)
    .join(', ');
});

// Method to update rating
expertSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.count;
  return this.save();
};

// Static method to find experts by expertise
expertSchema.statics.findByExpertise = function(expertise) {
  return this.find({ 
    expertise: { $in: [expertise] },
    isActive: true 
  });
};

// Static method to get top rated experts
expertSchema.statics.getTopRated = function(limit = 10) {
  return this.find({ 
    isActive: true,
    'rating.count': { $gt: 0 }
  })
  .sort({ 'rating.average': -1 })
  .limit(limit);
};

module.exports = mongoose.model('Expert', expertSchema);


