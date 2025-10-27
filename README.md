# Industry Relation Programme

A modern web application for colleges/universities to manage industry expert visits, workshops, seminars, and talks.

## 🚀 Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: Google OAuth + JWT
- **API Calls**: Axios
- **Form Validation**: React Hook Form
- **Charts**: Chart.js
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
industry-relation-programme/
├── frontend/          # React.js frontend
├── backend/           # Node.js + Express backend
├── package.json       # Root package.json for scripts
└── README.md          # This file
```

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd industry-relation-programme
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Configure your Google OAuth credentials and MongoDB connection

4. **Run the application**
   ```bash
   npm run dev
   ```

## 🌟 Features

- **Authentication**: Google OAuth + JWT
- **Dashboard**: Analytics and summary cards
- **Expert Management**: CRUD operations with profile images
- **Event Management**: Schedule and track industry visits
- **Feedback System**: Rate experts and collect feedback
- **Role-Based Access**: Admin and Coordinator roles
- **Activity Logs**: Track all system activities
- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Theme switching
- **Export Features**: CSV/PDF export capabilities

## 📱 Pages

1. **Login Page**: Google OAuth authentication
2. **Dashboard**: Overview with analytics
3. **Expert List**: Manage industry experts
4. **Add/Edit Expert**: Expert profile management
5. **Events**: Schedule and track events
6. **Feedback**: Rate and review experts
7. **Activity Logs**: System activity tracking

## 🔧 Development

- **Frontend**: `cd frontend && npm start`
- **Backend**: `cd backend && npm run dev`
- **Both**: `npm run dev` (from root)

## 🚀 Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- **Database**: MongoDB Atlas

