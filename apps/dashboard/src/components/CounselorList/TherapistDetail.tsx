import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { SessionType } from "./types";
import {
  ArrowLeft,
  Video,
  MapPin,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTherapistDetailsApi } from "../../api/Therapist.api";
import createReviewApi, {
  getTherapistReviewsApi,
  IReviewRequest,
} from "../../api/Review.api";
import {
  getTherapistScheduleApi,
} from "../../api/TherapistSchedule.api";
import toast from "react-hot-toast";

interface TherapistDetailProps {
  therapistId: string;
  onBack: () => void;
  onBookSession: (therapistId: string, sessionType: SessionType) => void;
}

const TherapistDetail: React.FC<TherapistDetailProps> = ({
  therapistId,
  onBack,
  onBookSession,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "", clientName: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const {
    data: therapistResponse,
    isLoading: therapistLoading,
    error: therapistError,
  } = useQuery({
    queryKey: ["therapist", therapistId],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const result = await getTherapistDetailsApi(therapistId, { signal: controller.signal });
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    enabled: !!therapistId,
    staleTime: 5 * 60 * 1000,
  });

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.target as HTMLImageElement;
      if (img.src !== "https://placehold.net/avatar-4.png") {
        img.src = "https://placehold.net/avatar-4.png";
      }
    },
    []
  );

  const {
    data: reviewsResponse,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: ["reviews", therapistId],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const result = await getTherapistReviewsApi(therapistId, { signal: controller.signal });
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    enabled: !!therapistId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch schedule to check if group booking is available
  const { data: scheduleResponse } = useQuery({
    queryKey: ["therapist-schedule", therapistId, "video"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const result = await getTherapistScheduleApi(therapistId, "video", {
        signal: controller.signal,
      });
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    enabled: !!therapistId,
    staleTime: 5 * 60 * 1000,
  });

  // Determine if any schedule slot has allowGroupBooking = true
  const supportsGroupBooking = useMemo(() => {
    const schedules = scheduleResponse?.data?.schedules || [];
    return schedules.some(
      (s) => s.isAvailable && s.allowGroupBooking === true
    );
  }, [scheduleResponse?.data?.schedules]);

  const { mutateAsync: createReview, isPending: creatingReview } = useMutation({
    mutationFn: (data: IReviewRequest) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return createReviewApi(data, { signal: controller.signal });
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setNewReview({ rating: 0, comment: "", clientName: "" });
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", therapistId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const therapist = therapistResponse?.data?.therapist;

  const allReviews = useMemo(() => {
    return reviewsResponse?.data?.reviews || [];
  }, [reviewsResponse?.data?.reviews]);

  const reviewStats = reviewsResponse?.data;

  const aboutText = therapist?.about ||
    "DTherapist is a platform that connects you with professional counselors and therapists to help you through your mental health journey.";
  const aboutLines = aboutText.split('\n');
  const needsTruncation = aboutLines.length > 4 || aboutText.length > 300;

  const getTruncatedAbout = () => {
    if (!needsTruncation) return aboutText;
    if (aboutLines.length > 4) return aboutLines.slice(0, 4).join('\n');
    return aboutText.substring(0, 300) + '...';
  };

  const displayAbout = isAboutExpanded ? aboutText : getTruncatedAbout();

  const recentReviews = useMemo(() => {
    if (!allReviews || allReviews.length === 0) return [];
    return allReviews
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allReviews]);

  const nextReviews = () => {
    setCurrentReviewIndex((prev) => prev + 1 >= recentReviews.length ? 0 : prev + 1);
  };

  const prevReviews = () => {
    setCurrentReviewIndex((prev) => prev === 0 ? recentReviews.length - 1 : prev - 1);
  };

  const getCurrentReviews = useCallback(() => {
    return recentReviews.slice(currentReviewIndex, currentReviewIndex + 1);
  }, [recentReviews, currentReviewIndex]);

  const renderStars = (rating: number | null) => {
    const validRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < validRating ? "text-yellow-400" : "text-gray-300"}`}>★</span>
    ));
  };

  const renderInteractiveStars = (
    rating: number,
    hover: number,
    onRate: (rating: number) => void,
    onHover: (rating: number) => void
  ) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRate(i + 1)}
        onMouseEnter={() => onHover(i + 1)}
        onMouseLeave={() => onHover(0)}
        className="focus:outline-none"
      >
        <Star className={`w-6 h-6 ${i < (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`} />
      </button>
    ));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating === 0 || !newReview.comment.trim() || !newReview.clientName.trim()) {
      toast.error("Please fill in all fields and provide a rating");
      return;
    }
    try {
      await createReview({ therapistId, rating: newReview.rating, comment: newReview.comment.trim() });
    } catch {
      // Error handled in mutation
    }
  };

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

  if (therapistError || !therapist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {therapistError ? "Failed to load therapist" : "Therapist not found"}
          </h2>
          <button onClick={onBack} className="text-blue-800 hover:text-primary">Go back</button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl m-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xl font-semibold text-black">Counselor Detail</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 border border-gray-200">
            <div className="bg-white rounded-lg p-6 space-y-6">
              <div className="w-full">
                <img
                  src={therapist.profilePicture || "https://via.placeholder.com/200x200/e5e7eb/9ca3af?text=User"}
                  alt={therapist.name}
                  className="w-full h-96 object-cover rounded-lg"
                  onError={handleImageError}
                  loading="eager"
                />
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => onBookSession(therapistId, "video")}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                  <Video className="w-5 h-5" />
                  <span>Book Video Session</span>
                </button>

                <button
                  onClick={() => onBookSession(therapistId, "physical")}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Book Physical Meetings</span>
                </button>

                {/* Only show Team Meeting button if the therapist supports group bookings */}
                {supportsGroupBooking && (
                  <button
                    onClick={() => onBookSession(therapistId, "group")}
                    className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                  >
                    <Users className="w-5 h-5" />
                    <span>Book Team Meeting</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
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

              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About Counselor</h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <div className="whitespace-pre-line">{displayAbout}</div>
                  {needsTruncation && (
                    <button
                      onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                      className="text-primary hover:text-blue-800 font-medium text-sm transition-colors focus:outline-none"
                    >
                      {isAboutExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>
                {therapist.specializations && therapist.specializations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {therapist.specializations.map((specialization, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-primary rounded-full text-sm font-medium">
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
                    {showReviewForm ? "Cancel" : "Write a Review"}
                  </button>
                </div>

                {showReviewForm && (
                  <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4">Leave a Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                        <input
                          type="text"
                          value={newReview.clientName}
                          onChange={(e) => setNewReview({ ...newReview, clientName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter your name"
                          required
                          disabled={creatingReview}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <div className="flex items-center space-x-1">
                          {renderInteractiveStars(newReview.rating, hoverRating, (rating) => setNewReview({ ...newReview, rating }), setHoverRating)}
                          <span className="ml-2 text-sm text-gray-600">
                            {newReview.rating > 0 && `${newReview.rating} star${newReview.rating > 1 ? "s" : ""}`}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
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
                          {creatingReview ? "Submitting..." : "Submit Review"}
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

                {reviewsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Loading reviews...</span>
                  </div>
                )}

                {reviewsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600">Failed to load reviews. Error: {reviewsError.message}</p>
                    <button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["reviews", therapistId] })}
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
                        <div className="bg-gray-100 rounded-2xl p-8 mb-6 min-h-50 flex flex-col justify-between">
                          {getCurrentReviews().length > 0 && (
                            <>
                              <div className="mb-6">
                                <p className="text-gray-700 text-lg leading-relaxed italic">
                                  "{getCurrentReviews()[0].comment}"
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-lg">
                                      {getCurrentReviews()[0].userName || "Anonymous User"}
                                    </div>
                                    <div className="text-gray-600 text-sm">
                                      Patient • {formatDate(getCurrentReviews()[0].createdAt)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex">{renderStars(getCurrentReviews()[0].rating)}</div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <button
                              onClick={prevReviews}
                              disabled={currentReviewIndex === 0}
                              className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={nextReviews}
                              disabled={currentReviewIndex + 1 >= recentReviews.length}
                              className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-300 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600 rounded-full transition-all duration-300"
                                  style={{ width: `${((currentReviewIndex + 1) / recentReviews.length) * 100}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-gray-600 text-sm font-medium">
                              {currentReviewIndex + 1}/{recentReviews.length}
                            </span>
                          </div>
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