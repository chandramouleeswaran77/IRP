# Google OAuth Setup Guide

## Issues Fixed

1. **Rate Limiting**: Removed restrictive rate limiting that was blocking OAuth requests
2. **OAuth Callback**: Fixed the callback flow to properly pass JWT tokens to the frontend
3. **Session Handling**: Added proper session-based authentication as fallback
4. **Error Handling**: Improved error handling throughout the authentication flow

## Environment Variables Required

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/industry-relation-programme
DB_NAME=industry-relation-programme-new

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
REACT_APP_NAME=Industry Relation Programme
REACT_APP_VERSION=1.0.0
```

## Google OAuth Setup Steps

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. **Copy the Client ID and Client Secret** to your environment variables

## How the Fixed Authentication Flow Works

1. **User clicks "Continue with Google"** → Redirects to Google OAuth
2. **Google redirects back** → Backend receives callback with user data
3. **Backend generates JWT token** → Redirects to frontend with token in URL
4. **Frontend AuthCallback component** → Extracts token and logs user in
5. **Fallback mechanism** → If token missing, tries session-based auth

## Testing the Authentication

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm start`
3. Navigate to `http://localhost:3000/login`
4. Click "Continue with Google"
5. Complete Google OAuth flow
6. Should redirect back to dashboard successfully

## Troubleshooting

- **Rate limiting errors**: Should be resolved with the new rate limiting configuration
- **CORS errors**: Make sure FRONTEND_URL is set correctly in backend
- **Token errors**: Check JWT_SECRET is set and consistent
- **Google OAuth errors**: Verify redirect URI matches exactly in Google Console
