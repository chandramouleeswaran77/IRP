import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, expertsAPI, eventsAPI, feedbackAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Avatar from '../components/UI/Avatar';
import {
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Star,
  Clock,
  Plus,
  ArrowRight,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [topExperts, setTopExperts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, upcomingRes, topExpertsRes, activitiesRes] = await Promise.all([
        dashboardAPI.getStats(),
        eventsAPI.getUpcoming(5),
        expertsAPI.getTopRated(5),
        // Note: activities API would be implemented
        Promise.resolve({ data: { success: true, data: { activities: [] } } })
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (upcomingRes.data.success) {
        setUpcomingEvents(upcomingRes.data.data.events);
      }
      if (topExpertsRes.data.success) {
        setTopExperts(topExpertsRes.data.data.experts);
      }
      if (activitiesRes.data.success) {
        setRecentActivities(activitiesRes.data.data.activities);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your industry relations program.
          </p>
        </div>
        <Button onClick={() => navigate('/events/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Experts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary?.totalExperts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Industry professionals registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Workshops, seminars & talks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary?.upcomingEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary?.totalFeedbacks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Reviews collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  Your next scheduled industry visits
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/events')}
              >
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event._id}
                    className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/events/${event._id}`)}
                  >
                    <div className="flex-shrink-0">
                      <Avatar
                        src={event.expert?.profileImage}
                        fallback={event.expert?.name?.charAt(0)}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {event.expert?.name} • {event.expert?.company}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(event.scheduledDate)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(event.startTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No upcoming events
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new event.
                </p>
                <div className="mt-6">
                  <Button onClick={() => navigate('/events/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Event
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Rated Experts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Rated Experts</CardTitle>
                <CardDescription>
                  Highest rated industry professionals
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/experts')}
              >
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topExperts.length > 0 ? (
              <div className="space-y-4">
                {topExperts.map((expert, index) => (
                  <div
                    key={expert._id}
                    className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/experts/${expert._id}`)}
                  >
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Avatar
                        src={expert.profileImage}
                        fallback={expert.name?.charAt(0)}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {expert.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {expert.company} • {expert.position}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {expert.rating?.average?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No experts yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add industry experts to get started.
                </p>
                <div className="mt-6">
                  <Button onClick={() => navigate('/experts/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expert
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get things done faster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/experts/new')}
            >
              <Users className="h-6 w-6" />
              <span>Add Expert</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/events/new')}
            >
              <Calendar className="h-6 w-6" />
              <span>Schedule Event</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/feedback')}
            >
              <MessageSquare className="h-6 w-6" />
              <span>View Feedback</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;


