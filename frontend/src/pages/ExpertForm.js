import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { expertsAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Input, Label, Textarea, Select } from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Avatar from '../components/UI/Avatar';
import {
  ArrowLeft,
  Upload,
  Mail,
  Phone,
  Building,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  User,
  Briefcase,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExpertForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [expert, setExpert] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      expertise: [],
      bio: '',
      profileImage: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
      socialLinks: {
        linkedin: '',
        twitter: '',
        website: '',
      },
      availability: 'available',
    },
  });

  const expertiseOptions = [
    'Technology',
    'Business',
    'Healthcare',
    'Finance',
    'Education',
    'Engineering',
    'Marketing',
    'Design',
    'Research',
    'Consulting',
    'Data Science',
    'Artificial Intelligence',
    'Cybersecurity',
    'Sustainability',
    'Innovation',
  ];

  useEffect(() => {
    if (isEdit) {
      fetchExpert();
    }
  }, [id, isEdit]);

  const fetchExpert = async () => {
    try {
      setLoading(true);
      const response = await expertsAPI.getExpert(id);
      if (response.data.success) {
        const expertData = response.data.data.expert;
        setExpert(expertData);
        
        // Set form values
        Object.keys(expertData).forEach((key) => {
          if (key === 'address' || key === 'socialLinks') {
            Object.keys(expertData[key]).forEach((subKey) => {
              setValue(`${key}.${subKey}`, expertData[key][subKey] || '');
            });
          } else if (key === 'expertise') {
            setValue(key, expertData[key] || []);
          } else {
            setValue(key, expertData[key] || '');
          }
        });
        
        if (expertData.profileImage) {
          setImagePreview(expertData.profileImage);
        }
      }
    } catch (error) {
      console.error('Fetch expert error:', error);
      toast.error('Failed to fetch expert details');
      navigate('/experts');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (isEdit) {
        await expertsAPI.updateExpert(id, data);
        toast.success('Expert updated successfully');
      } else {
        await expertsAPI.createExpert(data);
        toast.success('Expert added successfully');
      }
      
      navigate('/experts');
    } catch (error) {
      console.error('Submit expert error:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} expert`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setValue('profileImage', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExpertiseChange = (expertise) => {
    const currentExpertise = watch('expertise') || [];
    const updatedExpertise = currentExpertise.includes(expertise)
      ? currentExpertise.filter((e) => e !== expertise)
      : [...currentExpertise, expertise];
    setValue('expertise', updatedExpertise);
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
          onClick={() => navigate('/experts')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Expert' : 'Add New Expert'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update expert information' : 'Add a new industry expert to your database'}
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
                  <User className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone', { required: 'Phone number is required' })}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      id="availability"
                      {...register('availability')}
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Unavailable</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    placeholder="Brief description about the expert..."
                    {...register('bio')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Company details and professional background
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      {...register('company', { required: 'Company is required' })}
                      className={errors.company ? 'border-red-500' : ''}
                    />
                    {errors.company && (
                      <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      {...register('position', { required: 'Position is required' })}
                      className={errors.position ? 'border-red-500' : ''}
                    />
                    {errors.position && (
                      <p className="text-sm text-red-500 mt-1">{errors.position.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Areas of Expertise *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {expertiseOptions.map((expertise) => (
                      <label key={expertise} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={watch('expertise')?.includes(expertise) || false}
                          onChange={() => handleExpertiseChange(expertise)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{expertise}</span>
                      </label>
                    ))}
                  </div>
                  {errors.expertise && (
                    <p className="text-sm text-red-500 mt-1">{errors.expertise.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  Location and contact address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address.street">Street Address</Label>
                  <Input
                    id="address.street"
                    {...register('address.street')}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address.city">City</Label>
                    <Input
                      id="address.city"
                      {...register('address.city')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.state">State</Label>
                    <Input
                      id="address.state"
                      {...register('address.state')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address.country">Country</Label>
                    <Input
                      id="address.country"
                      {...register('address.country')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address.zipCode">Zip Code</Label>
                    <Input
                      id="address.zipCode"
                      {...register('address.zipCode')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Social Links
                </CardTitle>
                <CardDescription>
                  Professional social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="socialLinks.linkedin">LinkedIn Profile</Label>
                  <Input
                    id="socialLinks.linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    {...register('socialLinks.linkedin')}
                  />
                </div>
                <div>
                  <Label htmlFor="socialLinks.twitter">Twitter Profile</Label>
                  <Input
                    id="socialLinks.twitter"
                    type="url"
                    placeholder="https://twitter.com/username"
                    {...register('socialLinks.twitter')}
                  />
                </div>
                <div>
                  <Label htmlFor="socialLinks.website">Website</Label>
                  <Input
                    id="socialLinks.website"
                    type="url"
                    placeholder="https://example.com"
                    {...register('socialLinks.website')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Image */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Image</CardTitle>
                <CardDescription>
                  Upload a professional photo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar
                    src={imagePreview}
                    fallback={watch('name')?.charAt(0) || '?'}
                    size="xl"
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload">
                      <Button variant="outline" asChild>
                        <span className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </span>
                      </Button>
                    </Label>
                  </div>
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
                    {isEdit ? 'Update Expert' : 'Create Expert'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/experts')}
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

export default ExpertForm;


