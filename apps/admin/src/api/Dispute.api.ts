import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Dispute interfaces
export interface IDispute {
  _id: string;
  bookingId: string | IBookingDetails;
  clientId: string | IUserDetails;
  therapistId: string | IUserDetails;
  reason: string;
  description?: string;
  attachments?: string[];
  status: "open" | "resolved" | "rejected";
  resolution?: IResolution;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
}

export interface IBookingDetails {
  _id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  status?: string;
  [key: string]: unknown;
}

export interface IUserDetails {
  _id: string;
  fullName?: string;
  email?: string;
  [key: string]: unknown;
}

export interface IResolution {
  action: "refund" | "reject" | "other";
  notes: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface IResolveDisputeData {
  action: "refund" | "reject" | "other";
  notes: string;
}

// API Response interfaces
interface DisputesAPIResponse {
  message: string;
  count?: number;
  disputes: IDispute[];
}

interface DisputeAPIResponse {
  message: string;
  dispute: IDispute;
}

interface ResolveDisputeAPIResponse {
  message: string;
  dispute: IDispute;
}

// Get all disputes
export async function getDisputesApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDispute[]> | null> {
  try {
    const endpoint = '/api/admin/disputes';
    
    const response = await Api.get<DisputesAPIResponse>(endpoint, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "success",
      data: response.data.disputes
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

// Get single dispute
export async function getDisputeApi(
  disputeId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDispute> | null> {
  try {
    const endpoint = `/api/admin/disputes/${disputeId}`;
    
    const response = await Api.get<DisputeAPIResponse>(endpoint, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "success",
      data: response.data.dispute
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

// Resolve dispute
export async function resolveDisputeApi(
  disputeId: string,
  resolutionData: IResolveDisputeData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDispute> | null> {
  try {
    const endpoint = `/api/admin/disputes/${disputeId}/resolve`;
    
    const response = await Api.post<ResolveDisputeAPIResponse>(endpoint, resolutionData, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "success",
      data: response.data.dispute
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