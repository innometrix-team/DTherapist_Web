import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SessionType } from './types';
import { ChevronDown, User, Video, MapPin, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  getTherapistsApi, 
  getCategoriesApi, 
  ITherapist, 
  ITherapistListParams,
  convertCategoriesToObjects 
} from '../../api/Therapist.api';
import toast from 'react-hot-toast';

interface TherapistListProps {
  onBookAppointment: (therapistId: string, sessionType: SessionType) => void;
  onViewProfile: (therapistId: string) => void;
}

const TherapistList: React.FC<TherapistListProps> = ({ onBookAppointment, onViewProfile }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Function to Ensure only one dropdown opens at a time
  const toggleDropdown = (therapistId: string) => {
    setOpenDropdown(prev => prev === therapistId ? null : therapistId);
  };

  const handleBooking = (therapistId: string, sessionType: SessionType) => {
    onBookAppointment(therapistId, sessionType);
    setOpenDropdown(null);
  };

  // Add click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Fetch categories
  const { 
    data: categoriesResponse, 
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const result = await getCategoriesApi({ signal: controller.signal });
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch therapists with filters
  const { 
    data: therapistsResponse, 
    isLoading: therapistsLoading, 
    error: therapistsError,
    refetch: refetchTherapists
  } = useQuery({
    queryKey: ['therapists', selectedCategory, searchQuery, currentPage],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const params: ITherapistListParams = {
        page: currentPage,
        limit: 10,
      };
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const result = await getTherapistsApi(params, { signal: controller.signal });
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const getCostDisplay = (cost: { video: number; inPerson: number } | number | null): string => {
  if (typeof cost === 'number') {
    return `₦${cost}.00/hr`;
  }
  if (typeof cost === 'object' && cost !== null) {
    if (cost.video === cost.inPerson) {
      return `₦${cost.video}.00/hr`;
    } else {
      return `₦${cost.video}/₦${cost.inPerson}/hr`;
    }
  }
  return 'Contact for pricing';
};

  // Handle search with debouncing
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Show error messages
  useEffect(() => {
    if (categoriesError) {
      toast.error('Failed to load categories');
    }
  }, [categoriesError]);

  useEffect(() => {
    if (therapistsError) {
      toast.error('Failed to load therapists');
    }
  }, [therapistsError]);

  const renderStars = (rating: number | null) => {
    const validRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-base ${i < validRating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  // Handle image error handling
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    if (img.src !== 'https://via.placeholder.com/48x48/e5e7eb/9ca3af?text=User') {
      img.src = 'https://via.placeholder.com/48x48/e5e7eb/9ca3af?text=User';
    }
  }, []);

  const handleImageErrorLarge = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    if (img.src !== 'https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=User') {
      img.src = 'https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=User';
    }
  }, []);

  const categories = categoriesResponse?.data?.categories ? 
    convertCategoriesToObjects(categoriesResponse.data.categories) : [];
  
  const therapists = therapistsResponse?.data?.therapists || [];
  const totalPages = therapistsResponse?.data?.totalPages || 1;
  const totalCount = therapistsResponse?.data?.totalCount || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-sm p-6 m-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-3xl font-semibold">Our Counselors</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select 
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories.map((category: { id: string; name: string }) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search for Counselor"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {totalCount > 0 && `${totalCount} counselor${totalCount > 1 ? 's' : ''} found`}
          </div>
        </div>

        {/* Loading state */}
        {therapistsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading counselors...</span>
          </div>
        )}

        {/* Error state */}
        {therapistsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">Failed to load counselors</p>
            <button
              onClick={() => refetchTherapists()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No results */}
        {!therapistsLoading && !therapistsError && therapists.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No counselors found</p>
            {(selectedCategory || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!therapistsLoading && !therapistsError && therapists.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-visible">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid lg:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.8fr_0.5fr] gap-6 px-6 py-5 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <div className="font-medium text-gray-700">Names</div>
              <div className="font-medium text-gray-700">Category</div>
              <div className="font-medium text-gray-700">Reviews</div>
              <div className="font-medium text-gray-700">Experience</div>
              <div className="font-medium text-gray-700">Cost</div>
              <div className="font-medium text-gray-700">Action</div>
              <div className="font-medium text-gray-700 text-center">Profile</div>
            </div>

            {/* Table Rows */}
            {therapists.map((therapist: ITherapist) => (
              <div key={therapist.userId}>
                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.8fr_0.5fr] gap-6 px-6 py-6 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center">
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      key={`desktop-${therapist.userId}`}
                      src={therapist.profilePicture || 'https://via.placeholder.com/48x48/e5e7eb/9ca3af?text=User'}
                      alt={therapist.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={handleImageError}
                    />
                    <span className="font-medium text-gray-900 truncate">{therapist.name}</span>
                  </div>

                  {/* Category */}
                  <div className="min-w-0">
                    <span className="text-gray-600 text-sm leading-tight">{therapist.category}</span>
                  </div>

                  {/* Reviews */}
                  <div className="flex items-center">
                    <div className="flex">
                      {renderStars(therapist.reviews.averageRating)}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="flex items-center">
                    <span className="text-gray-600">{therapist.experience} years</span>
                  </div>

                  {/* Cost */}
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900">
                      {getCostDisplay(therapist.cost)}
                     </span>
                  </div>

                  {/* Action Button */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown(therapist.userId)}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <span className="whitespace-nowrap">Book Appointment</span>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${openDropdown === therapist.userId ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === therapist.userId && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-300 z-50">
                        <button
                          onClick={() => handleBooking(therapist.userId, 'video')}
                          className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100"
                        >
                          <Video className="w-5 h-5 text-primary" />
                          <span>Video Call</span>
                        </button>
                        <button
                          onClick={() => handleBooking(therapist.userId, 'physical')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <MapPin className="w-5 h-5 text-success" />
                          <span>Physical Meeting</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Icon */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onViewProfile(therapist.userId)}
                      className="p-2 hover:bg-gray-100 transition-colors border border-gray-300 rounded-full"
                      title="View Profile"
                    >
                      <User className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Mobile/Tablet Card Layout */}
                <div className="lg:hidden p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      key={`mobile-${therapist.userId}`}
                      src={therapist.profilePicture || 'https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=User'}
                      alt={therapist.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={handleImageErrorLarge}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-lg mb-1">{therapist.name}</h3>
                      <p className="text-gray-600 mb-2">{therapist.category}</p>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex">
                          {renderStars(therapist.reviews.averageRating)}
                        </div>
                        <span className="text-gray-600">{therapist.experience} years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                      {getCostDisplay(therapist.cost)}
                     </span>
                        <button
                          onClick={() => onViewProfile(therapist.userId)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Action Button */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown(therapist.userId)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span>Book Appointment</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === therapist.userId ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Mobile Dropdown Menu */}
                    {openDropdown === therapist.userId && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-lg border z-50">
                        <button
                          onClick={() => handleBooking(therapist.userId, 'video')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100"
                        >
                          <Video className="w-5 h-5 text-primary" />
                          <span>Video Call</span>
                        </button>
                        <button
                          onClick={() => handleBooking(therapist.userId, 'physical')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <MapPin className="w-5 h-5 text-success" />
                          <span>Physical Meeting</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!therapistsLoading && !therapistsError && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-primary text-white border-blue-800'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistList;