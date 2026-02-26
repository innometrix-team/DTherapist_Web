import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FlagClientPayload {
  clientId: string;
  bookingId: string;
  note: string;
}

export interface FlagClientData {
  [key: string]: unknown;
}

export interface FlagClientResponse {
  message: string;
  flag: FlagClientData;
}

// ─── API Call ───────────────────────────────────────────────────────────────

export async function flagClient(
  payload: FlagClientPayload,
  config?: AxiosRequestConfig,
): Promise<IAPIResult<FlagClientResponse> | null> {
  try {
    const response = await Api.post<FlagClientResponse>(
      "/api/service-provider/flagged/flag-client",
      payload,
      config,
    );

    return {
      code: response.status,
      status: "success",
      message: response.data.message ?? "Feedback submitted successfully",
      data: response.data,
    };
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message ||
      "Failed to submit feedback";
    const status =
      (e as AxiosError<IAPIResult>).response?.data?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}