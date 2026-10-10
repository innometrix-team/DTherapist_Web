import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest } from "./Api";

// Types for Chat API
export interface ChatMessage {
  _id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SendMessageRequest {
  receiverId: string;
  message: string;
}

export interface SendMessageResponse {
  status: string;
  message: string;
  data: {
    chatId: string;
    messageData: ChatMessage;
  };
}

export interface ChatHistoryResponse {
  status: string;
  message: string;
  data: ChatMessage[];
}

export interface AppointmentData {
  bookingId: string;
  clientId?: string;
  userId?: string;
  therapistId?: string;
  counselorId?: string;
  fullName: string;
  profilePicture: string;
  counselorName?: string;
  therapistName?: string;
  counselorAvatar?: string;
  chatId?: string;
}

export interface RecipientInfo {
  id: string;
  name: string;
  avatar: string;
  occupation: string;
}

// Send a message to another user
export const sendChatMessage = (
  data: SendMessageRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<SendMessageResponse['data']> | null> =>
  handleApiRequest<SendMessageResponse['data']>(() =>
    Api.post<SendMessageResponse>('/api/chat/messages', data, config)
  );

// Get chat history for a specific chatId
export const getChatHistory = (
  chatId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ChatMessage[]> | null> =>
  handleApiRequest<ChatMessage[]>(() =>
    Api.get<ChatHistoryResponse>(`/api/chat/messages/${chatId}`, config)
  );

// Helper function to get receiver info from appointment data
export function getReceiverFromAppointment(
  appointment: AppointmentData,
  currentUserRole: string
): RecipientInfo {
  if (currentUserRole === 'counselor') {
    return {
      id: appointment.clientId || appointment.userId || '',
      name: appointment.fullName,
      avatar: appointment.profilePicture || '/default-avatar.png',
      occupation: 'Client',
    };
  } else {
    return {
      id: appointment.therapistId || appointment.counselorId || '',
      name: appointment.counselorName || appointment.therapistName || 'Therapist',
      avatar: appointment.counselorAvatar || '/default-counselor-avatar.png',
      occupation: 'Therapist',
    };
  }
}

// Helper function to transform chat messages to component format
export function transformChatMessage(message: ChatMessage, currentUserId: string) {
  return {
    id: message._id,
    content: message.message,
    timestamp: new Date(message.createdAt),
    senderId: message.senderId,
    isOwn: message.senderId === currentUserId,
  };
}