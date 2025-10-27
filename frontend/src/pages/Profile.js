import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Input, Label } from '../components/UI/Input';
import Avatar from '../components/UI/Avatar';
import { Badge } from '../components/UI/Badge';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Shield,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(data);
      if (response.data.success) {
        // Update user in context
        login(response.data.data.user, user.token);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar
                  src={user?.profilePicture}
                  fallback={user?.name?.charAt(0)}
                  size="xl"
                />
              </div>
              <CardTitle className="text-xl">{user?.name}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="flex items-center">
                  <Shield className="mr-1 h-3 w-3" />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Building className="mr-2 h-4 w-4" />
                  <span>{user?.department || 'No department assigned'}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="mr-2 h-4 w-4" />
                  <span>{user?.phone || 'No phone number'}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Joined {formatDate(user?.createdAt)}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Last login {formatDate(user?.lastLogin)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      {...register('name', { required: 'Name is required' })}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      {...register('department')}
                      placeholder="e.g., Computer Science, Business Administration"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" loading={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account Status</Label>
                  <div className="mt-1">
                    <Badge variant={user?.isActive ? 'success' : 'destructive'}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Member Since</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(user?.createdAt)}
                  </p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(user?.lastLogin)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;


