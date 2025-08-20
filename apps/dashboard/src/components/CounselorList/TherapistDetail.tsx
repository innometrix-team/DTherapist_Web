import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SessionType } from './types';
import { ArrowLeft, Video, MapPin, Star, Loader2, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTherapistDetailsApi } from '../../api/Therapist.api';
import createReviewApi, { getTherapistReviewsApi, IReviewRequest } from '../../api/Review.api';
import toast from 'react-hot-toast';

interface TherapistDetailProps {
  therapistId: string;
  onBack: () => void;
  onBookSession: (therapistId: string, sessionType: SessionType) => void;
}

const TherapistDetail: React.FC<TherapistDetailProps> = ({ 
  therapistId, 
  onBack, 
  onBookSession 
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    clientName: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Fetch therapist details
  const { 
    data: therapistResponse, 
    isLoading: therapistLoading, 
    error: therapistError 
  } = useQuery({
    queryKey: ['therapist', therapistId],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const result = await getTherapistDetailsApi(therapistId, { signal: controller.signal });
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    enabled: !!therapistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

   // Handle image error with proper fallback
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    if (img.src !== 'https://via.placeholder.com/200x200/e5e7eb/9ca3af?text=User') {
      img.src = 'https://via.placeholder.com/200x200/e5e7eb/9ca3af?text=User';
    }
  }, []);

  // Fetch therapist reviews
  const { 
    data: reviewsResponse, 
    isLoading: reviewsLoading, 
    error: reviewsError 
  } = useQuery({
    queryKey: ['reviews', therapistId],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const result = await getTherapistReviewsApi(therapistId, { signal: controller.signal });
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    enabled: !!therapistId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create review mutation
  const { mutateAsync: createReview, isPending: creatingReview } = useMutation({
    mutationFn: (data: IReviewRequest) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return createReviewApi(data, { signal: controller.signal });
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setNewReview({ rating: 0, comment: '', clientName: '' });
      setShowReviewForm(false);
      // Refetch reviews after successful creation
      queryClient.invalidateQueries({ queryKey: ['reviews', therapistId] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const therapist = therapistResponse?.data?.therapist;
  const allReviews = reviewsResponse?.data?.reviews || [];
  const reviewStats = reviewsResponse?.data;

  // Debug logs for troubleshooting
  useEffect(() => {
  }, [therapistId, therapist, reviewsResponse, allReviews, reviewStats]);

  // Get the 5 most recent reviews and sort them by creation date
  const recentReviews = allReviews
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Carousel navigation
  const reviewsPerPage = 2;
  const totalPages = Math.ceil(recentReviews.length / reviewsPerPage);
  
  const nextReviews = () => {
    setCurrentReviewIndex((prev) => 
      prev + reviewsPerPage >= recentReviews.length ? 0 : prev + reviewsPerPage
    );
  };

  const prevReviews = () => {
    setCurrentReviewIndex((prev) => 
      prev === 0 ? Math.max(0, recentReviews.length - reviewsPerPage) : Math.max(0, prev - reviewsPerPage)
    );
  };

  const getCurrentReviews = () => {
    return recentReviews.slice(currentReviewIndex, currentReviewIndex + reviewsPerPage);
  };

  const renderStars = (rating: number | null) => {
    const validRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < validRating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const renderInteractiveStars = (rating: number, hover: number, onRate: (rating: number) => void, onHover: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRate(i + 1)}
        onMouseEnter={() => onHover(i + 1)}
        onMouseLeave={() => onHover(0)}
        className="focus:outline-none"
      >
        <Star
          className={`w-6 h-6 ${
            i < (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          } transition-colors`}
        />
      </button>
    ));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating === 0 || !newReview.comment.trim() || !newReview.clientName.trim()) {
      toast.error('Please fill in all fields and provide a rating');
      return;
    }
    
    try {
      await createReview({
        therapistId,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });
    } catch  {
      // Error is already handled in the mutation
    }
  };

  
  const handleVideoBooking = () => {
   
    onBookSession(therapistId, 'video');
  };

  const handlePhysicalBooking = () => {
    
    onBookSession(therapistId, 'physical');
  };

  // Loading state
  if (therapistLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading therapist details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (therapistError || !therapist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {therapistError ? 'Failed to load therapist' : 'Therapist not found'}
          </h2>
          <button
            onClick={onBack}
            className="text-blue-800 hover:text-primary"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 ">
      <div className="max-w-7xl m-auto ">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xl font-semibold text-black">Counselor Detail</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          {/* Left Column - Therapist Image and Buttons */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 space-y-6">
              {/* Therapist Image */}
              <div className="w-full">
                <img
                  src={therapist.profilePicture || 'https://via.placeholder.com/200x200/e5e7eb/9ca3af?text=User'}
                  alt={therapist.name}
                  className="w-full h-96 object-cover rounded-lg"
                  onError={handleImageError}
                  loading="eager"
                />
              </div>

              {/* Action Buttons - FIXED: Use correct therapistId */}
              <div className="space-y-4">
                <button
                  onClick={handleVideoBooking}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                  <Video className="w-5 h-5" />
                  <span>Book Video Session</span>
                </button>

                <button
                  onClick={handlePhysicalBooking}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Book Physical Meetings</span>
                </button>
              </div>

              {/* Advertisement Space */}
              {/* <div className="bg-gray-300 rounded-lg h-48 flex items-center justify-center text-gray-600 font-semibold text-lg">
                ADVERT SPACE
              </div> */}
            </div>
          </div>

          {/* Right Column - Therapist Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-8">
              {/* Therapist Info */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{therapist.name}</h1>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-gray-500">
                    ({therapist.reviews?.totalReviews || allReviews.length} Reviews)
                  </span>
                  <div className="flex">
                    {renderStars(therapist.reviews?.averageRating ?? reviewStats?.averageRating ?? null)}
                  </div>
                </div>
                <p className="text-gray-700 text-lg mb-2">{therapist.category}</p>
                <p className="text-gray-700 text-lg mb-2">{therapist.experience} years experience</p>
              </div>

              {/* About Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About Counselor</h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  {therapist.about ? (
                    <p>{therapist.about}</p>
                  ) : (
                    <p>
                      DTherapist is a platform that connects you with professional counselors and therapists to help you through your mental health journey.
                    </p>
                  )}
                </div>
                
                {/* Specializations */}
                {therapist.specializations && therapist.specializations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {therapist.specializations.map((specialization, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-primary rounded-full text-sm font-medium"
                        >
                          {specialization}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Reviews</h2>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                  >
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                  </button>
                </div>

                {/* Review Stats */}
                {reviewStats && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {reviewStats.averageRating?.toFixed(1) ?? '0.0'}
                        </div>
                        <div className="flex justify-center mb-2">
                          {renderStars(reviewStats.averageRating ?? null)}
                        </div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {reviewStats.totalCount ?? 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {therapist.experience}
                        </div>
                        <div className="text-sm text-gray-600">Years Experience</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4">Leave a Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={newReview.clientName}
                          onChange={(e) => setNewReview({...newReview, clientName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary "
                          placeholder="Enter your name"
                          required
                          disabled={creatingReview}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating
                        </label>
                        <div className="flex items-center space-x-1">
                          {renderInteractiveStars(
                            newReview.rating,
                            hoverRating,
                            (rating) => setNewReview({...newReview, rating}),
                            setHoverRating
                          )}
                          <span className="ml-2 text-sm text-gray-600">
                            {newReview.rating > 0 && `${newReview.rating} star${newReview.rating > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review
                        </label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={4}
                          placeholder="Share your experience with this therapist..."
                          required
                          disabled={creatingReview}
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="submit"
                          disabled={creatingReview}
                          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {creatingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                          {creatingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          disabled={creatingReview}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Reviews Loading */}
                {reviewsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Loading reviews...</span>
                  </div>
                )}

                {/* Reviews Error */}
                {reviewsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600">Failed to load reviews. Error: {reviewsError.message}</p>
                    <button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['reviews', therapistId] })}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}


                {!reviewsLoading && !reviewsError && (
                  <>
                    {recentReviews.length > 0 ? (
                      <div className="relative">
                        {/* Reviews Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {getCurrentReviews().map((review) => (
                            <div key={review._id || review.userId} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                              {/* Review Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {review.userName || 'Anonymous User'}
                                    </div>
                                    <div className="flex">
                                      {renderStars(review.rating)}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                              
                              {/* Review Comment */}
                              <p className="text-gray-600 leading-relaxed">
                                {review.comment}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Carousel Navigation */}
                        {recentReviews.length > reviewsPerPage && (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={prevReviews}
                              disabled={currentReviewIndex === 0}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Previous</span>
                            </button>

                            {/* Page Indicators */}
                            <div className="flex space-x-2">
                              {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCurrentReviewIndex(i * reviewsPerPage)}
                                  className={`w-3 h-3 rounded-full transition-colors ${
                                    Math.floor(currentReviewIndex / reviewsPerPage) === i
                                      ? 'bg-primary'
                                      : 'bg-gray-300 hover:bg-gray-400'
                                  }`}
                                />
                              ))}
                            </div>

                            <button
                              onClick={nextReviews}
                              disabled={currentReviewIndex + reviewsPerPage >= recentReviews.length}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Reviews Counter */}
                        <div className="text-center mt-4 text-sm text-gray-600">
                          Showing {Math.min(currentReviewIndex + reviewsPerPage, recentReviews.length)} of {recentReviews.length} recent reviews
                          {allReviews.length > 5 && (
                            <span className="ml-1">
                              ({allReviews.length} total reviews)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No reviews yet</p>
                        <p className="text-sm">Be the first to leave a review for this counselor!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDetail;