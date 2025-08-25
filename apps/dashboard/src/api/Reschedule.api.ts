import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Request interfaces for rescheduling (removed price field)
export interface ICounselorRescheduleRequest {
  bookingid: string;
  sessionType: "video" | "in-person";
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export interface IUserRescheduleRequest {
  bookingId: string; // Booking ID to identify the appointment
  therapistId: string;
  sessionType: "video" | "in-person";
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

// Response interface
export interface IRescheduleResponse {
  Id: string;
  message: string;
  status: "confirmed" | "pending";
  appointment?: {
    id: string;
    date: string;
    time: string;
    sessionType: string;
  };
}

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Reschedule booking as counselor/service provider
export async function rescheduleCounselorBookingApi(
  Id: string,
  data: ICounselorRescheduleRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IRescheduleResponse> | null> {
  try {;
    
    const response = await Api.put<APIResponse<IRescheduleResponse>>(
      `/api/service-provider/appointments/booking/${encodeURIComponent(Id)}`,
      data,
      { ...config }
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

// Reschedule booking as user/client
export async function rescheduleUserBookingApi(
  Id: string,
  data: IUserRescheduleRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IRescheduleResponse> | null> {
  try {
    
    const response = await Api.put<APIResponse<IRescheduleResponse>>(
      `/api/user/appointments/booking/${encodeURIComponent(Id)}`,
      data,
      { ...config }
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

// Generic reschedule function that determines which endpoint to use based on user role
export async function rescheduleBookingApi(
  bookingId: string,
  data: IUserRescheduleRequest | ICounselorRescheduleRequest,
  userRole: 'counselor' | 'user',
  config?: AxiosRequestConfig
): Promise<IAPIResult<IRescheduleResponse> | null> {
  if (userRole === 'counselor') {
    // For counselor, we don't need therapistId in the request
    const counselorData: ICounselorRescheduleRequest = {
      bookingid: bookingId,
      sessionType: data.sessionType,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime
    };
    return rescheduleCounselorBookingApi(bookingId, counselorData, config);
  } else {
    // For user, we need therapistId
    const userData = data as IUserRescheduleRequest;
    if (!userData.therapistId) {
      return Promise.reject({
        code: 400,
        status: 'error',
        message: 'therapistId is required for user reschedule',
        data: undefined,
      });
    }
    return rescheduleUserBookingApi(bookingId, userData, config);
  }
}