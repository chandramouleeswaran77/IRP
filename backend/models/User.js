const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'coordinator'],
    default: 'coordinator'
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Keep role index, remove explicit indexes for email and googleId
userSchema.index({ role: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture,
    role: this.role,
    department: this.department,
    phone: this.phone,
    isActive: this.isActive,
    lastLogin: this.lastLogin
  };
});

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

module.exports = mongoose.model('User', userSchema);


