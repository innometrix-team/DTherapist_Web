import React, { useState, useCallback, useMemo, JSX } from 'react';
import { SessionType } from './types';
import { CreditCard, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getTherapistDetailsApi} from '../../api/Therapist.api';
import createBookingApi, { IBookingRequest } from '../../api/Booking.api';
import { getTherapistScheduleApi, ITimeSlot } from '../../api/TherapistSchedule.api';
import toast from 'react-hot-toast';

interface BookingSessionProps {
  therapistId: string;
  sessionType: SessionType;
  onBack: () => void;
}

const BookingSession: React.FC<BookingSessionProps> = ({ therapistId, sessionType, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Convert sessionType to API format for schedule endpoint
  const scheduleApiSessionType = sessionType === 'video' ? 'video' : 'physical';
  
  // Convert sessionType to API format for booking endpoint  
  const bookingApiSessionType = sessionType === 'video' ? 'video' : 'physical';

  // Fetch therapist details
  const { 
    data: therapistResponse, 
    isLoading: therapistLoading, 
    error: therapistError 
  } = useQuery({
    queryKey: ['therapist', therapistId],
    queryFn: async () => {
      const result = await getTherapistDetailsApi(therapistId);
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch therapist schedule
  const { 
    data: scheduleResponse, 
    isLoading: scheduleLoading, 
    error: scheduleError 
  } = useQuery({
    queryKey: ['therapist-schedule', therapistId, scheduleApiSessionType],
    queryFn: async () => {
      const result = await getTherapistScheduleApi(therapistId, scheduleApiSessionType);
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper function to get cost based on session type
  const getCostForSessionType = (cost: { video: number; inPerson: number } | number | null, sessionType: SessionType): number => {
    if (typeof cost === 'number') {
      return cost;
    }
    if (typeof cost === 'object' && cost !== null) {
      return sessionType === 'video' ? (cost.video || 0) : (cost.inPerson || 0);
    }
    return 0;
  };

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: IBookingRequest) => {
      const result = await createBookingApi(bookingData);
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Booking created successfully');
      
      // If there's a payment URL, redirect to it
      if (data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        // Show success message and go back
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    },
    onError: (error) => {
      const errorMessage = error?.message || 'Failed to create booking';
      toast.error(errorMessage);
    }
  });

  const therapist = therapistResponse?.data?.therapist;
  const schedules = scheduleResponse?.data?.schedules || [];
  const sessionCost = therapist ? getCostForSessionType(therapist.cost, sessionType) : 0;

  // Helper function to get all dates for a specific day of the week in a month
  const getDatesForDayInCurrentMonth = useCallback((dayName: string, month: Date): Date[] => {
    const dates: Date[] = [];
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const targetDay = dayMap[dayName];
    if (targetDay === undefined) return dates;
    
    // Get first day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Find first occurrence of the target day
    const date = new Date(firstDay);
    while (date.getDay() !== targetDay) {
      date.setDate(date.getDate() + 1);
    }
    
    // Add all occurrences of this day in the month
    while (date <= lastDay) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 7); // Next week
    }
    
    return dates;
  }, []);

  // Create a map of available dates for quick lookup
  const availableDatesMap = useMemo(() => {
    const map = new Map<string, ITimeSlot[]>();
    
    schedules.forEach(scheduleItem => {
      // Convert meetingType for comparison (in-person from API vs physical from component)
      const scheduleMeetingType = scheduleItem.meetingType === 'in-person' ? 'physical' : 'video';
      
      if (scheduleItem.isAvailable && scheduleMeetingType === scheduleApiSessionType) {
        // Get all dates for this day of the week in the current month
        const dayName = scheduleItem.day;
        const dates = getDatesForDayInCurrentMonth(dayName, currentMonth);
        
        dates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          // Only add future dates
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date >= today) {
            map.set(dateStr, scheduleItem.slots);
          }
        });
      }
    });
    
    return map;
  }, [schedules, scheduleApiSessionType, currentMonth, getDatesForDayInCurrentMonth]);

  // Generate calendar days for the current month
  const generateCalendarDays = useCallback((): (number | null)[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday = 0, Sunday = 6
    const startDay = (firstDayOfMonth.getDay() + 6) % 7;
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [currentMonth]);

  const calendarDays = generateCalendarDays();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Check if a date is available
  const isDateAvailable = (day: number): boolean => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
    return availableDatesMap.has(dateStr);
  };

  const handleDateSelect = (day: number): void => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const selectedDateObj = new Date(year, month, day);
    
    // Don't allow selecting past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDateObj < today) {
      toast.error('Cannot select past dates');
      return;
    }

    // Check if date is available
    const formattedDate = selectedDateObj.toISOString().split('T')[0];
    if (!availableDatesMap.has(formattedDate)) {
      toast.error('This date is not available');
      return;
    }
    
    setSelectedDate(formattedDate);
    setSelectedTime(''); // Reset time selection when date changes
  };

  const handleTimeSelect = (time: string): void => {
    setSelectedTime(time);
  };

  const handlePrevMonth = (): void => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleNextMonth = (): void => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
    setSelectedDate('');
    setSelectedTime('');
  };

  const handlePayment = async (): Promise<void> => {
    if (!therapist || !selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    // Calculate end time (assuming 1-hour sessions)
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endHours = hours + 1;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const bookingData: IBookingRequest = {
      therapistId: therapist.userId,
      sessionType: bookingApiSessionType,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      price: sessionCost
    };

    bookingMutation.mutate(bookingData);
  };

  const renderStars = (rating: number | null): JSX.Element[] => {
    const validRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < validRating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  // Get available times for the selected date
  const getAvailableTimesForDate = (): ITimeSlot[] => {
    if (!selectedDate || !availableDatesMap.has(selectedDate)) {
      return [];
    }
    
    const timeSlots = availableDatesMap.get(selectedDate);
    return timeSlots || [];
  };

  const availableTimes = getAvailableTimesForDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Loading state
  if (therapistLoading || scheduleLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">
            {therapistLoading ? 'Loading therapist details...' : 'Loading availability...'}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (therapistError || scheduleError || !therapist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {therapistError ? 'Failed to load therapist' : 
             scheduleError ? 'Failed to load availability' : 
             'Therapist not found'}
          </h2>
          <button
            onClick={onBack}
            className="text-primary hover:text-blue-800 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isToday = (day: number): boolean => {
    const today = new Date();
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dayDate.toDateString() === today.toDateString();
  };

  const isPastDate = (day: number): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dayDate < today;
  };

  // Get review count (handle both count and totalReviews)
  const reviewCount = therapist.reviews.totalReviews || therapist.reviews.count || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between m-6 sm:mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Book {sessionType === 'video' ? 'Video Call' : 'Physical Meeting'} Session
            </h1>
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 m-6">
            {/* Left Column - Therapist Info */}
            <div className="space-y-6 sm:space-y-8">
              {/* Therapist Card */}
              <div className="flex items-start space-x-4">
                <img
                  src={therapist.profilePicture || 'https://via.placeholder.com/96x96/e5e7eb/9ca3af?text=User'}
                  alt={therapist.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src !== 'https://via.placeholder.com/96x96/e5e7eb/9ca3af?text=User') {
                      img.src = 'https://via.placeholder.com/96x96/e5e7eb/9ca3af?text=User';
                    }
                  }}
                />
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{therapist.name}</h2>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-600">({reviewCount} Reviews)</span>
                    <div className="flex">
                      {renderStars(therapist.reviews.averageRating)}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-1">{therapist.category}</p>
                  <p className="text-gray-700 mb-2">{therapist.experience} years experience</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    ₦{sessionCost}.00/hr
                  </p>
                </div>
              </div>

              {/* About Section */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">About Counselor</h3>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    {therapist.about || 
                    `${therapist.name} is a licensed professional counselor specializing in ${therapist.category}. 
                    With ${therapist.experience} years of experience, they provide comprehensive support and guidance 
                    to help clients achieve their mental health goals.`}
                  </p>
                  {therapist.specializations && therapist.specializations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Specializations:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {therapist.specializations.map((spec, index) => (
                          <li key={index}>{spec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Date & Time Selection */}
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Select Date & Time</h3>
              
              {/* Calendar */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h4>
                  <button 
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-700 py-2">
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
                          disabled={isPastDate(day) || !isDateAvailable(day)}
                          className={`w-full h-full flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                            isPastDate(day) || !isDateAvailable(day)
                              ? 'text-gray-300 cursor-not-allowed'
                              : isToday(day)
                              ? 'bg-success text-white' 
                              : selectedDate === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0]
                              ? 'bg-primary text-white'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>

              {/* Available Times */}
              {selectedDate && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Available Times for {new Date(selectedDate).toLocaleDateString()}
                  </h4>
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {availableTimes.map((timeSlot) => (
                        <button
                          key={timeSlot._id}
                          onClick={() => handleTimeSelect(timeSlot.startTime)}
                          className={`p-2 sm:p-3 text-sm font-medium border rounded-lg transition-colors ${
                            selectedTime === timeSlot.startTime
                              ? 'bg-primary text-white border-primary'
                              : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No available times for this date
                    </p>
                  )}
                </div>
              )}

              {/* Payment Button - Mobile/Tablet - Now under calendar and time */}
              <div className="lg:hidden">
                <div className="flex justify-between items-center mb-4 text-lg sm:text-xl font-bold">
                  <span>Total:</span>
                  <span>₦{sessionCost}.00</span>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={!selectedDate || !selectedTime || bookingMutation.isPending}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-3 sm:py-4 rounded-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {bookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Proceed to Make Payment</span>
                    </>
                  )}
                </button>
              </div>

              {/* Total and Payment - Desktop */}
              <div className="hidden lg:block pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">₦{sessionCost}.00</span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={!selectedDate || !selectedTime || bookingMutation.isPending}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {bookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Proceed to Make Payment</span>
                    </>
                  )}
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