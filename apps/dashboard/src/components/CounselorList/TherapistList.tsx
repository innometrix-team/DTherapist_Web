import React, { useState } from 'react';
import { SessionType } from './types';
import { therapists } from './constants';
import { ChevronDown, User, Video, MapPin } from 'lucide-react';

interface TherapistListProps {
  onBookAppointment: (therapistId: string, sessionType: SessionType) => void;
  onViewProfile: (therapistId: string) => void;
}

const TherapistList: React.FC<TherapistListProps> = ({ onBookAppointment, onViewProfile }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (therapistId: string) => {
    setOpenDropdown(openDropdown === therapistId ? null : therapistId);
  };

  const handleBooking = (therapistId: string, sessionType: SessionType) => {
    onBookAppointment(therapistId, sessionType);
    setOpenDropdown(null);
  };

  const renderStars = (rating : number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-base ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-32 bg-cover bg-center rounded-lg shadow-sm p-6 m-6" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/api/placeholder/1200/300')`
      }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-3xl font-semibold">Our Counselors</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto">
                <option>All Categories</option>
                <option>Child & Adolescent Therapy</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search for Counselor"
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
            <span>Filter</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Table */}
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
          {therapists.map((therapist) => (
            <div key={therapist.id}>
              {/* Desktop Layout */}
              <div className="hidden lg:grid lg:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.8fr_0.5fr] gap-6 px-6 py-6 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center">
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={therapist.image}
                    alt={therapist.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
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
                    {renderStars(therapist.rating)}
                  </div>
                </div>

                {/* Experience */}
                <div className="flex items-center">
                  <span className="text-gray-600">{therapist.experience}</span>
                </div>

                {/* Cost */}
                <div className="flex items-center">
                  <span className="font-semibold text-gray-900">${therapist.cost}.00/hr</span>
                </div>

                {/* Action Button */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(therapist.id)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <span className="whitespace-nowrap">Book Appointment</span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === therapist.id && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-300 z-50">
                      <button
                        onClick={() => handleBooking(therapist.id, 'video')}
                        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 border-b"
                      >
                        <Video className="w-5 h-5 text-blue-600" />
                        <span>Video Call</span>
                      </button>
                      <button
                        onClick={() => handleBooking(therapist.id, 'physical')}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span>Physical Meeting</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Icon */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => onViewProfile(therapist.id)}
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
                    src={therapist.image}
                    alt={therapist.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-lg mb-1">{therapist.name}</h3>
                    <p className="text-gray-600 mb-2">{therapist.category}</p>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex">
                        {renderStars(therapist.rating)}
                      </div>
                      <span className="text-gray-600">{therapist.experience}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-lg">${therapist.cost}.00/hr</span>
                      <button
                        onClick={() => onViewProfile(therapist.id)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Action Button */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(therapist.id)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span>Book Appointment</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Mobile Dropdown Menu */}
                  {openDropdown === therapist.id && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-lg border z-50">
                      <button
                        onClick={() => handleBooking(therapist.id, 'video')}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 border-b"
                      >
                        <Video className="w-5 h-5 text-blue-600" />
                        <span>Video Call</span>
                      </button>
                      <button
                        onClick={() => handleBooking(therapist.id, 'physical')}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span>Physical Meeting</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TherapistList;