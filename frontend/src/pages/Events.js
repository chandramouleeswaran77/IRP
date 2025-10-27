import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, expertsAPI, usersAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Avatar from '../components/UI/Avatar';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedExpert, setSelectedExpert] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('scheduledDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const eventTypes = ['workshop', 'seminar', 'talk', 'conference', 'meeting'];
  const eventStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, selectedType, selectedStatus, selectedExpert, selectedCoordinator, startDate, endDate, sortBy, sortOrder]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        type: selectedType,
        status: selectedStatus,
        expertId: selectedExpert,
        coordinatorId: selectedCoordinator,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      };

      const response = await eventsAPI.getEvents(params);
      if (response.data.success) {
        setEvents(response.data.data.events);
        setTotalPages(response.data.data.pagination.pages);
        setTotalEvents(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch events error:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      try {
        await eventsAPI.deleteEvent(eventId);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (error) {
        console.error('Delete event error:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await eventsAPI.updateEventStatus(eventId, newStatus);
      toast.success(`Event status updated to ${newStatus}`);
      fetchEvents();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update event status');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedExpert('');
    setSelectedCoordinator('');
    setStartDate('');
    setEndDate('');
    setSortBy('scheduledDate');
    setSortOrder('asc');
    setCurrentPage(1);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'ongoing':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'postponed':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'ongoing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      case 'postponed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage workshops, seminars, and industry talks
          </p>
        </div>
        <Button onClick={() => navigate('/events/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
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
              {(searchTerm || selectedType || selectedStatus || selectedExpert || selectedCoordinator || startDate || endDate) && (
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
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">All Types</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  {eventStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
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
          Showing {events.length} of {totalEvents} events
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

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="xl" />
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {event.title}
                      </h3>
                      <Badge variant={getStatusVariant(event.status)}>
                        {getStatusIcon(event.status)}
                        <span className="ml-1 capitalize">{event.status}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {event.type}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(event.scheduledDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {event.venue}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {event.registeredCount}/{event.capacity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          src={event.expert?.profileImage}
                          fallback={event.expert?.name?.charAt(0)}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.expert?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {event.expert?.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Avatar
                          src={event.coordinator?.profilePicture}
                          fallback={event.coordinator?.name?.charAt(0)}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.coordinator?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Coordinator
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/events/${event._id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event._id, event.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="relative">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
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
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || selectedType || selectedStatus || selectedExpert || selectedCoordinator || startDate || endDate
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first event'}
            </p>
            <Button onClick={() => navigate('/events/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Events;


