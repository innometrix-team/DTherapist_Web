// src/components/appointment/ScheduleSession.tsx
import { useState } from 'react';
import { Session } from './types';
import { UPCOMING_SESSIONS, PASSED_SESSIONS } from './constants';

interface ScheduleSessionProps {
  sessionId: string;
  isReschedule: boolean;
  onClose: () => void;
}

const ScheduleSession: React.FC<ScheduleSessionProps> = ({ 
  sessionId, 
  isReschedule,
  onClose 
}) => {
  // Find the session from either upcoming or passed sessions
  const session: Session | undefined = [...UPCOMING_SESSIONS, ...PASSED_SESSIONS].find(s => s.id === sessionId);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Calculate calendar days
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  
  // Generate calendar days for current month
  const days = [];
  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Add the actual days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Add days for next month (to fill the calendar grid)
  const nextMonthDays = [];
  const remainingCells = 42 - (days.length); // 6 rows of 7 days
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(i);
  }
  
  const previousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const nextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const selectDay = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };
  
  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM'
  ];
  
  const handleTimeSlotSelection = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };
  
  const handleSubmit = () => {
    // Normally, you would send this data to your backend
    const scheduledSession = {
      sessionId,
      date: selectedDate.toLocaleDateString(),
      time: selectedTimeSlot,
      clientId: session?.id
    };
    
    console.log('Scheduled Session:', scheduledSession);
    onClose();
  };
  
  // Stop click propagation to prevent modal from closing when clicking inside it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
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
          <p>The requested session could not be found.</p>
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
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={handleModalClick}>
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold">
            {isReschedule ? "Booked" : "Book"} Video Call Session
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
                  src={session.clientImage || "/api/placeholder/96/96"} 
                  alt={session.clientName} 
                  className="w-20 h-20 rounded-lg mr-4"
                />
                <div>
                  <h3 className="text-xl font-bold">{session.clientName || "Royce Stephenson"}</h3>
                  <p className="text-gray-700">{session.profession || "Software Engineer"}</p>
                  <p className="text-gray-700">{session.experience || "12 Years Experience"}</p>
                  <p className="text-gray-700">{session.nationality || "Nigerian"}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-xl font-bold mb-2">About Client</h4>
                <p className="text-gray-700">
                  {session.clientBio || "Lorem ipsum dolor sit amet consectetur. Mauris purus vulpuLorem ipsum dolor sit amet consectetur. Mauris purus vulpuLorem ipsum dolor sit amet consectetur. Mauris purus vulpuLorem ipsum dolor sit amet consectetur. Mauris purus vulpuLorem ipsum dolor sit amet consectetur. Mauris purus vulpuLorem ipsum dolor sit amet consectetur. Mauris purus vulpuLorem ipsum dolor sit amet consectetur. Mauris purus vulpu"}
                </p>
              </div>
            </div>
            
            {/* Calendar Section - Scrollable */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h3 className="text-xl font-bold mb-4">Select Date & Time</h3>
              
              {/* Calendar */}
              <div className="mb-4 shadow-sm">
                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-4">
                  <button onClick={previousMonth} className="text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h4 className="text-2xl font-bold">
                    {monthNames[currentMonth]} {currentYear}
                  </h4>
                  <button onClick={nextMonth} className="text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div>
                  {/* Day Labels */}
                  <div className="grid grid-cols-7">
                    {dayNames.map((day, index) => (
                      <div key={index} className="text-center py-2 font-medium">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7">
                    {days.map((day, index) => (
                      <div key={`day-${index}`} className="border-t border-l border-gray-100 h-12 flex justify-center items-center">
                        {day !== null ? (
                          <button
                            onClick={() => selectDay(day)}
                            className={`w-full h-full flex items-center justify-center
                              ${selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth ? 
                                'bg-green-500 text-white' : 'hover:bg-gray-50'}`}
                          >
                            {day}
                          </button>
                        ) : (
                          <span></span>
                        )}
                      </div>
                    ))}
                    
                    {nextMonthDays.map((day, index) => (
                      <div key={`next-${index}`} className="border-t border-l border-gray-100 h-12 flex justify-center items-center text-gray-300">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Time Slots - Only shown after date selection */}
              {selectedDate && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium mb-2">Available Time Slots</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotSelection(slot)}
                        className={`py-2 px-3 text-sm rounded-md shadow-sm
                          ${selectedTimeSlot === slot ? 
                            'bg-green-500 text-white' : 
                            'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Total Price */}
              <div className="flex justify-end items-center mt-10">
                <div className="text-right">
                  <span className="text-xl font-bold">Total:</span>
                  <span className="text-xl font-bold ml-2">${session.price || '58.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed Button Section */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!selectedTimeSlot}
            className={`w-full py-3 rounded-md font-medium text-white flex items-center justify-center
              ${selectedTimeSlot ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isReschedule ? "Update Meeting Date & Time" : "Book Session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSession;