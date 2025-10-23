import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";


export interface SessionCompletionResponse {
  message: string;
  booking: {
    _id: string;
    status: string;
    clientCompleted: boolean;
    therapistCompleted: boolean;
    canComplete: boolean;
  };
  adminCommission?: number;
}

interface SessionCompletionAPIResponse {
  status: string;
  message: string;
  data: SessionCompletionResponse;
}

// Types for API responses
export interface AppointmentAction {
  joinMeetingLink?: string;
  agoraChannel?: string;
  agoraToken?: {
    token: string;
    expiresAt: string;
    uid: number
  }
  invoiceDownloadLink?: string;
}

// Updated interface to match actual API response
export interface Appointment {
  bookingId: string;
  fullName: string;
  profilePicture: string;
  date: string;
  time: string;
  type: string;
  chatId: string | null;
  status: "upcoming" | "passed" | "confirmed";
  action: AppointmentAction;
  // Additional fields based on actual API responses
  therapistId?: string; // Present in user appointments
  userId?: string;     // Present in therapist appointments
}

export interface UserDashboardData {
  walletBalance: number;
  totalSessions: number;
  timeSpent: number;
  amountPaid: number;
  upcomingAppointments: Appointment[];
}

export interface UserProfile {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  seenBy: string[];
  createdAt: string;
  updatedAt: string;
}

interface AppointmentsAPIResponse {
  status: string;
  message: string;
  data: Appointment[];
}

interface UserDashboardAPIResponse {
  status: string;
  message: string;
  data: UserDashboardData;
}

interface UserProfileAPIResponse {
  status: string;
  message: string;
  data: UserProfile[];
}

// API Functions

// Get counselor appointments with enhanced debugging
export async function getCounselorAppointments(
  config?: AxiosRequestConfig
): Promise<IAPIResult<Appointment[]> | null> {
  try {
    const response = await Api.get<AppointmentsAPIResponse>(
      '/api/service-provider/appointments',
      config
    );
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
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

// Alternative function to get appointments with specific therapist ID
export async function getCounselorAppointmentsByTherapistId(
  therapistId?: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Appointment[]> | null> {
  try {
    const endpoint = therapistId 
      ? `/api/service-provider/appointments?therapistId=${therapistId}`
      : '/api/service-provider/appointments';
    
    const response = await Api.get<AppointmentsAPIResponse>(endpoint, config);
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
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

// Get user appointments (dashboard data) with enhanced debugging
export async function getUserAppointments(
  config?: AxiosRequestConfig
): Promise<IAPIResult<UserDashboardData> | null> {
  try {
    const response = await Api.get<UserDashboardAPIResponse>(
      '/api/user/appointments',
      config
    );
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
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

// Get user profile by user ID
export async function getUserProfile(
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<UserProfile[]> | null> {
  try {
    const response = await Api.get<UserProfileAPIResponse>(
      `/api/service-provider/appointments/${userId}/profile`,
      config
    );
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
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

// Get appointments with specific user
export async function getAppointmentsWithUser(
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string[]> | null> {
  try {
    const response = await Api.get<{
      status: string;
      message: string;
      data: string[];
    }>(`/api/service-provider/appointments/${userId}`, config);
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
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

// NEW: Download invoice PDF function
export async function downloadInvoice(
  bookingId: string,
  config?: AxiosRequestConfig
): Promise<void> {
  try {
    const response = await Api.get(`/api/invoice/${bookingId}/invoice/`, {
      ...config,
      responseType: 'blob', // Important: Set response type to blob for PDF
    });

    // Create blob from response data
    const blob = new Blob([response.data], { type: 'application/pdf' });
    
    // Create download URL
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `invoice-${bookingId}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (e) {
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    
    throw {
      code: statusCode,
      status: "error",
      message: errorMessage || "Failed to download invoice",
      data: undefined,
    };
  }
}


export async function completeSession(
  bookingId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<SessionCompletionResponse> | null> {
  try {
    const response = await Api.post<SessionCompletionAPIResponse>(
      `/api/user/counselors/${bookingId}/complete`,
      {}, // Empty body
      config
    );
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Session completed successfully",
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