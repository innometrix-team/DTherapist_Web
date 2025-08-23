import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Types for API responses
export interface AppointmentAction {
  joinMeetingLink?: string;
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