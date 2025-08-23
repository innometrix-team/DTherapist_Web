import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import ChatComponent from '../../components/appointment/Chat';
import { getCounselorAppointments, getUserAppointments, Appointment, UserDashboardData } from '../../api/Appointments.api';
import { useAuthStore } from '../../store/auth/useAuthStore';

// Extended appointment interface to handle additional properties
interface ExtendedAppointment extends Appointment {
  userId?: string;
  counselorId?: string;
  clientId?: string;
  counselorName?: string;
  therapistName?: string;
  counselorAvatar?: string;
}

interface UserDetails {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

const ChatWrapper: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { role } = useAuthStore();
  const isCounselor = role === 'counselor';

  // Helper function to extract client ID from appointment
  const extractClientId = useCallback((appointment: Appointment): string => {
    // Cast to extended interface to access additional properties
    const extendedAppointment = appointment as ExtendedAppointment;
    const userId = extendedAppointment.userId;
    
    if (userId && typeof userId === 'string') {
      return userId;
    }
    
    
    return appointment.bookingId; // fallback
  }, []);

  // Helper function to extract counselor ID from appointment  
  const extractCounselorId = useCallback((appointment: Appointment): string => {
    // Cast to extended interface to access additional properties
    const extendedAppointment = appointment as ExtendedAppointment;
    const therapistId = extendedAppointment.therapistId;
    
    if (therapistId && typeof therapistId === 'string') {
      return therapistId;
    }
    
    return appointment.bookingId; // fallback
  }, []);

  // Fetch appointments based on user role
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: [isCounselor ? 'counselor-appointments' : 'user-appointments'],
    queryFn: async () => {
      if (isCounselor) {
        return await getCounselorAppointments();
      } else {
        return await getUserAppointments();
      }
    },
    enabled: !!role && !!chatId,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevents unnecessary re-fetches
  });

  // Extract appointment and user details - memoized to prevent re-renders
  const { appointment, recipientDetails } = useMemo(() => {
    if (!appointmentsData?.data || !chatId) {
      return { appointment: null, recipientDetails: null };
    }

    let appointments: Appointment[] = [];

    // Handle different data structures
    if (isCounselor) {
      appointments = Array.isArray(appointmentsData.data) ? appointmentsData.data : [];
    } else {
      if (Array.isArray(appointmentsData.data)) {
        appointments = appointmentsData.data;
      } else {
        const dashboardData = appointmentsData.data as UserDashboardData;
        appointments = dashboardData.upcomingAppointments || [];
      }
    }

    // Find appointment by chatId or bookingId
    const foundAppointment = appointments.find(apt => {
      const extendedApt = apt as ExtendedAppointment;
      return extendedApt.chatId === chatId || apt.bookingId === chatId;
    });

    if (!foundAppointment) {

      return { appointment: null, recipientDetails: null };
    }


    // Extract recipient details based on user role
    let recipientDetails: UserDetails;
    const extendedAppointment = foundAppointment as ExtendedAppointment;

    if (isCounselor) {
      // Counselor chatting with client
      // Try to extract the actual client ID from appointment data
      const clientId = extractClientId(foundAppointment);
      
      recipientDetails = {
        id: clientId,
        name: extendedAppointment.fullName || 'Client',
        avatar: extendedAppointment.profilePicture || '/default-avatar.png',
        role: 'client'
      };
    } else {
      // Client chatting with counselor/therapist
      // Try to extract the actual therapist ID from appointment data
      const counselorId = extractCounselorId(foundAppointment);
      
      recipientDetails = {
        id: counselorId,
        name: extendedAppointment.counselorName || extendedAppointment.therapistName || extendedAppointment.fullName || 'Therapist',
        avatar: extendedAppointment.counselorAvatar || extendedAppointment.profilePicture || '/default-counselor-avatar.png',
        role: 'therapist'
      };
    }

    return { appointment: foundAppointment, recipientDetails };
  }, [appointmentsData, chatId, isCounselor, extractClientId, extractCounselorId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  // Error state - appointment not found
  if (!appointment || !recipientDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            Chat not found. Invalid chat ID: {chatId}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Please check the appointment link or contact support.
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatComponent 
      appointmentId={chatId || ''} 
      recipientDetails={recipientDetails}
      appointment={appointment}
    />
  );
};

export default ChatWrapper;