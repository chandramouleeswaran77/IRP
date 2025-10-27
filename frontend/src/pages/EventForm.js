import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { eventsAPI, expertsAPI, usersAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Input, Label, Textarea, Select } from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [experts, setExperts] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      type: 'talk',
      expert: '',
      coordinator: '',
      scheduledDate: '',
      startTime: '',
      endTime: '',
      venue: '',
      capacity: 50,
      requirements: [],
      materials: [],
    },
  });

  const eventTypes = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'talk', label: 'Talk' },
    { value: 'conference', label: 'Conference' },
    { value: 'meeting', label: 'Meeting' },
  ];

  const requirementOptions = [
    'Laptop/Computer',
    'Projector',
    'Whiteboard',
    'Microphone',
    'Internet Access',
    'Power Outlets',
    'Seating Arrangement',
    'Refreshments',
    'Parking',
    'Security',
  ];

  const materialOptions = [
    'Presentation Slides',
    'Handouts',
    'Case Studies',
    'Software Demos',
    'Videos',
    'Interactive Tools',
    'Assessment Forms',
    'Certificates',
  ];

  useEffect(() => {
    fetchData();
  }, [id, isEdit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching experts and coordinators...');
      
      // Fetch experts and coordinators
      const [expertsRes, coordinatorsRes] = await Promise.all([
        expertsAPI.getExperts({ limit: 100 }),
        usersAPI.getCoordinators({ limit: 100 })
      ]);

      console.log('Experts response:', expertsRes.data);
      console.log('Coordinators response:', coordinatorsRes.data);

      if (expertsRes.data.success) {
        setExperts(expertsRes.data.data.experts);
        console.log('Experts loaded:', expertsRes.data.data.experts.length);
      } else {
        console.error('Failed to fetch experts:', expertsRes.data.message);
        toast.error('Failed to load experts');
      }
      
      if (coordinatorsRes.data.success) {
        setCoordinators(coordinatorsRes.data.data.users);
        console.log('Coordinators loaded:', coordinatorsRes.data.data.users.length);
      } else {
        console.error('Failed to fetch coordinators:', coordinatorsRes.data.message);
        toast.error('Failed to load coordinators');
      }

      // Fetch event data if editing
      if (isEdit) {
        const eventRes = await eventsAPI.getEvent(id);
        if (eventRes.data.success) {
          const eventData = eventRes.data.data.event;
          setEvent(eventData);
          
          // Set form values
          Object.keys(eventData).forEach((key) => {
            if (key === 'requirements' || key === 'materials') {
              setValue(key, eventData[key] || []);
            } else {
              setValue(key, eventData[key] || '');
            }
          });
        }
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to fetch data');
      if (isEdit) {
        navigate('/events');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (isEdit) {
        await eventsAPI.updateEvent(id, data);
        toast.success('Event updated successfully');
      } else {
        await eventsAPI.createEvent(data);
        toast.success('Event created successfully');
      }
      
      navigate('/events');
    } catch (error) {
      console.error('Submit event error:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} event`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementChange = (requirement) => {
    const currentRequirements = watch('requirements') || [];
    const updatedRequirements = currentRequirements.includes(requirement)
      ? currentRequirements.filter((r) => r !== requirement)
      : [...currentRequirements, requirement];
    setValue('requirements', updatedRequirements);
  };

  const handleMaterialChange = (material) => {
    const currentMaterials = watch('materials') || [];
    const updatedMaterials = currentMaterials.includes(material)
      ? currentMaterials.filter((m) => m !== material)
      : [...currentMaterials, material];
    setValue('materials', updatedMaterials);
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/events')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update event details' : 'Schedule a new industry visit or workshop'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Event Details
                </CardTitle>
                <CardDescription>
                  Basic information about the event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Event title is required' })}
                    className={errors.title ? 'border-red-500' : ''}
                    placeholder="e.g., AI in Healthcare Workshop"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    {...register('description', { required: 'Description is required' })}
                    className={errors.description ? 'border-red-500' : ''}
                    placeholder="Describe the event content, objectives, and what participants will learn..."
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Event Type *</Label>
                    <Select
                      id="type"
                      {...register('type', { required: 'Event type is required' })}
                      className={errors.type ? 'border-red-500' : ''}
                    >
                      {eventTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max="10000"
                      {...register('capacity', { 
                        required: 'Capacity is required',
                        min: { value: 1, message: 'Capacity must be at least 1' },
                        max: { value: 10000, message: 'Capacity cannot exceed 10000' }
                      })}
                      className={errors.capacity ? 'border-red-500' : ''}
                    />
                    {errors.capacity && (
                      <p className="text-sm text-red-500 mt-1">{errors.capacity.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule & Location
                </CardTitle>
                <CardDescription>
                  When and where the event will take place
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scheduledDate">Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    {...register('scheduledDate', { required: 'Date is required' })}
                    className={errors.scheduledDate ? 'border-red-500' : ''}
                  />
                  {errors.scheduledDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.scheduledDate.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register('startTime', { required: 'Start time is required' })}
                      className={errors.startTime ? 'border-red-500' : ''}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-500 mt-1">{errors.startTime.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      {...register('endTime', { required: 'End time is required' })}
                      className={errors.endTime ? 'border-red-500' : ''}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-500 mt-1">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    {...register('venue', { required: 'Venue is required' })}
                    className={errors.venue ? 'border-red-500' : ''}
                    placeholder="e.g., Main Auditorium, Room 101"
                  />
                  {errors.venue && (
                    <p className="text-sm text-red-500 mt-1">{errors.venue.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Participants
                </CardTitle>
                <CardDescription>
                  Select the expert and coordinator for this event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="expert">Industry Expert *</Label>
                  <Select
                    id="expert"
                    {...register('expert', { required: 'Expert is required' })}
                    className={errors.expert ? 'border-red-500' : ''}
                  >
                    <option value="">Select an expert...</option>
                    {experts.length > 0 ? (
                      experts.map((expert) => (
                        <option key={expert._id} value={expert._id}>
                          {expert.name} - {expert.company} ({expert.position})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No experts available - Add experts first</option>
                    )}
                  </Select>
                  {errors.expert && (
                    <p className="text-sm text-red-500 mt-1">{errors.expert.message}</p>
                  )}
                  {experts.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No experts found. <button type="button" onClick={() => navigate('/experts/new')} className="text-blue-600 hover:underline">Add an expert first</button>
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="coordinator">Coordinator *</Label>
                  <Select
                    id="coordinator"
                    {...register('coordinator', { required: 'Coordinator is required' })}
                    className={errors.coordinator ? 'border-red-500' : ''}
                  >
                    <option value="">Select a coordinator...</option>
                    {coordinators.length > 0 ? (
                      coordinators.map((coordinator) => (
                        <option key={coordinator._id} value={coordinator._id}>
                          {coordinator.name} ({coordinator.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No coordinators available</option>
                    )}
                  </Select>
                  {errors.coordinator && (
                    <p className="text-sm text-red-500 mt-1">{errors.coordinator.message}</p>
                  )}
                  {coordinators.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No coordinators found. Make sure you're logged in properly.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Requirements & Materials
                </CardTitle>
                <CardDescription>
                  What's needed for the event to run smoothly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Requirements</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {requirementOptions.map((requirement) => (
                      <label key={requirement} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={watch('requirements')?.includes(requirement) || false}
                          onChange={() => handleRequirementChange(requirement)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{requirement}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Materials</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {materialOptions.map((material) => (
                      <label key={material} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={watch('materials')?.includes(material) || false}
                          onChange={() => handleMaterialChange(material)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
                <CardDescription>
                  Preview of your event details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {watch('title') || 'Untitled Event'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">
                    {watch('type') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {watch('scheduledDate') || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {watch('startTime') && watch('endTime') 
                      ? `${watch('startTime')} - ${watch('endTime')}`
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {watch('capacity') || 0} participants
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    loading={loading}
                  >
                    {isEdit ? 'Update Event' : 'Create Event'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/events')}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventForm;


