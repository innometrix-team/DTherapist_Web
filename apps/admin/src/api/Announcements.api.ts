import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";

export type AnnouncementChannel = "email" | "notification" | "both";
export type AnnouncementAudience = "all" | "client" | "therapist";
export type AnnouncementStatus = "draft" | "sending" | "sent" | "partial" | "failed";

export interface IAnnouncementDelivery {
  inAppPublished?: number;
  emailAccepted?: number;
  emailFailed?: number;
  pushEnabled?: boolean;
  pushAccepted?: number;
  pushFailed?: number;
}

export interface IAnnouncement {
  _id: string;
  title: string;
  message: string;
  channel: AnnouncementChannel;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  delivery?: IAnnouncementDelivery;
  createdAt?: string;
  updatedAt?: string;
  sentAt?: string;
}

export interface IAnnouncementPayload {
  title: string;
  message: string;
  channel: AnnouncementChannel;
  audience: AnnouncementAudience;
}

export interface IAnnouncementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IAnnouncementsListResult {
  announcements: IAnnouncement[];
  pagination: IAnnouncementPagination;
}

interface AnnouncementsEnvelope<T> {
  status: string;
  message?: string;
  data: T;
  pagination?: IAnnouncementPagination;
}

function toApiError(error: unknown, fallbackMessage: string): ApiError {
  const axiosErr = error as AxiosError<{ status?: string; message?: string }>;
  const statusCode = axiosErr.response?.status || 0;
  const message =
    axiosErr.response?.data?.message ||
    (error instanceof Error ? error.message : fallbackMessage) ||
    fallbackMessage;
  const status = axiosErr.response?.data?.status || "error";
  return new ApiError(message, statusCode, status);
}

export async function getAnnouncementsApi(
  params: { page?: number; limit?: number } = {},
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAnnouncementsListResult> | null> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  try {
    const response = await Api.get<AnnouncementsEnvelope<IAnnouncement[]>>(
      `/api/admin/announcements?page=${page}&limit=${limit}`,
      config
    );
    const announcements = Array.isArray(response.data.data)
      ? response.data.data
      : [];
    const pagination: IAnnouncementPagination = response.data.pagination ?? {
      page,
      limit,
      total: announcements.length,
      totalPages: 1,
    };
    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "Announcements loaded",
      data: { announcements, pagination },
    };
  } catch (e) {
    if (axios.isCancel(e)) return null;
    return Promise.reject(toApiError(e, "Failed to load announcements"));
  }
}

export async function getAnnouncementByIdApi(
  id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAnnouncement> | null> {
  try {
    const response = await Api.get<AnnouncementsEnvelope<IAnnouncement>>(
      `/api/admin/announcements/${encodeURIComponent(id)}`,
      config
    );
    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "Announcement loaded",
      data: response.data.data,
    };
  } catch (e) {
    if (axios.isCancel(e)) return null;
    return Promise.reject(toApiError(e, "Failed to load announcement"));
  }
}

export async function createAnnouncementApi(
  payload: IAnnouncementPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAnnouncement> | null> {
  try {
    const response = await Api.post<AnnouncementsEnvelope<IAnnouncement>>(
      "/api/admin/announcements",
      payload,
      config
    );
    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "Draft created",
      data: response.data.data,
    };
  } catch (e) {
    if (axios.isCancel(e)) return null;
    return Promise.reject(toApiError(e, "Failed to create draft"));
  }
}

export async function updateAnnouncementApi(
  id: string,
  payload: Partial<IAnnouncementPayload>,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAnnouncement> | null> {
  try {
    const response = await Api.patch<AnnouncementsEnvelope<IAnnouncement>>(
      `/api/admin/announcements/${encodeURIComponent(id)}`,
      payload,
      config
    );
    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "Draft updated",
      data: response.data.data,
    };
  } catch (e) {
    if (axios.isCancel(e)) return null;
    return Promise.reject(toApiError(e, "Failed to update draft"));
  }
}

export async function deleteAnnouncementApi(
  id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<{ deleted?: boolean }> | null> {
  try {
    const response = await Api.delete<AnnouncementsEnvelope<{ deleted?: boolean }>>(
      `/api/admin/announcements/${encodeURIComponent(id)}`,
      config
    );
    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "Draft deleted",
      data: response.data.data ?? { deleted: true },
    };
  } catch (e) {
    if (axios.isCancel(e)) return null;
    return Promise.reject(toApiError(e, "Failed to delete draft"));
  }
}

export async function sendAnnouncementApi(
  id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAnnouncement> | null> {
  try {
    const response = await Api.post<AnnouncementsEnvelope<IAnnouncement>>(
      `/api/admin/announcements/${encodeURIComponent(id)}/send`,
      {},
      config
    );
    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "Announcement send triggered",
      data: response.data.data,
    };
  } catch (e) {
    if (axios.isCancel(e)) return null;
    return Promise.reject(toApiError(e, "Failed to send announcement"));
  }
}
