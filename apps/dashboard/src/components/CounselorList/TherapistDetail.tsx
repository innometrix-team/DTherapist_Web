import React, { useState } from 'react';
import { therapists } from './constants';
import { SessionType } from './types';
import { ArrowLeft, Video, MapPin, Star } from 'lucide-react';

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

  const therapist = therapists.find(t => t.id === therapistId);

  if (!therapist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Therapist not found</h2>
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
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

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating === 0 || !newReview.comment.trim() || !newReview.clientName.trim()) {
      alert('Please fill in all fields and provide a rating');
      return;
    }
    
    // Here you would typically send the review to your backend
    alert(`Review submitted! Rating: ${newReview.rating} stars`);
    
    // Reset form
    setNewReview({ rating: 0, comment: '', clientName: '' });
    setShowReviewForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
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
                  src={therapist.image}
                  alt={therapist.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => onBookSession(therapist.id, 'video')}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-700 text-white py-4 rounded-lg hover:bg-primary transition-colors font-medium"
                >
                  <Video className="w-5 h-5" />
                  <span>Book Video Session</span>
                </button>

                <button
                  onClick={() => onBookSession(therapist.id, 'physical')}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-700 text-white py-4 rounded-lg hover:bg-primary transition-colors font-medium"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Book Physical Meetings</span>
                </button>
              </div>

              {/* Advertisement Space */}
              <div className="bg-gray-300 rounded-lg h-48 flex items-center justify-center text-gray-600 font-semibold text-lg">
                ADVERT SPACE
              </div>
            </div>
          </div>

          {/* Right Column - Therapist Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-8">
              {/* Therapist Info */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{therapist.name}</h1>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-gray-500">({therapist.reviews || '253'} Reviews)</span>
                  <div className="flex">
                    {renderStars(therapist.rating)}
                  </div>
                </div>
                <p className="text-gray-700 text-lg mb-2">{therapist.category}</p>
                <p className="text-gray-700 text-lg mb-2">{therapist.experience}</p>
                <p className="text-2xl font-bold text-gray-900">${therapist.cost}.00/hr</p>
              </div>

              {/* About Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About Counselor</h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor 
                    sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet 
                    consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. 
                    Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus 
                    vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem 
                    ipsum dolor sit amet consectetur. Mauris purus vulpu
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor 
                    sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet 
                    consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. 
                    Mauris purus vulpu
                  </p>
                </div>
              </div>

              {/* Reviews Section */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-primary transition-colors font-medium"
                  >
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                  </button>
                </div>

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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your name"
                          required
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="Share your experience with this therapist..."
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="submit"
                          className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-primary transition-colors"
                        >
                          Submit Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Reviews Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sample Review 1 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex">
                        {renderStars(5)}
                      </div>
                      <span className="text-sm text-gray-500">28 June 2024</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Best medical service in state!
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis pulvinar leo.
                    </p>
                    <div className="flex items-center space-x-3">
                      <img
                        src="/api/placeholder/40/40"
                        alt="Kizito Don-Pedro"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">Kizito Don-Pedro</p>
                        <p className="text-sm text-gray-500">Client</p>
                      </div>
                    </div>
                  </div>

                  {/* Sample Review 2 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex">
                        {renderStars(5)}
                      </div>
                      <span className="text-sm text-gray-500">28 June 2024</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Best medical service in state!
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis pulvinar leo.
                    </p>
                    <div className="flex items-center space-x-3">
                      <img
                        src="/api/placeholder/40/40"
                        alt="Kizito Don-Pedro"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">Kizito Don-Pedro</p>
                        <p className="text-sm text-gray-500">Client</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDetail;