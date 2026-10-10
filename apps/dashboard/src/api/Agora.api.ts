import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";

export interface AgoraTokenAPIData {
  uid: number;
  rtcToken: string;
  rtmToken: string;
  sessionName: string;
  expiresAt: number;
  role: string;
}

export interface AgoraRtcTokenResult {
  uid: number;
  token: string;    
  sessionName: string;
  expiresAt: number;
}

export interface AgoraRtmTokenResult {
  uid: number;
  token: string;      
  sessionName: string;
  expiresAt: number;
}

type AgoraTokenAPIResponse = AgoraTokenAPIData & {
  status?: string;
  message?: string;
  data?: AgoraTokenAPIData;
};

function extractTokenData(raw: AgoraTokenAPIResponse): AgoraTokenAPIData {
  return raw.data ?? raw;
}

export async function fetchAgoraRtcToken(
  sessionName: string,
  uid?: number,
  config?: AxiosRequestConfig
): Promise<IAPIResult<AgoraRtcTokenResult> | null> {
  try {
    const extraParams = config?.params as Record<string, unknown> | undefined;
    const response = await Api.get<AgoraTokenAPIResponse>(
      "/api/agora/refresh-token",
      {
        ...config,
        params: {
          sessionName,
          uid,
          type: "rtc",   
          ...extraParams,
        },
      }
    );

    const d = extractTokenData(response.data);

    if (!d?.rtcToken) {
      return Promise.reject(
        new ApiError("rtcToken missing from Agora response", response.status, "error")
      );
    }

    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "success",
      data: {
        uid: d.uid,
        token: d.rtcToken,
        sessionName: d.sessionName,
        expiresAt: d.expiresAt,
      },
    };
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message || (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

export async function fetchAgoraRtmToken(
  sessionName: string,
  uid: string | number,
  config?: AxiosRequestConfig
): Promise<IAPIResult<AgoraRtmTokenResult> | null> {
  const numericUid = typeof uid === "number" ? uid : parseInt(uid, 10);
  if (isNaN(numericUid) || numericUid === 0) {
    return Promise.reject(
      new ApiError(`fetchAgoraRtmToken: uid "${uid}" is not a valid non-zero integer.`, 0, "error")
    );
  }

  try {
    const extraParams = config?.params as Record<string, unknown> | undefined;
    const response = await Api.get<AgoraTokenAPIResponse>(
      "/api/agora/refresh/rtm-token",
      {
        ...config,
        params: {
          sessionName,
          uid: numericUid,
          ...extraParams,
        },
      }
    );

    const d = extractTokenData(response.data);

    if (!d?.rtmToken) {
      return Promise.reject(
        new ApiError("rtmToken missing from Agora response", response.status, "error")
      );
    }

    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "success",
      data: {
        uid: d.uid,
        token: d.rtmToken,
        sessionName: d.sessionName,
        expiresAt: d.expiresAt,
      },
    };
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message || (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}