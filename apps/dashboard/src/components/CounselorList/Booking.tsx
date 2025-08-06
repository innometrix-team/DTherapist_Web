import React, { useState } from 'react';
import { therapists } from './constants';
import { SessionType } from './types';
import { CreditCard, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingSessionProps {
  therapistId: string;
  sessionType: SessionType;
  onBack: () => void;
}

const BookingSession: React.FC<BookingSessionProps> = ({ therapistId, sessionType, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const therapist = therapists.find(t => t.id === therapistId);

  if (!therapist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Therapist not found</h2>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Generate calendar days for May 2023
  const generateCalendarDays = () => {
    const days = [];
    const daysInMonth = 31;
    const startDay = 1; // May 1st starts on Monday (0=Sunday, 1=Monday)

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const handleDateSelect = (day: number) => {
    setSelectedDate(`2023-05-${day.toString().padStart(2, '0')}`);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handlePayment = () => {
    alert(`Booking confirmed for ${therapist.name} - ${sessionType} session on ${selectedDate} at ${selectedTime}`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  // Sample available times
  const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Book {sessionType === 'video' ? 'Video Call' : 'Physical Meeting'} Session
            </h1>
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Therapist Info */}
            <div className="space-y-8">
              {/* Therapist Card */}
              <div className="flex items-start space-x-4">
                <img
                  src={therapist.image}
                  alt={therapist.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{therapist.name}</h2>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-600">({therapist.reviews || '253'} Reviews)</span>
                    <div className="flex">
                      {renderStars(therapist.rating)}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-1">{therapist.category}</p>
                  <p className="text-gray-700 mb-2">{therapist.experience}</p>
                  <p className="text-xl font-bold text-gray-900">${therapist.cost}.00/hr</p>
                </div>
              </div>

              {/* About Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">About Counselor</h3>
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
                    Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu
                  </p>
                </div>
              </div>

              {/* Reviews Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Reviews</h3>
                {/* Sample reviews would go here */}
              </div>

              {/* Payment Button - Mobile/Tablet */}
              <div className="lg:hidden">
                <div className="flex justify-between items-center mb-4 text-xl font-bold">
                  <span>Total:</span>
                  <span>${therapist.cost}.00</span>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Make Payment</span>
                </button>
              </div>
            </div>

            {/* Right Column - Date & Time Selection */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Select Date & Time</h3>
              
              {/* Calendar */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h4 className="text-xl font-bold text-gray-900">May 2023</h4>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <div key={index} className="aspect-square">
                      {day && (
                        <button
                          onClick={() => handleDateSelect(day)}
                          className={`w-full h-full flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                            day === 18 
                              ? 'bg-green-500 text-white' 
                              : selectedDate === `2023-05-${day.toString().padStart(2, '0')}`
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Times */}
              {selectedDate && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Times</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`p-3 text-sm font-medium border rounded-lg transition-colors ${
                          selectedTime === time
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Total and Payment - Desktop */}
              <div className="hidden lg:block pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">${therapist.cost}.00</span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Make Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSession;