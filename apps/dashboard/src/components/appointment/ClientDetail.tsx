// ClientDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MeetingIcon, ChevronLeftIcon } from '../../assets/icons';
import { Client, Session } from './types';
import { UPCOMING_SESSIONS, PASSED_SESSIONS } from './constants';

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to convert Session data to Client data
  const convertSessionToClient = (session: Session): Client => {
    return {
      id: session.id,
      name: session.clientName,
      occupation: session.profession,
      experience: session.experience,
      nationality: session.nationality,
      about: session.clientBio,
      imageUrl: session.clientImage
    };
  };

  // Function to find session by ID from constants
  const findSessionById = (sessionId: string): Session | null => {
    const allSessions = [...UPCOMING_SESSIONS, ...PASSED_SESSIONS];
    return allSessions.find(session => session.id === sessionId) || null;
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      let foundSession: Session | null = null;

      // Check if session data was passed via navigation state
      const sessionData = location.state?.sessionData as Session;
      
      if (sessionData) {
        // Use session data passed from navigation
        foundSession = sessionData;
      } else if (clientId) {
        // Try to find session data by ID from constants
        foundSession = findSessionById(clientId);
      }

      if (foundSession) {
        // Convert session data to client data
        const clientData = convertSessionToClient(foundSession);
        setClient(clientData);
      } else {
        // No session found - set client to null
        setClient(null);
      }
      
      setLoading(false);
    }, 500);
  }, [clientId, location.state]);

  const handleBackClick = () => {
    // React Router navigation to the appointments page
    navigate('/appointments');
  };

  const handleStartVideoCall = () => {
    if (client) {
      console.log(`Starting video call with ${client.name}`);
      // Implementation for starting the video call
      // For example, navigate to a video call route with the client ID
      navigate(`/video-call/${client.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Loading client details...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Client not found</p>
          <button 
            onClick={handleBackClick}
            className="bg-primary hover:bg-darkerb text-white py-2 px-4 rounded-md transition-colors"
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Client Image */}
            <div className="md:w-1/4">
              <div className="h-full">
                <img 
                  src={client.imageUrl} 
                  alt={`${client.name}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Client Details */}
            <div className="md:w-3/4 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{client.name}</h1>
              <p className="text-gray-700 mb-1">{client.occupation}</p>
              <p className="text-gray-700 mb-1">{client.experience}</p>
              <p className="text-gray-700 mb-6">{client.nationality}</p>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About Client</h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {client.about}
                </div>
              </div>

              {/* Video Call Button */}
              <div className="mt-6">
                <button
                  onClick={handleStartVideoCall}
                  className="bg-primary hover:bg-darkerb text-white py-3 px-4 rounded-md flex items-center justify-center w-full md:w-64 transition-colors"
                >
                  <MeetingIcon />
                  <span className="ml-2">Start Video Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;