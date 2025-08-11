import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IBookingRequest {
  therapistId: string;
  sessionType: "video" | "physical";
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

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Create a booking
export default async function createBookingApi(
  data: IBookingRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IBookingResponse> | null> {
  try {
    const response = await Api.post<APIResponse<IBookingResponse>>(
      '/api/user/counselor/booking',
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
      `/api/user/bookings/${encodeURIComponent(bookingId)}`,
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