import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IBookingRequest {
  therapistId: string;
  sessionType: "video" | "in-person";
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  price: number;
}

export interface IBookingResponse {
  bookingId: string;
  paymentUrl?: string;
  reference: string;
  status: "pending" | "confirmed" | "cancelled";
  message: string;
}

// Group booking interfaces
export interface IGroupBookingRequest {
  therapistId: string;
  sessionType: "video" | "in-person";
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  groupClientEmails: string[];
}

interface IAgoraTokenInfo {
  token: string;
  expiresAt: number;
  uid: number;
}

interface IAgoraGroupClientToken {
  userId: string;
  token: string;
  expiresAt: number;
  uid: number;
}

interface IAgoraGroupClientUid {
  userId: string;
  uid: number;
}

interface IGroupClient {
  userId: string;
  email: string;
}

export interface IGroupBookingResponse {
  _id: string;
  therapistId: string;
  userId: string;
  payerId: string;
  sessionType: "video" | "in-person";
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  therapistShare: number;
  adminShare: number;
  status: "pending" | "confirmed" | "cancelled";
  isGroupBooking: boolean;
  groupClients: IGroupClient[];
  agoraChannel: string;
  agoraTokens: {
    therapist: IAgoraTokenInfo;
    client: IAgoraTokenInfo;
    groupClients: IAgoraGroupClientToken[];
  };
  agoraUids: {
    therapist: number;
    client: number;
    groupClients: IAgoraGroupClientUid[];
  };
}

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface IGroupBookingAPIResponse {
  message: string;
  booking: IGroupBookingResponse;
}

// Create a booking
export default async function createBookingApi(
  data: IBookingRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IBookingResponse> | null> {
  try {
    const response = await Api.post<APIResponse<IBookingResponse>>(
      '/api/user/booking',
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

// Create a group booking
export async function createGroupBookingApi(
  data: IGroupBookingRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IGroupBookingResponse> | null> {
  try {
    const response = await Api.post<IGroupBookingAPIResponse>(
      '/api/user/booking/group',
      data,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "Group booking created",
      data: response.data.booking
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

// Webhook handler interface (for reference, actual webhook handling is server-side)
export interface IWebhookPayload {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    metadata?: {
      bookingId: string;
      therapistId: string;
      userId: string;
    };
  };
}

// Get booking status (if needed)
export async function getBookingStatusApi(
  bookingId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<{ status: string; booking: string }> | null> {
  try {
    const response = await Api.get<APIResponse<{ status: string; booking: string }>>(
      `/api/user/booking/${encodeURIComponent(bookingId)}`,
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