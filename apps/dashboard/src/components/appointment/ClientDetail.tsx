// ClientDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {  MeetingIcon, ChevronLeftIcon } from '../../assets/icons';
import { Client } from './types';



// Dummy client data to use as fallback
const dummyClient: Client = {
  id: "dummy-123",
  name: "Royce Stephenson",
  occupation: "Software Engineer",
  experience: "12 Years Experience",
  nationality: "Nigerian",
  about: "Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu\n\nLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu",
  imageUrl: "/api/placeholder/400/500"
};

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      
      if (clientId) {
       
        // For now dummy data with the ID from URL
        setClient({
          ...dummyClient,
          id: clientId
        });
      } else {
        // If no clientId is provided, use dummy data
        setClient(dummyClient);
      }
      setLoading(false);
    }, 500);
  }, [clientId]);

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
        <p className="text-gray-600">Client Details not available try again..</p>
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