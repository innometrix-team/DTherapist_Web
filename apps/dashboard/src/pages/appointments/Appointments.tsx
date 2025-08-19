import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Import types
import { TabType } from '../../components/appointment/types';
import { getCounselorAppointments } from '../../api/Appointments.api';

// Import components
import TabNavigation from '../../components/appointment/TabNavigation';
import SessionTable from '../../components/appointment/SessionTable';
import ScheduleSession from '../../components/appointment/ScheduleSession';

const Appointments: React.FC = () => {
  // State for active tab (Upcoming or Passed)
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'schedule' | 'reschedule'>('schedule');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch appointments data
  const { data: appointmentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['counselor-appointments'],
    queryFn: () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return getCounselorAppointments({ signal: controller.signal });
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Calculate stats from the appointments data
  const appointments = appointmentsData?.data || [];
  const upcomingAppointments = appointments.filter(
    appointment => appointment.status === 'upcoming' || appointment.status === 'confirmed'
  );
  const passedAppointments = appointments.filter(
    appointment => appointment.status === 'passed'
  );

  // Function to handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Function to open modal
  const handleOpenModal = (type: 'schedule' | 'reschedule', sessionId: string) => {
    setModalType(type);
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Refetch data when modal closes to get updated information
    refetch();
  };

  // Callback functions for SessionTable
  const handleReschedule = (appointmentId: string) => {
    handleOpenModal('reschedule', appointmentId);
  };

  const handleDownloadInvoice = (appointmentId: string) => {
    console.log(`Downloading invoice for appointment: ${appointmentId}`);
    // Additional logic for invoice download can be added here
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">hmm something went wrong</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Banner */}
        <div 
          className="w-full h-24 sm:h-32 lg:h-40 rounded-lg mb-4 sm:mb-6 flex items-center justify-center px-4 sm:px-8 bg-black/50 bg-no-repeat bg-center bg-cover relative overflow-hidden"
          style={{
            backgroundImage: 'url(https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white relative z-10 text-center">
            My Sessions
          </h1>
        </div>

        {/* Main Content Container - Removed overflow-hidden to prevent dropdown clipping */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="p-4 sm:p-6 pb-0">
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Sessions Content */}
          <div className="p-4 sm:p-6">
            {/* Summary Stats - Mobile */}
            <div className="md:hidden mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {activeTab === 'upcoming' ? upcomingAppointments.length : passedAppointments.length}
                  </div>
                  <div className="text-xs text-blue-600/70 uppercase tracking-wider">
                    {activeTab === 'upcoming' ? 'Upcoming' : 'Completed'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-600">
                    {activeTab === 'upcoming' ? passedAppointments.length : upcomingAppointments.length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {activeTab === 'upcoming' ? 'Completed' : 'Upcoming'}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Content - Removed unnecessary nested containers and space-y-4 */}
            {activeTab === 'upcoming' && (
              <SessionTable 
                type="upcoming" 
                onReschedule={handleReschedule}
              />
            )}
            
            {activeTab === 'passed' && (
              <SessionTable 
                type="passed" 
                onDownloadInvoice={handleDownloadInvoice}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal for Scheduling/Rescheduling with High Z-Index */}
      {isModalOpen && selectedSessionId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <ScheduleSession 
              sessionId={selectedSessionId}
              isReschedule={modalType === 'reschedule'}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;