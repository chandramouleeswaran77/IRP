require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose'); // Import mongoose
const cors = require('cors'); // Ensure cors is imported
const { initializePassport } = require('./middleware/passport');

const app = express();

// 1️⃣ Trust proxy
app.set('trust proxy', false); // Trust the first proxy

// 2️⃣ Session middleware (keep this one)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      secure: false,           // false for http local dev
      httpOnly: true,
      sameSite: 'lax',         // 'lax' allows top-level redirects to set cookie
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(cors({
  origin: "https://irp-woad.vercel.app",
     credentials: true

}));

// 3️⃣ Initialize Passport
initializePassport(app);

// 4️⃣ Rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later'
}));

// =======================
// 🌐 CORS Configuration
// =======================
app.use(
  cors({
     origin: "https://irp-woad.vercel.app",
     credentials: true
  })
);

// =======================
// 🧠 Body Parsing Middleware
// =======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =======================
// 🗄️ MongoDB Connection
// =======================
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    dbName: process.env.DB_NAME || 'industry-relation-programme-new',
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Optional: Listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});
mongoose.connection.on('reconnected', () => {
  console.log('🔁 MongoDB reconnected successfully.');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// =======================
// 📦 Routes
// =======================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/experts', require('./routes/experts'));
app.use('/api/events', require('./routes/events'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/activity', require('./routes/activity'));

// =======================
// 🩺 Health Check
// =======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Industry Relation Programme API is running',
    timestamp: new Date().toISOString(),
  });
});

// =======================
// ❌ Error Handling Middleware
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
  });
});

// =======================
// 🚫 404 Handler
// =======================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// =======================
// 🚀 Start Server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});
