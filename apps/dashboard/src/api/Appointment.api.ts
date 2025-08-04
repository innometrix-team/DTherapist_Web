import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Types for appointment data
export interface IAppointment {
  id: string;
  clientName: string;
  clientImage: string;
  date: string;
  time: string;
  timeZone: string;
  type: string;
  status: 'upcoming' | 'passed';
  price?: string;
  profession?: string;
  experience?: string;
  nationality?: string;
  clientBio?: string;
}

export interface IClientProfile {
  id: string;
  name: string;
  occupation: string;
  experience: string;
  nationality: string;
  about: string;
  imageUrl: string;
  email?: string;
  phoneNumber?: string;
}

interface IAppointmentsResponse {
  appointments: IAppointment[];
  total: number;
}

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Get appointments for user (client)
export async function getUserAppointments(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAppointmentsResponse> | null> {
  try {
    const response = await Api.get<APIResponse<IAppointmentsResponse>>(
      '/api/user/appointments',
      {
        ...config,
      }
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

// Get appointments for counselor/service provider
export async function getCounselorAppointments(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAppointmentsResponse> | null> {
  try {
    const response = await Api.get<APIResponse<IAppointmentsResponse>>(
      '/api/service-provider/appointments',
      {
        ...config,
      }
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

// Get specific client appointments for counselor
export async function getClientAppointments(
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAppointmentsResponse> | null> {
  try {
    const response = await Api.get<APIResponse<IAppointmentsResponse>>(
      `/api/service-provider/appointments/${userId}`,
      {
        ...config,
      }
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

// Get client profile for counselor
export async function getClientProfile(
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IClientProfile> | null> {
  try {
    const response = await Api.get<APIResponse<IClientProfile>>(
      `/api/service-provider/appointments/${userId}/profile`,
      {
        ...config,
      }
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

// Schedule/Reschedule appointment
export interface IScheduleAppointmentData {
  sessionId?: string; // For rescheduling
  clientId?: string;
  date: string;
  time: string;
  type: string;
}

export async function scheduleAppointment(
  data: IScheduleAppointmentData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAppointment> | null> {
  try {
    const endpoint = data.sessionId 
      ? `/api/appointments/${data.sessionId}/reschedule`
      : '/api/appointments/schedule';
    
    const response = await Api.post<APIResponse<IAppointment>>(endpoint, data, {
      ...config,
    });
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