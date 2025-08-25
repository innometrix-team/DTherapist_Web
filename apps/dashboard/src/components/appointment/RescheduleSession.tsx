import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { getTherapistScheduleApi, ITimeSlot } from '../../api/TherapistSchedule.api';
import { rescheduleBookingApi, IUserRescheduleRequest, ICounselorRescheduleRequest } from '../../api/Reschedule.api';
import { getCounselorAppointments, getUserAppointments, Appointment } from '../../api/Appointments.api';

interface RescheduleSessionProps {
  sessionId: string;
  onClose: () => void;
}




// Type for appointment with optional therapistId
interface ExtendedAppointment extends Appointment {
  therapistId?: string;
}

const RescheduleSession: React.FC<RescheduleSessionProps> = ({ 
  sessionId,
  onClose 
}) => {
  // Get user role from auth store
  const { role, id: userId } = useAuthStore();
  const isCounselor = role === 'counselor';
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Fetch appointments based on user role to find the session
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError
  } = useQuery({
    queryKey: isCounselor ? ['counselor-appointments'] : ['user-appointments'],
    queryFn: async () => {
      if (isCounselor) {
        return await getCounselorAppointments();
      } else {
        return await getUserAppointments();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!role
  });

  // Find the session from the appointments data
  const session = useMemo((): ExtendedAppointment | undefined => {
    if (!appointmentsData?.data) return undefined;

    let appointments: Appointment[] = [];
    
    if (isCounselor) {
      // Handle counselor data
      appointments = Array.isArray(appointmentsData.data) ? appointmentsData.data : [];
    } else {
      // Handle user data - check if it's direct array or nested in upcomingAppointments
      if (Array.isArray(appointmentsData.data)) {
        appointments = appointmentsData.data;
      } else {
        // Check if it's nested in upcomingAppointments (as per UserDashboardData type)
        const dashboardData = appointmentsData.data ;
        appointments = dashboardData.upcomingAppointments || [];
      }
    }

    return appointments.find(appointment => appointment.bookingId === sessionId) as ExtendedAppointment;
  }, [appointmentsData, sessionId, isCounselor]);
  
  // Get therapist ID
  const therapistId = useMemo((): string | null => {
    if (isCounselor) {
      // For counselors, use their own user ID from auth store
      return userId || null;
    } else {
      // For users, extract therapistId from the session data
      if (session && session.therapistId) {
        return session.therapistId;
      }
      
      // Fallback: if therapistId is not available, we can't proceed
      return null;
    }
  }, [session, isCounselor, userId]);
  
  // Convert session type to API format
  const sessionType = useMemo((): 'video' | 'physical' => {
    if (!session?.type) return 'video';
    const type = session.type.toLowerCase();
    return type === 'video call' || type === 'video' ? 'video' : 'physical';
  }, [session?.type]);
  
  // Fetch therapist schedule
  const { 
    data: scheduleResponse, 
    isLoading: scheduleLoading, 
    error: scheduleError 
  } = useQuery({
    queryKey: ['therapist-schedule', therapistId, sessionType],
    queryFn: async () => {
      if (!therapistId) throw new Error('Therapist ID required');
      const result = await getTherapistScheduleApi(therapistId, sessionType);
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!therapistId && !!session, // Only fetch if we have therapist ID and session
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async (rescheduleData: IUserRescheduleRequest | ICounselorRescheduleRequest) => {
      if (!session) throw new Error('Session not found');
      
      const result = await rescheduleBookingApi(
        sessionId,
        rescheduleData,
        isCounselor ? 'counselor' : 'user'
      );
      
      if (!result) throw new Error('Request cancelled');
      return result;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Session rescheduled successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || 'Failed to reschedule session';
      toast.error(errorMessage);
    }
  });

  // Helper function to format date as YYYY-MM-DD
  const formatDateToString = useCallback((date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  // Helper function to get all dates for a specific day of the week in a month
  const getDatesForDayInCurrentMonth = useCallback((dayName: string, month: Date): Date[] => {
    const dates: Date[] = [];
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap: Record<string, number> = {
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

  // Create a map of available dates for quick lookup using therapist schedule API
  const availableDatesMap = useMemo(() => {
    const map = new Map<string, ITimeSlot[]>();
    
    if (!scheduleResponse?.data?.schedules) {
      return map;
    }
    
    const schedules = scheduleResponse.data.schedules;
    
    schedules.forEach((scheduleItem) => {
      // Filter by session type and availability
      const scheduleMeetingType = scheduleItem.meetingType === 'in-person' ? 'physical' : 'video';
      
      if (scheduleItem.isAvailable && scheduleMeetingType === sessionType) {
        // Get all dates for this day of the week in the current month
        const dayName = scheduleItem.day;
        const dates = getDatesForDayInCurrentMonth(dayName, currentMonth);
        
        dates.forEach(date => {
          const dateStr = formatDateToString(date);
          
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
  }, [scheduleResponse?.data?.schedules, sessionType, currentMonth, getDatesForDayInCurrentMonth, formatDateToString]);

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
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Check if a date is available
  const isDateAvailable = useCallback((day: number): boolean => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateToString(date);
    return availableDatesMap.has(dateStr);
  }, [currentMonth, availableDatesMap, formatDateToString]);

  const isToday = useCallback((day: number): boolean => {
    const today = new Date();
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dayDate.toDateString() === today.toDateString();
  }, [currentMonth]);

  const isPastDate = useCallback((day: number): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dayDate < today;
  }, [currentMonth]);

  const selectDay = useCallback((day: number) => {
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

    const formattedDate = formatDateToString(selectedDateObj);
    
    // Check if date is available
    if (!availableDatesMap.has(formattedDate)) {
      toast.error('This date is not available');
      return;
    }
    
    setSelectedDate(formattedDate);
    setSelectedTimeSlot(null); // Reset time selection when date changes
  }, [currentMonth, availableDatesMap, formatDateToString]);
  
  const previousMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate('');
    setSelectedTimeSlot(null);
  }, [currentMonth]);
  
  const nextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate('');
    setSelectedTimeSlot(null);
  }, [currentMonth]);

  const handleTimeSlotSelection = useCallback((timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!session || !selectedDate || !selectedTimeSlot) {
      toast.error('Please select both date and time');
      return;
    }

    // Calculate end time (assuming 1-hour sessions)
    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const endHours = hours + 1;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    try {
      let rescheduleData: IUserRescheduleRequest | ICounselorRescheduleRequest;
      
      if (isCounselor) {
        // Counselor reschedule request
        rescheduleData = {
          bookingid: session.bookingId,
          sessionType: sessionType === 'video' ? 'video' : 'in-person',
          date: selectedDate,
          startTime: selectedTimeSlot,
          endTime
        } as ICounselorRescheduleRequest;
      } else {
        // User reschedule request
        if (!therapistId) {
          toast.error('Therapist ID is required');
          return;
        }
        
        rescheduleData = {
          bookingId: session.bookingId,
          therapistId,
          sessionType: sessionType === 'video' ? 'video' : 'in-person',
          date: selectedDate,
          startTime: selectedTimeSlot,
          endTime
        } as IUserRescheduleRequest;
      }

      rescheduleMutation.mutate(rescheduleData);
    } catch  {
      toast.error('Error preparing reschedule data');
    }
  }, [session, selectedDate, selectedTimeSlot, sessionType, isCounselor, therapistId, rescheduleMutation]);

  // Get available times for the selected date
  const availableTimes = useMemo((): ITimeSlot[] => {
    if (!selectedDate || !availableDatesMap.has(selectedDate)) {
      return [];
    }
    
    const timeSlots = availableDatesMap.get(selectedDate);
    return timeSlots || [];
  }, [selectedDate, availableDatesMap]);

  // Stop click propagation to prevent modal from closing when clicking inside it
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  // Loading state for appointments
  if (appointmentsLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex items-center justify-center p-8" onClick={handleModalClick}>
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-gray-600">Loading appointment data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state for appointments loading
  if (appointmentsError) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full" onClick={handleModalClick}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Error Loading Appointment</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-4">Failed to load appointment data.</p>
          <button 
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full" onClick={handleModalClick}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Session Not Found</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p>The requested session could not be found in your appointments.</p>
          <button 
            onClick={onClose}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Loading state for schedule
  if (scheduleLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex items-center justify-center p-8" onClick={handleModalClick}>
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-gray-600">Loading therapist schedule...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state for schedule loading
  if (scheduleError) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full" onClick={handleModalClick}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Error Loading Schedule</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-4">Failed to load therapist schedule.</p>
          <button 
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show error if therapistId is missing for users
  if (!isCounselor && !therapistId) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full" onClick={handleModalClick}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Missing Therapist Information</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-4">Unable to find therapist information for this session. Please try again or contact support.</p>
          <button 
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={handleModalClick}>
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold">
            Reschedule {session.type || 'Video Call'} Session
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Client Info Section */}
            <div className="p-6">
              <div className="flex mb-4">
                <img 
                  src={session.profilePicture || "/api/placeholder/96/96"} 
                  alt={session.fullName || "Client"} 
                  className="w-20 h-20 rounded-lg mr-4"
                />
                <div>
                  <h3 className="text-xl font-bold">{session.fullName || "Client"}</h3>
                  <p className="text-gray-700">
                    Status: <span className="capitalize font-medium">{session.status}</span>
                  </p>
                  <p className="text-gray-700">Session Type: {session.type}</p>
                  {!isCounselor && therapistId && (
                    <p className="text-gray-700 text-sm">Therapist ID: {therapistId}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-xl font-bold mb-2">Current Appointment</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium">Current Schedule:</span>
                  </div>
                  <p className="text-gray-700">Date: {new Date(session.date).toLocaleDateString()}</p>
                  <p className="text-gray-700">Time: {session.time}</p>
                  <p className="text-gray-700">Type: {session.type}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-xl font-bold mb-2">
                  {isCounselor ? 'About Client' : 'Session Details'}
                </h4>
                <p className="text-gray-700">
                  Please select a new date and time for your session. Available slots are shown based on the {isCounselor ? 'your' : "therapist's"} schedule.
                </p>
              </div>
            </div>
            
            {/* Calendar Section - Scrollable */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h3 className="text-xl font-bold mb-4">Select New Date & Time</h3>
              
              {/* Calendar */}
              <div className="mb-4 shadow-sm">
                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-4">
                  <button 
                    onClick={previousMonth} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <h4 className="text-2xl font-bold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h4>
                  <button 
                    onClick={nextMonth} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div>
                  {/* Day Labels */}
                  <div className="grid grid-cols-7">
                    {weekDays.map((day, index) => (
                      <div key={index} className="text-center py-2 font-medium text-sm text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <div key={`day-${index}`} className="aspect-square">
                        {day !== null ? (
                          <button
                            onClick={() => selectDay(day)}
                            disabled={isPastDate(day) || !isDateAvailable(day)}
                            className={`w-full h-full flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                              isPastDate(day) || !isDateAvailable(day)
                                ? 'text-gray-300 cursor-not-allowed'
                                : isToday(day)
                                ? 'bg-green-500 text-white' 
                                : (() => {
                                    const dateStr = formatDateToString(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                                    return selectedDate === dateStr
                                      ? 'bg-blue-500 text-white'
                                      : 'hover:bg-gray-100 text-gray-700';
                                  })()
                            }`}
                          >
                            {day}
                          </button>
                        ) : (
                          <span></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>
              
              {/* Time Slots - Only shown after date selection */}
              {selectedDate && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium mb-2">
                    Available Times for {new Date(selectedDate).toLocaleDateString()}
                  </h5>
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimes.map((timeSlot) => (
                        <button
                          key={timeSlot._id}
                          onClick={() => handleTimeSlotSelection(timeSlot.startTime)}
                          className={`py-2 px-3 text-sm rounded-md shadow-sm transition-colors ${
                            selectedTimeSlot === timeSlot.startTime ? 
                              'bg-blue-500 text-white' : 
                              'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
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
            </div>
          </div>
        </div>
        
        {/* Fixed Button Section */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!selectedTimeSlot || rescheduleMutation.isPending}
            className={`w-full py-3 rounded-md font-medium text-white flex items-center justify-center transition-colors ${
              selectedTimeSlot && !rescheduleMutation.isPending 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {rescheduleMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 mr-2" />
                Reschedule Session
              </>
            )}
          </button>
          
          {/* Info text */}
          <p className="text-xs text-gray-500 text-center mt-2">
            {isCounselor 
              ? 'Reschedule to any available time in your schedule.' 
              : 'You can only reschedule to times when the therapist is available.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RescheduleSession;