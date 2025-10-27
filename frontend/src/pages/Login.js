import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { GraduationCap, Users, Calendar, MessageSquare } from 'lucide-react';

const Login = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    // full navigation — do not use fetch/axios
    window.location.href = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/auth/google`;
        

  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and features */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="p-3 bg-primary rounded-xl">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Industry Relation Programme
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto lg:mx-0">
              Connect academia with industry experts. Manage workshops, seminars, and talks seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Expert Management</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track industry professionals</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Calendar className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Event Scheduling</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Organize workshops & seminars</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <MessageSquare className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Feedback System</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collect & analyze feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <GraduationCap className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Insights & reporting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                type="button"
                onClick={()=>handleGoogleLogin()}
                className="w-full h-12 text-base"
                size="lg"
              >
                Continue with Google
              </Button>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;


