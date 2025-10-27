import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expertsAPI } from '../services/api';
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
  Download,
  Star,
  Mail,
  Phone,
  Building,
  MapPin,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Experts = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExperts, setTotalExperts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

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
  ];

  useEffect(() => {
    fetchExperts();
  }, [currentPage, searchTerm, selectedExpertise, selectedCompany, sortBy, sortOrder]);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        expertise: selectedExpertise,
        company: selectedCompany,
        sortBy,
        sortOrder,
      };

      const response = await expertsAPI.getExperts(params);
      if (response.data.success) {
        setExperts(response.data.data.experts);
        setTotalPages(response.data.data.pagination.pages);
        setTotalExperts(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch experts error:', error);
      toast.error('Failed to fetch experts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpert = async (expertId, expertName) => {
    if (window.confirm(`Are you sure you want to delete ${expertName}?`)) {
      try {
        await expertsAPI.deleteExpert(expertId);
        toast.success('Expert deleted successfully');
        fetchExperts();
      } catch (error) {
        console.error('Delete expert error:', error);
        toast.error('Failed to delete expert');
      }
    }
  };

  const handleExportExperts = async () => {
    try {
      const response = await expertsAPI.exportExperts();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'experts.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Experts exported successfully');
    } catch (error) {
      console.error('Export experts error:', error);
      toast.error('Failed to export experts');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedExpertise('');
    setSelectedCompany('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 text-yellow-500 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Experts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage industry experts and their profiles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportExperts}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => navigate('/experts/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expert
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
                  placeholder="Search experts..."
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
              {(searchTerm || selectedExpertise || selectedCompany) && (
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
                  Expertise
                </label>
                <select
                  value={selectedExpertise}
                  onChange={(e) => setSelectedExpertise(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">All Expertise</option>
                  {expertiseOptions.map((expertise) => (
                    <option key={expertise} value={expertise}>
                      {expertise}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company
                </label>
                <Input
                  placeholder="Filter by company..."
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                />
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
                  <option value="rating.average-desc">Highest Rated</option>
                  <option value="rating.average-asc">Lowest Rated</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {experts.length} of {totalExperts} experts
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

      {/* Experts Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="xl" />
        </div>
      ) : experts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map((expert) => (
            <Card key={expert._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar
                      src={expert.profileImage}
                      fallback={expert.name?.charAt(0)}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{expert.name}</CardTitle>
                      <CardDescription className="truncate">
                        {expert.position} at {expert.company}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      {renderStars(expert.rating?.average || 0)}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      ({expert.rating?.count || 0})
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="mr-2 h-4 w-4" />
                    <span className="truncate">{expert.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="mr-2 h-4 w-4" />
                    <span>{expert.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Building className="mr-2 h-4 w-4" />
                    <span className="truncate">{expert.company}</span>
                  </div>
                  {expert.address?.city && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {expert.address.city}, {expert.address.state}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {expert.expertise?.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {expert.expertise?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{expert.expertise.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <Badge
                    variant={expert.availability === 'available' ? 'success' : 'warning'}
                    className="text-xs"
                  >
                    {expert.availability}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/experts/${expert._id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpert(expert._id, expert.name)}
                    >
                      <Trash2 className="h-4 w-4" />
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
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No experts found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || selectedExpertise || selectedCompany
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first industry expert'}
            </p>
            <Button onClick={() => navigate('/experts/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expert
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Experts;


