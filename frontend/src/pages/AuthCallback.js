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
    const token = searchParams.get('token');
    
    if (token) {
      // Store token and get user profile
      authAPI.getProfile()
        .then(response => {
          if (response.data.success) {
            login(response.data.data.user, token);
            toast.success('Login successful!');
            navigate('/dashboard');
          } else {
            throw new Error('Failed to get user profile');
          }
        })
        .catch(error => {
          console.error('Auth callback error:', error);
          toast.error('Login failed. Please try again.');
          navigate('/login');
        });
    } else {
      toast.error('No authentication token received');
      navigate('/login');
    }
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


