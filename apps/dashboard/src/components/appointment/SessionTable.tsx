import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getCounselorAppointments, getUserAppointments, Appointment, UserDashboardData } from '../../api/Appointments.api';
import {  ChevronDownIcon, MeetingIcon, ChatIcon, RescheduleIcon, WithdrawIcon } from '../../assets/icons';
import { useAuthStore } from '../../store/auth/useAuthStore';

interface SessionTableProps {
  type: 'upcoming' | 'passed';
  onReschedule?: (appointmentId: string) => void;
  onDownloadInvoice?: (appointmentId: string) => void;
}

const SessionTable: React.FC<SessionTableProps> = ({ 
  type, 
  onReschedule, 
  onDownloadInvoice 
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get user role from auth store
  const { role } = useAuthStore();
  
  // Determine if user is counselor
  const isCounselor = role === 'counselor';
  
  console.log('🔑 Auth Info:', { role, isCounselor });

  // Query for counselor appointments
  const {
    data: counselorData,
    isLoading: counselorLoading,
    error: counselorError,
    refetch: refetchCounselor
  } = useQuery({
    queryKey: ['counselor-appointments'],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      console.log('🔄 Fetching counselor appointments...');
      return await getCounselorAppointments({ signal: controller.signal });
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: isCounselor && !!role
  });

  // Query for user appointments
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['user-appointments'],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      console.log('🔄 Fetching user appointments...');
      return await getUserAppointments({ signal: controller.signal });
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !isCounselor && !!role
  });

  // Process appointments data
  useEffect(() => {
    console.log('🔍 Processing appointments data...', { isCounselor, counselorData, userData });
    
    let appointmentsList: Appointment[] = [];

    if (isCounselor) {
      // Handle counselor data
      if (counselorData && counselorData.data) {
        appointmentsList = Array.isArray(counselorData.data) ? counselorData.data : [];
        console.log(`📋 Counselor appointments received: ${appointmentsList.length}`);
      }
    } else {
      // Handle user data - FIXED: Check if data is direct array or nested in upcomingAppointments
      if (userData && userData.data) {
        console.log('🔍 Raw user data structure:', userData.data);
        
        // Check if data is directly an array of appointments (like your API response)
        if (Array.isArray(userData.data)) {
          appointmentsList = userData.data;
          console.log(`📋 User appointments (direct array): ${appointmentsList.length}`);
        } else {
          // Check if it's nested in upcomingAppointments (as per UserDashboardData type)
          const dashboardData = userData.data as UserDashboardData;
          appointmentsList = dashboardData.upcomingAppointments || [];
          console.log(`📋 User appointments (nested): ${appointmentsList.length}`);
        }
      }
    }

    console.log('📊 All appointments before filtering:', appointmentsList.map(apt => ({
      id: apt.id,
      fullName: apt.fullName,
      status: apt.status,
      date: apt.date,
      time: apt.time
    })));

    // Filter appointments based on type and status
    const filteredAppointments = appointmentsList.filter(appointment => {
      if (!appointment) return false;
      
      let shouldInclude = false;
      
      if (type === 'upcoming') {
        // Include appointments with 'upcoming' or 'confirmed' status
        shouldInclude = appointment.status === 'upcoming' || appointment.status === 'confirmed';
      } else {
        // Include appointments with 'passed' status
        shouldInclude = appointment.status === 'passed';
      }
      
      console.log(`🔸 Appointment ${appointment.id}: status="${appointment.status}", type="${type}", included=${shouldInclude}`);
      return shouldInclude;
    });
    
    console.log(`✨ Final filtered appointments for '${type}':`, {
      role,
      isCounselor,
      totalReceived: appointmentsList.length,
      filteredCount: filteredAppointments.length,
      filteredAppointments: filteredAppointments.map(apt => ({
        id: apt.id,
        fullName: apt.fullName,
        status: apt.status
      }))
    });
    
    setAppointments(filteredAppointments);
  }, [counselorData, userData, type, isCounselor, role]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const toggleDropdown = (appointmentId: string) => {
    setActiveDropdown(activeDropdown === appointmentId ? null : appointmentId);
  };

  const handleActionClick = (action: string, appointment: Appointment) => {
    setActiveDropdown(null);
    console.log(`🎯 Action clicked: ${action} for appointment ${appointment.id}`);
    
    switch(action) {
      case 'startMeeting':
        if (appointment.action?.joinMeetingLink) {
          window.open(appointment.action.joinMeetingLink, '_blank');
        } else {
          navigate(`/meeting/${appointment.id}`);
        }
        break;
      case 'chat':
        if (appointment.chatId) {
          navigate(`/chat/${appointment.chatId}`);
        } else {
          navigate(`/chat/${appointment.id}`);
        }
        break;
      case 'reschedule':
        onReschedule?.(appointment.id);
        break;
      case 'downloadInvoice':
        if (appointment.action?.invoiceDownloadLink) {
          window.open(appointment.action.invoiceDownloadLink, '_blank');
        } else if (onDownloadInvoice) {
          onDownloadInvoice(appointment.id);
        } else {
          toast.error('Invoice not available');
        }
        break;
    }
  };

  // Don't render if no role
  if (!role) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base">
          Please log in to view appointments.
        </div>
      </div>
    );
  }

  // Loading state (including tab switching animation)
  const isLoading = isCounselor ? counselorLoading : userLoading;
  if (isLoading) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base">
          Loading {type} appointments...
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Debug: Role={role}, Endpoint={isCounselor ? '/api/service-provider/appointments' : '/api/user/appointments'}
        </div>
      </div>
    );
  }

  // Error state
  const error = isCounselor ? counselorError : userError;
  const refetch = isCounselor ? refetchCounselor : refetchUser;
  
  if (error) {
    return (
      <div className="text-center py-8 px-4 text-red-500">
        <div className="text-sm sm:text-base mb-4">
          Failed to load appointments
        </div>
        <div className="text-xs text-gray-600 mb-4">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state with more debugging info
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base mb-2">
          No {type} appointments to display.
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Debug: Role={role}, IsCounselor={isCounselor}</div>
          <div>Raw data length: {isCounselor 
            ? (counselorData?.data ? Array.isArray(counselorData.data) ? counselorData.data.length : 'Not array' : 'No data')
            : (userData?.data ? Array.isArray(userData.data) ? userData.data.length : 'Not array' : 'No data')
          }</div>
          <div>Filter type: {type}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 lg:px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={appointment.profilePicture} 
                      alt={appointment.fullName} 
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                      }}
                    />
                    <div>
                      <span className="font-medium text-sm lg:text-base text-gray-900">
                        {appointment.fullName}
                      </span>
                      <div className="text-xs text-gray-400">
                        Status: {appointment.status}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm lg:text-base whitespace-nowrap text-gray-700">
                  {new Date(appointment.date).toLocaleDateString()}
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm lg:text-base whitespace-nowrap text-gray-700">
                  {appointment.time}
                </td>
                <td className="px-3 lg:px-6 py-4">
                  <span className="px-2 lg:px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs lg:text-sm whitespace-nowrap font-medium">
                    {appointment.type}
                  </span>
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button 
                        className="flex items-center space-x-1 px-2 lg:px-3 py-1 text-gray-600 hover:text-gray-900 rounded transition-colors"
                        onClick={() => toggleDropdown(appointment.id)}
                      >
                        <span className="text-xs lg:text-sm">Actions</span>
                        <ChevronDownIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      
                      {activeDropdown === appointment.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                          {type === 'upcoming' ? (
                            <>
                              <button 
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                                onClick={() => handleActionClick('startMeeting', appointment)}
                              >
                                <MeetingIcon className="w-4 h-4 mr-2" />
                                <span>Start Meeting</span>
                              </button>
                              <button 
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                                onClick={() => handleActionClick('chat', appointment)}
                              >
                                <ChatIcon className="w-4 h-4 mr-2" />
                                <span>Chat</span>
                              </button>
                              <button 
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                                onClick={() => handleActionClick('reschedule', appointment)}
                              >
                                <RescheduleIcon className="w-4 h-4 mr-2" />
                                <span>Reschedule</span>
                              </button>
                            </>
                          ) : (
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                              onClick={() => handleActionClick('downloadInvoice', appointment)}
                            >
                              <WithdrawIcon className="w-4 h-4 mr-2" />
                              <span>Download Invoice</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img 
                  src={appointment.profilePicture} 
                  alt={appointment.fullName} 
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {appointment.fullName}
                  </h3>
                  <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-primary text-xs font-medium mt-1">
                    {appointment.type}
                  </span>
                  <div className="text-xs text-gray-400">
                    Status: {appointment.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Date</span>
                <span className="text-gray-900 font-medium">{new Date(appointment.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Time</span>
                <span className="text-gray-900 font-medium">{appointment.time}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              {type === 'upcoming' ? (
                <div className="flex flex-wrap gap-2">
                  <button 
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick('startMeeting', appointment)}
                  >
                    <MeetingIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Meeting</span>
                  </button>
                  <button 
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick('chat', appointment)}
                  >
                    <ChatIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Chat</span>
                  </button>
                  <button 
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick('reschedule', appointment)}
                  >
                    <RescheduleIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Reschedule</span>
                  </button>
                </div>
              ) : (
                <button 
                  className="flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors"
                  onClick={() => handleActionClick('downloadInvoice', appointment)}
                >
                  <WithdrawIcon className="w-4 h-4 mr-2" />
                  Download Invoice
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default SessionTable;