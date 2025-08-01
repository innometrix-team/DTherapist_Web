import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Schedule interfaces
export interface IScheduleSlot {
  startTime: string;
  endTime: string;
}

export interface IScheduleRequestData {
  day: string;
  meetingType: string;
  timezone: string;
  isAvailable: boolean;
  slots: IScheduleSlot[];
}

export interface IPricingRequestData {
  videoPrice: number;
  inPersonPrice: number;
}

interface IScheduleResponseData {
  message: string;
}

interface IPricingResponseData {
  message: string;
}

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Schedule API function
export async function CreateScheduleApi(
  data: IScheduleRequestData[], 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IScheduleResponseData> | null> {
  try {
    const response = await Api.post<APIResponse<IScheduleResponseData>>('/api/schedule', data, {
      ...config,
    });
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Schedule created successfully",
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

// Pricing API function
export async function CreatePricingApi(
  data: IPricingRequestData, 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IPricingResponseData> | null> {
  try {
    const response = await Api.post<APIResponse<IPricingResponseData>>('/api/schedule/pricing', data, {
      ...config,
    });
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Pricing updated successfully",
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