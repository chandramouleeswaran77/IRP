import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        
        console.log('AuthCallback - Token:', token);
        console.log('AuthCallback - Error:', error);
        console.log('AuthCallback - All params:', Object.fromEntries(searchParams.entries()));
        
        if (error) {
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
          return;
        }
        
        if (token) {
          // Token-based authentication (preferred)
          try {
            console.log('Storing token in localStorage:', token);
            // First, store the token in localStorage
            localStorage.setItem('token', token);
            
            console.log('Calling getProfile API...');
            // Then get user profile
            const response = await authAPI.getProfile();
            console.log('Profile response:', response.data);
            
            if (response.data.success) {
              console.log('Login successful, navigating to dashboard');
              console.log('User data:', response.data.data.user);
              login(response.data.data.user, token);
              toast.success('Login successful!');
              navigate('/dashboard');
            } else {
              throw new Error('Failed to get user profile');
            }
          } catch (error) {
            console.error('Token auth error:', error);
            localStorage.removeItem('token'); // Clean up on error
            toast.error('Login failed. Please try again.');
            navigate('/login');
          }
        } else {
          // Session-based authentication (fallback)
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/session-user`, {
              credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
              login(data.data.user, data.data.token);
              toast.success('Login successful!');
              navigate('/dashboard');
            } else {
              throw new Error('No active session');
            }
          } catch (error) {
            console.error('Session auth error:', error);
            toast.error('No authentication token received');
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Login failed. Please try again.');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-lg text-muted-foreground">Completing login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;


