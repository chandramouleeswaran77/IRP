import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  // Google OAuth login
  login: () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  },
  
  // Get user profile
  getProfile: () => api.get('/auth/profile'),
  
  // Update profile
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Refresh token
  refreshToken: () => api.post('/auth/refresh'),
  
  // Check authentication
  checkAuth: () => api.get('/auth/check'),
};

export const usersAPI = {
  // Get all users (admin only)
  getUsers: (params) => api.get('/users', { params }),
  
  // Get user by ID
  getUser: (id) => api.get(`/users/${id}`),
  
  // Update user role (admin only)
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  
  // Deactivate user (admin only)
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
  
  // Get user activities
  getUserActivities: (id, limit) => api.get(`/users/${id}/activities`, { params: { limit } }),
};

export const expertsAPI = {
  // Get all experts
  getExperts: (params) => api.get('/experts', { params }),
  
  // Get expert by ID
  getExpert: (id) => api.get(`/experts/${id}`),
  
  // Create expert
  createExpert: (data) => api.post('/experts', data),
  
  // Update expert
  updateExpert: (id, data) => api.put(`/experts/${id}`, data),
  
  // Delete expert
  deleteExpert: (id) => api.delete(`/experts/${id}`),
  
  // Get top rated experts
  getTopRated: (limit) => api.get('/experts/stats/top-rated', { params: { limit } }),
  
  // Get experts by expertise
  getByExpertise: (expertise) => api.get('/experts/stats/by-expertise', { params: { expertise } }),
  
  // Export experts
  exportExperts: () => api.get('/experts/export/csv', { responseType: 'blob' }),
};

export const eventsAPI = {
  // Get all events
  getEvents: (params) => api.get('/events', { params }),
  
  // Get event by ID
  getEvent: (id) => api.get(`/events/${id}`),
  
  // Create event
  createEvent: (data) => api.post('/events', data),
  
  // Update event
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  
  // Delete event
  deleteEvent: (id) => api.delete(`/events/${id}`),
  
  // Update event status
  updateEventStatus: (id, status) => api.put(`/events/${id}/status`, { status }),
  
  // Register for event
  registerForEvent: (id) => api.post(`/events/${id}/register`),
  
  // Get upcoming events
  getUpcoming: (limit) => api.get('/events/stats/upcoming', { params: { limit } }),
  
  // Get events by coordinator
  getByCoordinator: (coordinatorId) => api.get(`/events/stats/by-coordinator/${coordinatorId}`),
};

export const feedbackAPI = {
  // Get all feedback
  getFeedback: (params) => api.get('/feedback', { params }),
  
  // Get feedback by ID
  getFeedbackById: (id) => api.get(`/feedback/${id}`),
  
  // Submit feedback
  submitFeedback: (data) => api.post('/feedback', data),
  
  // Update feedback
  updateFeedback: (id, data) => api.put(`/feedback/${id}`, data),
  
  // Delete feedback
  deleteFeedback: (id) => api.delete(`/feedback/${id}`),
  
  // Get feedback statistics
  getStats: () => api.get('/feedback/stats/overview'),
  
  // Get feedback by expert
  getByExpert: (expertId) => api.get(`/feedback/stats/by-expert/${expertId}`),
  
  // Get feedback by event
  getByEvent: (eventId) => api.get(`/feedback/stats/by-event/${eventId}`),
};

export const activityAPI = {
  // Get all activity logs (admin only)
  getActivities: (params) => api.get('/activity', { params }),
  
  // Get activity by ID (admin only)
  getActivity: (id) => api.get(`/activity/${id}`),
  
  // Get recent activities
  getRecent: (limit) => api.get('/activity/stats/recent', { params: { limit } }),
  
  // Get activity statistics (admin only)
  getStats: (startDate, endDate) => api.get('/activity/stats/overview', { 
    params: { startDate, endDate } 
  }),
  
  // Get user activities
  getUserActivities: (userId, limit) => api.get(`/activity/user/${userId}`, { params: { limit } }),
  
  // Get resource activities
  getResourceActivities: (resource, resourceId) => api.get(`/activity/resource/${resource}/${resourceId}`),
  
  // Cleanup old logs (admin only)
  cleanupLogs: (daysToKeep) => api.delete('/activity/cleanup', { data: { daysToKeep } }),
  
  // Export activity logs (admin only)
  exportLogs: (params) => api.get('/activity/export/csv', { params, responseType: 'blob' }),
};

export const dashboardAPI = {
  // Get dashboard statistics
  getStats: () => api.get('/users/dashboard'),
};

export default api;


