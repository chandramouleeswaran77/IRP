import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Avatar from '../components/UI/Avatar';
import {
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  MoreVertical,
  UserCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedRole, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: selectedRole,
        sortBy,
        sortOrder,
      };

      const response = await usersAPI.getUsers(params);
      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.pages);
        setTotalUsers(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleDeactivateUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to deactivate ${userName}?`)) {
      try {
        await usersAPI.deactivateUser(userId);
        toast.success('User deactivated successfully');
        fetchUsers();
      } catch (error) {
        console.error('Deactivate user error:', error);
        toast.error('Failed to deactivate user');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'coordinator':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (isActive) => {
    return isActive ? 'success' : 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              {(searchTerm || selectedRole) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="coordinator">Coordinator</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="lastLogin-desc">Last Login</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {users.length} of {totalUsers} users
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
          <select
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            of {totalPages}
          </span>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="xl" />
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={user.profilePicture}
                      fallback={user.name?.charAt(0)}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </h3>
                        <Badge variant={getRoleVariant(user.role)}>
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </Badge>
                        <Badge variant={getStatusVariant(user.isActive)}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.department && (
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{user.department}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDate(user.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Last login {formatDate(user.lastLogin)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value="coordinator">Coordinator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivateUser(user._id, user.name)}
                      disabled={!user.isActive}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || selectedRole
                ? 'Try adjusting your search criteria'
                : 'No users have been registered yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users;


