import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getCounselorAppointments, getUserAppointments, downloadInvoice, Appointment, UserDashboardData } from '../../api/Appointments.api';
import DashboardApi from '../../api/Dashboard.api';
import { ChevronDownIcon, MeetingIcon, ChatIcon, RescheduleIcon, WithdrawIcon } from '../../assets/icons';
import { useAuthStore } from '../../store/auth/useAuthStore';

// Define error types
interface QueryError {
  name?: string;
  code?: string;
  message?: string;
}

interface SessionTableProps {
  type: 'upcoming' | 'passed';
  onReschedule?: (appointmentId: string) => void;
  onDownloadInvoice?: (appointmentId: string) => void;
  dataSource?: 'dashboard' | 'appointments'; // New prop to determine data source
}

const SessionTable: React.FC<SessionTableProps> = ({ 
  type, 
  onReschedule, 
  onDownloadInvoice,
  dataSource = 'appointments' // Default to appointments API
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get user role from auth store
  const { role } = useAuthStore();
  
  // Determine if user is counselor
  const isCounselor = role === 'counselor';

  // Dashboard API queries
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['dashboard-data', isCounselor ? 'service-provider' : 'user'],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return await DashboardApi(isCounselor ? 'service-provider' : 'user', { signal: controller.signal });
    },
    retry: (failureCount, error: unknown) => {
      // Don't retry if the request was aborted
      const queryError = error as QueryError;
      if (queryError?.name === 'AbortError' || queryError?.code === 'ERR_CANCELED') {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    enabled: dataSource === 'dashboard' && !!role
  });

  // Appointments API queries (existing logic with improved error handling)
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
      return await getCounselorAppointments({ signal: controller.signal });
    },
    retry: (failureCount, error: unknown) => {
      // Don't retry if the request was aborted
      const queryError = error as QueryError;
      if (queryError?.name === 'AbortError' || queryError?.code === 'ERR_CANCELED') {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    enabled: dataSource === 'appointments' && isCounselor && !!role
  });

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
      return await getUserAppointments({ signal: controller.signal });
    },
    retry: (failureCount, error: unknown) => {
      // Don't retry if the request was aborted
      const queryError = error as QueryError;
      if (queryError?.name === 'AbortError' || queryError?.code === 'ERR_CANCELED') {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    enabled: dataSource === 'appointments' && !isCounselor && !!role
  });

  // Process appointments data
  useEffect(() => {
    let appointmentsList: Appointment[] = [];

    if (dataSource === 'dashboard') {
      // Handle dashboard data
      if (dashboardData && dashboardData.data) {
        // Transform dashboard appointments to match Appointment interface
        const dashboardAppointments = dashboardData.data.upcomingAppointments.map(appointment => ({
          bookingId: appointment._id,
          fullName: appointment.fullname,
          profilePicture: appointment.profilePicture,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          chatId: null, // Dashboard API doesn't provide chatId
          status: 'upcoming' as const, // Dashboard only shows upcoming
          action: {
            joinMeetingLink: appointment.joinLink,
            invoiceDownloadLink: undefined // Changed from null to undefined
          }
        }));
        appointmentsList = dashboardAppointments;
      }
    } else {
      // Handle appointments API data (existing logic)
      if (isCounselor) {
        if (counselorData && counselorData.data) {
          appointmentsList = Array.isArray(counselorData.data) ? counselorData.data : [];
        }
      } else {
        if (userData && userData.data) {
          if (Array.isArray(userData.data)) {
            appointmentsList = userData.data;
          } else {
            const dashboardData = userData.data as UserDashboardData;
            appointmentsList = dashboardData.upcomingAppointments || [];
          }
        }
      }
    }

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
      
      return shouldInclude;
    });
    
    setAppointments(filteredAppointments);
  }, [counselorData, userData, dashboardData, type, isCounselor, role, dataSource]);

  useEffect(() => {
    return () => {
      // Clean up abort controller on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Clean up dropdown when component unmounts or type changes
  useEffect(() => {
    setActiveDropdown(null);
  }, [type]);

  const toggleDropdown = (appointmentId: string) => {
    setActiveDropdown(activeDropdown === appointmentId ? null : appointmentId);
  };

  // Updated handleActionClick with new invoice download logic
  const handleActionClick = async (action: string, appointment: Appointment) => {
    setActiveDropdown(null);
    
    switch(action) {
      case 'startMeeting':
        if (appointment.action?.joinMeetingLink) {
          window.open(appointment.action.joinMeetingLink, '_blank');
        } else {
          navigate(`/meeting/${appointment.bookingId}`);
        }
        break;
      case 'chat':
        if (appointment.chatId) {
          navigate(`chat/${appointment.chatId}`);
        } else {
          navigate(`chat/${appointment.bookingId}`);
        }
        break;
      case 'reschedule':
        onReschedule?.(appointment.bookingId);
        break;
      case 'downloadInvoice':
        try {
          setDownloadingInvoice(appointment.bookingId);
          
          // Use the new API endpoint instead of the link
          await downloadInvoice(appointment.bookingId);
          
          toast.success('Invoice downloaded successfully');
          
          // Call the optional callback if provided
          if (onDownloadInvoice) {
            onDownloadInvoice(appointment.bookingId);
          }
        } catch (error: unknown) {
          console.error('Invoice download error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to download invoice';
          toast.error(errorMessage);
        } finally {
          setDownloadingInvoice(null);
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

  // Determine loading state based on data source
  const isLoading = dataSource === 'dashboard' 
    ? dashboardLoading 
    : (isCounselor ? counselorLoading : userLoading);

  if (isLoading) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base">
          Loading {type} appointments...
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Debug: Role={role}, DataSource={dataSource}, Endpoint={
            dataSource === 'dashboard' 
              ? (isCounselor ? '/api/service-provider/dashboard' : '/api/user/dashboard')
              : (isCounselor ? '/api/service-provider/appointments' : '/api/user/appointments')
          }
        </div>
      </div>
    );
  }

  // Determine error state and refetch function based on data source
  const error = dataSource === 'dashboard' 
    ? dashboardError 
    : (isCounselor ? counselorError : userError);
  
  const refetch = dataSource === 'dashboard' 
    ? refetchDashboard 
    : (isCounselor ? refetchCounselor : refetchUser);
  
  // Improved error handling - don't show error for aborted requests
  if (error) {
    // Check if it's an AbortError or network cancellation
    const queryError = error as QueryError;
    const isAbortError = queryError?.name === 'AbortError' || 
                        queryError?.code === 'ERR_CANCELED' || 
                        queryError?.message?.includes('canceled') ||
                        queryError?.message?.includes('aborted');
    
    if (!isAbortError) {
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
  }

  // Empty state with more debugging info
  if (appointments.length === 0) {
    const debugInfo = dataSource === 'dashboard' 
      ? (dashboardData?.data ? dashboardData.data.upcomingAppointments.length : 'No data')
      : (isCounselor 
          ? (counselorData?.data ? Array.isArray(counselorData.data) ? counselorData.data.length : 'Not array' : 'No data')
          : (userData?.data ? Array.isArray(userData.data) ? userData.data.length : 'Not array' : 'No data')
        );

    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base mb-2">
          No {type} appointments to display.
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Debug: Role={role}, IsCounselor={isCounselor}</div>
          <div>DataSource: {dataSource}</div>
          <div>Raw data length: {debugInfo}</div>
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
              <tr key={appointment.bookingId} className="hover:bg-gray-50 transition-colors">
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
                  {new Date(appointment.date + 'T00:00:00').toLocaleDateString()}
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
                        onClick={() => toggleDropdown(appointment.bookingId)}
                      >
                        <span className="text-xs lg:text-sm">Actions</span>
                        <ChevronDownIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      
                      {activeDropdown === appointment.bookingId && (
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
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleActionClick('downloadInvoice', appointment)}
                              disabled={downloadingInvoice === appointment.bookingId}
                            >
                              <WithdrawIcon className="w-4 h-4 mr-2" />
                              <span>
                                {downloadingInvoice === appointment.bookingId ? 'Downloading...' : 'Download Invoice'}
                              </span>
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
          <div key={appointment.bookingId} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
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
                <span className="text-gray-900 font-medium">{new Date(appointment.date + 'T00:00:00').toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Time</span>
                <span className="text-gray-900 font-medium">{appointment.time}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 z-30">
              {type === 'upcoming' ? (
                <div className="flex flex-wrap gap-2 z-40">
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
                  className="flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleActionClick('downloadInvoice', appointment)}
                  disabled={downloadingInvoice === appointment.bookingId}
                >
                  <WithdrawIcon className="w-4 h-4 mr-2" />
                  {downloadingInvoice === appointment.bookingId ? 'Downloading...' : 'Download Invoice'}
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