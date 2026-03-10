import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IAdminModerationReport {
  _id: string;
  reporterId: {
    _id: string;
    email: string;
    role: string;
  };
  messageId: {
    _id: string;
    content: string;
    userId: string;
    createdAt: string;
    groupId: string;
  } | string; // guard: backend may return a raw ID string instead of populated object
  groupId: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export interface IAdminModerationData {
  count: number;
  data: IAdminModerationReport[];
}

interface APIResponse {
  status: string;
  message: string;
  data: IAdminModerationData;
}

interface ReviewReportApiResponse {
  status: string;
  message: string;
}

interface DeleteReportApiResponse {
  status: string;
  message: string;
}

export default async function AdminModerationApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAdminModerationData> | null> {
  try {
    const response = await Api.get<APIResponse>(
      "/api/admin/moderation/reports/pending",
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
    return Promise.reject({ code: statusCode, status, message: errorMessage });
  }
}

export async function ReviewReportApi(
  reportId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult | null> {
  try {
    const response = await Api.post<ReviewReportApiResponse>(
      `/api/admin/moderation/reports/${reportId}/review`,
      {},
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject({ code: statusCode, status, message: errorMessage });
  }
}

export async function DeleteReportApi(
  reportId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult | null> {
  try {
    const response = await Api.delete<DeleteReportApiResponse>(
      `/api/admin/moderation/reports/${reportId}/message`,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject({ code: statusCode, status, message: errorMessage });
  }
}