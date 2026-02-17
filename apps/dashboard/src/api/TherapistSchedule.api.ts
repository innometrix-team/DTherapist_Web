import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface ITimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  _id: string;
}

export interface IScheduleItem {
  _id: string;
  therapist: string;
  day: string; // e.g., "Monday", "Tuesday", etc.
  meetingType: "video" | "in-person";
  timezone: string;
  isAvailable: boolean;
  slots: ITimeSlot[];
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITherapistScheduleResponse {
  schedules: IScheduleItem[];
}

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Get therapist schedule for video sessions
export async function getTherapistVideoScheduleApi(
  therapistId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistScheduleResponse> | null> {
  try {
    const response = await Api.get<APIResponse<ITherapistScheduleResponse>>(
      `/api/schedule/${encodeURIComponent(therapistId)}/video`,
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

// Get therapist schedule for in-person sessions
export async function getTherapistInPersonScheduleApi(
  therapistId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistScheduleResponse> | null> {
  try {
    const response = await Api.get<APIResponse<ITherapistScheduleResponse>>(
      `/api/schedule/${encodeURIComponent(therapistId)}/in-person`,
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

// Generic function to get therapist schedule based on session type
export async function getTherapistScheduleApi(
  therapistId: string,
  sessionType: "video" | "physical",
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistScheduleResponse> | null> {
  if (sessionType === "video") {
    return getTherapistVideoScheduleApi(therapistId, config);
  } else {
    return getTherapistInPersonScheduleApi(therapistId, config);
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