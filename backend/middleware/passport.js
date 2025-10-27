const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('./auth');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findByGoogleId(profile.id);
    
    if (user) {
      // Update last login
      await user.updateLastLogin();
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findByEmail(profile.emails[0].value);
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.profilePicture = profile.photos[0]?.value || '';
      await user.save();
      await user.updateLastLogin();
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      profilePicture: profile.photos[0]?.value || '',
      role: 'coordinator' // Default role
    });
    
    await user.save();
    await user.updateLastLogin();
    
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Middleware to initialize passport
const initializePassport = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
};

module.exports = {
  passport,
  initializePassport
};


