import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";

export interface ITimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  _id: string;
  meetingType?: "video" | "in-person" | "both";
  isBooked?: boolean;
}

export interface IScheduleItem {
  _id: string;
  therapist: string;
  day: string; // e.g., "Monday", "Tuesday", etc.
  meetingType: "video" | "in-person" | "both";
  timezone: string;
  isAvailable: boolean;
  teamBooking: boolean;
  allowGroupBooking?: boolean;
  validFrom?: string;
  validUntil?: string;
  slots: ITimeSlot[];
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITherapistScheduleResponse {
  schedules: IScheduleItem[];
  date?: string;
}

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Get therapist schedule for video sessions
export async function getTherapistVideoScheduleApi(
  therapistId: string,
  config?: AxiosRequestConfig,
  date?: string
): Promise<IAPIResult<ITherapistScheduleResponse> | null> {
  try {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const response = await Api.get<APIResponse<ITherapistScheduleResponse>>(
      `/api/schedule/${encodeURIComponent(therapistId)}/video${query}`,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

// Get therapist schedule for in-person sessions
export async function getTherapistInPersonScheduleApi(
  therapistId: string,
  config?: AxiosRequestConfig,
  date?: string
): Promise<IAPIResult<ITherapistScheduleResponse> | null> {
  try {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const response = await Api.get<APIResponse<ITherapistScheduleResponse>>(
      `/api/schedule/${encodeURIComponent(therapistId)}/in-person${query}`,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

// Generic function to get therapist schedule based on session type
export async function getTherapistScheduleApi(
  therapistId: string,
  sessionType: "video" | "physical",
  config?: AxiosRequestConfig,
  date?: string
): Promise<IAPIResult<ITherapistScheduleResponse> | null> {
  if (sessionType === "video") {
    return getTherapistVideoScheduleApi(therapistId, config, date);
  } else {
    return getTherapistInPersonScheduleApi(therapistId, config, date);
  }
}

// Get all therapist schedules (both video and in-person)
export async function getAllTherapistSchedulesApi(
  therapistId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistScheduleResponse> | null> {
  try {
    const response = await Api.get<APIResponse<ITherapistScheduleResponse>>(
      `/api/schedule/${encodeURIComponent(therapistId)}`,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}
