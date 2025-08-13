import { useState } from 'react';

// Import types
import { TabType } from '../../components/appointment/types';

// Import constants
import { UPCOMING_SESSIONS, PASSED_SESSIONS } from '../../components/appointment/constants';

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
  };

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

        {/* Main Content Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    {activeTab === 'upcoming' ? UPCOMING_SESSIONS.length : PASSED_SESSIONS.length}
                  </div>
                  <div className="text-xs text-blue-600/70 uppercase tracking-wider">
                    {activeTab === 'upcoming' ? 'Upcoming' : 'Completed'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-600">
                    {activeTab === 'upcoming' ? PASSED_SESSIONS.length : UPCOMING_SESSIONS.length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {activeTab === 'upcoming' ? 'Completed' : 'Upcoming'}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                {/* Desktop Summary */}
                <div className="hidden md:flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {UPCOMING_SESSIONS.length} session{UPCOMING_SESSIONS.length !== 1 ? 's' : ''} scheduled
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{UPCOMING_SESSIONS.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Total</div>
                  </div>
                </div>
                <SessionTable 
                  sessions={UPCOMING_SESSIONS} 
                  type="upcoming" 
                  onReschedule={(sessionId) => handleOpenModal('reschedule', sessionId)}
                />
              </div>
            )}
            
            {activeTab === 'passed' && (
              <div className="space-y-4">
                {/* Desktop Summary */}
                <div className="hidden md:flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Passed Sessions</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {PASSED_SESSIONS.length} session{PASSED_SESSIONS.length !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-success">{PASSED_SESSIONS.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Completed</div>
                  </div>
                </div>
                <SessionTable 
                  sessions={PASSED_SESSIONS} 
                  type="passed" 
                  onScheduleAgain={(sessionId) => handleOpenModal('schedule', sessionId)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button - Mobile Only */}
        <div className="fixed bottom-6 right-4 md:hidden z-30">
          <button 
            className="bg-primary hover:bg-blue-800 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            onClick={() => handleOpenModal('schedule', 'new')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Quick Stats Footer - Desktop Only */}
        <div className="hidden lg:block mt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{UPCOMING_SESSIONS.length}</div>
              <div className="text-sm text-gray-500 mt-1">Upcoming Sessions</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{PASSED_SESSIONS.length}</div>
              <div className="text-sm text-gray-500 mt-1">Completed Sessions</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{UPCOMING_SESSIONS.length + PASSED_SESSIONS.length}</div>
              <div className="text-sm text-gray-500 mt-1">Total Sessions</div>
            </div>
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