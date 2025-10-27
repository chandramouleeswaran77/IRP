import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackAPI, eventsAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Avatar from '../components/UI/Avatar';
import {
  Search,
  Filter,
  Star,
  MessageSquare,
  Calendar,
  User,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedExpert, setSelectedExpert] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState('');
  const [selectedExpertForFeedback, setSelectedExpertForFeedback] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeedback();
  }, [currentPage, searchTerm, selectedRating, selectedEvent, selectedExpert, sortBy, sortOrder]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        rating: selectedRating,
        eventId: selectedEvent,
        expertId: selectedExpert,
        sortBy,
        sortOrder,
      };

      const response = await feedbackAPI.getFeedback(params);
      if (response.data.success) {
        setFeedback(response.data.data.feedback);
        setTotalPages(response.data.data.pagination.pages);
        setTotalFeedback(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch feedback error:', error);
      toast.error('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRating('');
    setSelectedEvent('');
    setSelectedExpert('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getEvents({ limit: 100, status: 'completed' });
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Fetch events error:', error);
      toast.error('Failed to fetch events');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedEventForFeedback || !selectedExpertForFeedback || feedbackRating === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await feedbackAPI.submitFeedback({
        event: selectedEventForFeedback,
        expert: selectedExpertForFeedback,
        rating: feedbackRating,
        comments: feedbackComments,
      });
      toast.success('Feedback submitted successfully');
      setShowSubmitForm(false);
      setSelectedEventForFeedback('');
      setSelectedExpertForFeedback('');
      setFeedbackRating(0);
      setFeedbackComments('');
      fetchFeedback();
    } catch (error) {
      console.error('Submit feedback error:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and analyze participant feedback
          </p>
        </div>
        <Button onClick={() => { setShowSubmitForm(true); fetchEvents(); }}>
          <Plus className="mr-2 h-4 w-4" />
          Submit Feedback
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
                  placeholder="Search feedback..."
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
              {(selectedRating || selectedEvent || selectedExpert) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rating
                </label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
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
                  <option value="rating-desc">Highest Rated</option>
                  <option value="rating-asc">Lowest Rated</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {feedback.length} of {totalFeedback} feedback entries
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

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="xl" />
        </div>
      ) : feedback.length > 0 ? (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar
                        src={item.expert?.profileImage}
                        fallback={item.expert?.name?.charAt(0)}
                        size="sm"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.expert?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.expert?.company} • {item.expert?.position}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(item.rating)}
                        </div>
                        <span className={`text-lg font-semibold ${getRatingColor(item.rating)}`}>
                          {item.rating}/5
                        </span>
                      </div>
                    </div>

                    {item.comments && (
                      <div className="mb-3">
                        <p className="text-gray-700 dark:text-gray-300">
                          "{item.comments}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(item.event?.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="capitalize">{item.event?.type}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{item.attendee?.name}</span>
                      </div>
                    </div>

                    {item.aspects && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(item.aspects).map(([aspect, rating]) => (
                          <div key={aspect} className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {aspect}:
                            </span>
                            <span className="ml-1 font-medium">{rating}/5</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-2 mt-3">
                      <Badge variant={item.wouldRecommend ? 'success' : 'destructive'}>
                        {item.wouldRecommend ? (
                          <>
                            <ThumbsUp className="mr-1 h-3 w-3" />
                            Recommended
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="mr-1 h-3 w-3" />
                            Not Recommended
                          </>
                        )}
                      </Badge>
                      {item.isAnonymous && (
                        <Badge variant="outline">Anonymous</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/events/${item.event?._id}`)}
                    >
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
              <MessageSquare className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No feedback found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {selectedRating || selectedEvent || selectedExpert
                ? 'Try adjusting your search criteria'
                : 'No feedback has been submitted yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Feedback Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Submit Feedback</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSubmitForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Event *</label>
                <select
                  value={selectedEventForFeedback}
                  onChange={(e) => {
                    setSelectedEventForFeedback(e.target.value);
                    const selected = events.find(ev => ev._id === e.target.value);
                    if (selected) {
                      setSelectedExpertForFeedback(selected.expert?._id || '');
                    }
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title} - {new Date(event.scheduledDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expert</label>
                {selectedEventForFeedback && (
                  <input
                    type="text"
                    value={events.find(e => e._id === selectedEventForFeedback)?.expert?.name || 'Not assigned'}
                    disabled
                    className="w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm p-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rating *</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 cursor-pointer transition-colors ${
                          star <= feedbackRating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {feedbackRating > 0 && (
                    <span className="text-sm text-gray-600">{feedbackRating}/5</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Comments</label>
                <textarea
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  rows={4}
                  placeholder="Share your thoughts about the event..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  loading={submitting}
                >
                  Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Feedback;


