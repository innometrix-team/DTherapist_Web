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
    console.log('Navigating to booking:', { therapistId, sessionType }); // Debug log
    setAppState({
      currentView: 'booking',
      selectedTherapistId: therapistId,
      selectedSessionType: sessionType
    });
  };

  const navigateToProfile = (therapistId: string) => {
    console.log('Navigating to profile:', { therapistId }); // Debug log
    setAppState({
      currentView: 'detail',
      selectedTherapistId: therapistId,
      selectedSessionType: null
    });
  };

  const navigateToBookingFromProfile = (therapistId: string, sessionType: SessionType) => {
    console.log('Navigating to booking from profile:', { therapistId, sessionType }); // Debug log
    setAppState({
      currentView: 'booking',
      selectedTherapistId: therapistId,
      selectedSessionType: sessionType
    });
  };

  const navigateToList = () => {
    console.log('Navigating to list'); // Debug log
    setAppState({
      currentView: 'list',
      selectedTherapistId: null,
      selectedSessionType: null
    });
  };

  const renderCurrentPage = () => {
    console.log('Current app state:', appState); // Debug log

    switch (appState.currentView) {
      case 'list':
        return (
          <TherapistList
            onBookAppointment={navigateToBooking}
            onViewProfile={navigateToProfile}
          />
        );
      
      case 'booking':
        // More detailed validation and error messages
        if (!appState.selectedTherapistId) {
          console.error('Missing therapist ID for booking');
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Therapist Information</h2>
                <p className="text-gray-600 mb-6">Please select a therapist to book an appointment.</p>
                <button
                  onClick={navigateToList}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Therapist List
                </button>
              </div>
            </div>
          );
        }
        
        if (!appState.selectedSessionType) {
          console.error('Missing session type for booking');
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Session Type</h2>
                <p className="text-gray-600 mb-6">Please select a session type for your appointment.</p>
                <button
                  onClick={navigateToList}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          console.error('Missing therapist ID for detail view');
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Therapist Information</h2>
                <p className="text-gray-600 mb-6">Please select a therapist to view their profile.</p>
                <button
                  onClick={navigateToList}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        console.error('Unknown view type:', appState.currentView);
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
              <p className="text-gray-600 mb-6">The requested page could not be found.</p>
              <button
                onClick={navigateToList}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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