import React, { useState } from 'react';
import TherapistList from '../../components/CounselorList/TherapistList';
import BookingSession from '../../components/CounselorList/Booking';
import TherapistDetail from '../../components/CounselorList/TherapistDetail';
import { SessionType } from '../../components/CounselorList/types';

type ViewType = 'list' | 'booking' | 'detail';

interface AppState {
  currentView: ViewType;
  selectedTherapistId: string | null;
  selectedSessionType: SessionType | null;
}

const Counselor: React.FC = () => {
 const [appState, setAppState] = useState<AppState>({
    currentView: 'list',
    selectedTherapistId: null,
    selectedSessionType: null
  });

  const navigateToBooking = (therapistId: string, sessionType: SessionType) => {
    setAppState({
      currentView: 'booking',
      selectedTherapistId: therapistId,
      selectedSessionType: sessionType
    });
  };

  const navigateToProfile = (therapistId: string) => {
    setAppState({
      currentView: 'detail',
      selectedTherapistId: therapistId,
      selectedSessionType: null
    });
  };

  const navigateToBookingFromProfile = (therapistId: string, sessionType: SessionType) => {
    setAppState({
      currentView: 'booking',
      selectedTherapistId: therapistId,
      selectedSessionType: sessionType
    });
  };

  const navigateToList = () => {
    setAppState({
      currentView: 'list',
      selectedTherapistId: null,
      selectedSessionType: null
    });
  };

  const renderCurrentPage = () => {
    switch (appState.currentView) {
      case 'list':
        return (
          <TherapistList
            onBookAppointment={navigateToBooking}
            onViewProfile={navigateToProfile}
          />
        );
      
      case 'booking':
        if (!appState.selectedTherapistId || !appState.selectedSessionType) {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing booking information</h2>
                <button
                  onClick={navigateToList}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Therapist List
                </button>
              </div>
            </div>
          );
        }
        return (
          <BookingSession
            therapistId={appState.selectedTherapistId}
            sessionType={appState.selectedSessionType}
            onBack={navigateToList}
          />
        );
      
      case 'detail':
        if (!appState.selectedTherapistId) {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing therapist information</h2>
                <button
                  onClick={navigateToList}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Therapist List
                </button>
              </div>
            </div>
          );
        }
        return (
          <TherapistDetail
            therapistId={appState.selectedTherapistId}
            onBack={navigateToList}
            onBookSession={navigateToBookingFromProfile}
          />
        );
      
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Page not found</h2>
              <button
                onClick={navigateToList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Therapist List
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPage()}
    </div>
  );
};

export default Counselor;
