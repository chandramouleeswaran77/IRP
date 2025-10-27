import React, { useState, useEffect } from 'react';
import { activityAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Avatar from '../components/UI/Avatar';
import {
  Search,
  Filter,
  Activity,
  User,
  Calendar,
  Download,
  Trash2,
  Eye,
  Clock,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const actions = ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import'];
  const resources = ['user', 'expert', 'event', 'feedback', 'system'];

  useEffect(() => {
    fetchActivities();
  }, [currentPage, searchTerm, selectedAction, selectedResource, selectedUser, startDate, endDate, sortBy, sortOrder]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        action: selectedAction,
        resource: selectedResource,
        userId: selectedUser,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      };

      const response = await activityAPI.getActivities(params);
      if (response.data.success) {
        setActivities(response.data.data.activities);
        setTotalPages(response.data.data.pagination.pages);
        setTotalActivities(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch activities error:', error);
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const params = {
        startDate,
        endDate,
        action: selectedAction,
        resource: selectedResource,
      };
      
      const response = await activityAPI.exportLogs(params);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activity_logs.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Activity logs exported successfully');
    } catch (error) {
      console.error('Export logs error:', error);
      toast.error('Failed to export activity logs');
    }
  };

  const handleCleanupLogs = async () => {
    if (window.confirm('Are you sure you want to clean up old activity logs? This action cannot be undone.')) {
      try {
        const response = await activityAPI.cleanupLogs(90); // Keep last 90 days
        toast.success(`Cleaned up ${response.data.data.deletedCount} old logs`);
        fetchActivities();
      } catch (error) {
        console.error('Cleanup logs error:', error);
        toast.error('Failed to cleanup activity logs');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAction('');
    setSelectedResource('');
    setSelectedUser('');
    setStartDate('');
    setEndDate('');
    setSortBy('timestamp');
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionVariant = (action) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'default';
      case 'delete':
        return 'destructive';
      case 'login':
        return 'secondary';
      case 'logout':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getResourceIcon = (resource) => {
    switch (resource) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'expert':
        return <Shield className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'feedback':
        return <Activity className="h-4 w-4" />;
      case 'system':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor system activities and user actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="destructive" onClick={handleCleanupLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
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
              {(selectedAction || selectedResource || selectedUser || startDate || endDate) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">All Actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resource
                </label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">All Resources</option>
                  {resources.map((resource) => (
                    <option key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {activities.length} of {totalActivities} activities
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

      {/* Activities List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="xl" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={activity.user?.profilePicture}
                      fallback={activity.user?.name?.charAt(0)}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getActionVariant(activity.action)}>
                          {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                        </Badge>
                        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                          {getResourceIcon(activity.resource)}
                          <span className="text-sm capitalize">{activity.resource}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{activity.user?.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}</span>
                        </div>
                        {activity.ipAddress && (
                          <div className="flex items-center space-x-1">
                            <span>IP: {activity.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
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
              <Activity className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No activities found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {selectedAction || selectedResource || selectedUser || startDate || endDate
                ? 'Try adjusting your search criteria'
                : 'No activities have been recorded yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivityLogs;


