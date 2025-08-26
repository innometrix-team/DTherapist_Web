import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

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

// Updated to match actual API response - messages are directly in data array
export interface ChatHistoryResponse {
  status: string;
  message: string;
  data: ChatMessage[]; // Direct array, not nested object
}

// Interface for appointment data - Replace 'any' with proper typing
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

// Interface for recipient info
export interface RecipientInfo {
  id: string;
  name: string;
  avatar: string;
  occupation: string;
}

// Send a message to another user
export async function sendChatMessage(
  data: SendMessageRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<SendMessageResponse['data']> | null> {
  try {
    
    const response = await Api.post<SendMessageResponse>(
      '/api/chat/messages',
      data,
      config
    );
    
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Message sent successfully",
      data: response.data.data
    });
  } catch (e) {
    
    if (axios.isCancel(e)) {
    
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Get chat history for a specific chatId
export async function getChatHistory(
  chatId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ChatMessage[]> | null> {
  try {
    
    const response = await Api.get<ChatHistoryResponse>(
      `/api/chat/messages/${chatId}`,
      config
    );
    
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Chat history retrieved successfully",
      data: response.data.data // This is now ChatMessage[] directly
    });
  } catch (e) {
    
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    
    
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Helper function to get receiver info from appointment data
// Fixed: Replaced 'any' with proper AppointmentData type
export function getReceiverFromAppointment(
  appointment: AppointmentData, 
  currentUserRole: string
): RecipientInfo {
  // If current user is counselor, receiver is the client
  // If current user is client, receiver is the counselor
  
  if (currentUserRole === 'counselor') {
    return {
      id: appointment.clientId || appointment.userId || '',
      name: appointment.fullName,
      avatar: appointment.profilePicture || '/default-avatar.png',
      occupation: 'Client'
    };
  } else {
    return {
      id: appointment.therapistId || appointment.counselorId || '',
      name: appointment.counselorName || appointment.therapistName || 'Therapist',
      avatar: appointment.counselorAvatar || '/default-counselor-avatar.png',
      occupation: 'Therapist'
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
    isOwn: message.senderId === currentUserId
  };
}