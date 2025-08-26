import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MeetingIcon, ChevronLeftIcon } from '../../assets/icons';
import { getUserProfile, getAppointmentsWithUser, Appointment } from '../../api/Appointments.api';

interface Client {
  id: string;
  name: string;
  occupation?: string;
  experience?: string;
  nationality?: string;
  about?: string;
  imageUrl: string;
  email?: string;
  userId?: string;
}

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [client, setClient] = useState<Client | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract appointment data from navigation state
  const appointmentData = location.state?.appointmentData as Appointment;

  // Query for user profile
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile', clientId],
    queryFn: () => {
      if (!clientId) return Promise.reject(new Error('No client ID'));
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return getUserProfile(clientId, { signal: controller.signal });
    },
    enabled: !!clientId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Query for appointment history
  const { data: appointmentHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['appointment-history', clientId],
    queryFn: () => {
      if (!clientId) return Promise.reject(new Error('No client ID'));
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return getAppointmentsWithUser(clientId, { signal: controller.signal });
    },
    enabled: !!clientId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Function to convert Appointment data to Client data
  const convertAppointmentToClient = (appointment: Appointment): Client => {
    return {
      id: appointment.bookingId,
      name: appointment.fullName,
      imageUrl: appointment.profilePicture,
      about: `Client information for ${appointment.fullName}. Appointment scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}.`,
    };
  };

  useEffect(() => {
    const processClientData = async () => {
      try {
        setLoading(true);
        
        let clientData: Client | null = null;

        // First, try to use appointment data passed via navigation state
        if (appointmentData) {
          clientData = convertAppointmentToClient(appointmentData);
          
          // If we have profile data, enhance the client data
          if (profileData?.data && profileData.data.length > 0) {
            const profile = profileData.data[0];
            clientData = {
              ...clientData,
              userId: profile.userId,
              about: profile.message || clientData.about,
            };
          }
        } else if (profileData?.data && profileData.data.length > 0) {
          // Use profile data if available
          const profile = profileData.data[0];
          clientData = {
            id: clientId || profile._id,
            name: profile.title || 'Unknown Client',
            imageUrl: '/default-avatar.png', // Fallback image
            about: profile.message,
            userId: profile.userId,
          };
        }

        // Set appointment history if available
        if (appointmentHistoryData?.data) {
          setAppointmentHistory(appointmentHistoryData.data);
        }

        setClient(clientData);
      } catch  {
       
        toast.error('Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    processClientData();
  }, [appointmentData, profileData, appointmentHistoryData, clientId]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleBackClick = () => {
    navigate('/appointments');
  };

  const handleStartVideoCall = () => {
    if (client) {
      console.log(`Starting video call with ${client.name}`);
      // Check if there's a meeting link from appointment data
      if (appointmentData?.action?.joinMeetingLink) {
        window.open(appointmentData.action.joinMeetingLink, '_blank');
      } else {
        // Navigate to video call route with the client ID
        navigate(`/video-call/${client.id}`);
      }
    }
  };

  const handleStartChat = () => {
    if (client && appointmentData?.chatId) {
      navigate(`/chat/${appointmentData.chatId}`);
    } else if (client) {
      navigate(`/chat/${client.id}`);
    }
  };

  if (loading || profileLoading || historyLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (profileError || !client) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {profileError ? 'Failed to load client details' : 'Client not found'}
          </p>
          <button 
            onClick={handleBackClick}
            className="bg-primary hover:bg-blue-800 text-white py-2 px-4 rounded-md transition-colors"
          >
            Go Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-gray-700 hover:text-primary transition-colors"
            aria-label="Go back to appointments"
          >
            <ChevronLeftIcon className='text-gray-700 hover:text-primary transition-colors'/>
            <span className="text-xl font-medium ml-2">Client Detail</span>
          </button>
        </div>

        {/* Client Info Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Client Image */}
            <div className="md:w-1/4">
              <div className="h-64 md:h-full">
                <img 
                  src={client.imageUrl} 
                  alt={`${client.name}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              </div>
            </div>

            {/* Client Details */}
            <div className="md:w-3/4 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{client.name}</h1>
              
              {client.occupation && (
                <p className="text-gray-700 mb-1">{client.occupation}</p>
              )}
              {client.experience && (
                <p className="text-gray-700 mb-1">{client.experience}</p>
              )}
              {client.nationality && (
                <p className="text-gray-700 mb-6">{client.nationality}</p>
              )}

              {/* Appointment History */}
              {appointmentHistory.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Appointment History</h2>
                  <p className="text-gray-600 text-sm">
                    {appointmentHistory.length} previous appointment{appointmentHistory.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* About Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About Client</h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {client.about || 'No additional information available.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartVideoCall}
                  className="bg-primary hover:bg-blue-800 text-white py-3 px-6 rounded-md flex items-center justify-center transition-colors"
                >
                  <MeetingIcon className="w-5 h-5 mr-2" />
                  <span>Start Video Call</span>
                </button>
                
                {appointmentData?.chatId && (
                  <button
                    onClick={handleStartChat}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-md flex items-center justify-center transition-colors"
                  >
                    <span>Start Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {appointmentData && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Appointment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <p className="text-gray-600">{new Date(appointmentData.date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Time:</span>
                <p className="text-gray-600">{appointmentData.time}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-600">{appointmentData.type}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;