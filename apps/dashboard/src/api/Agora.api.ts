import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";


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
  return raw.data ?? (raw as AgoraTokenAPIData);
}

export async function fetchAgoraRtcToken(
  sessionName: string,
  uid?: number,
  config?: AxiosRequestConfig
): Promise<IAPIResult<AgoraRtcTokenResult> | null> {
  try {
    const response = await Api.get<AgoraTokenAPIResponse>(
      "/api/agora/refresh-token",
      {
        ...config,
        params: {
          sessionName,
          uid,
          type: "rtc",   
          ...config?.params,
        },
      }
    );

    const d = extractTokenData(response.data);

    if (!d?.rtcToken) {
      return Promise.reject({
        code: response.status,
        status: "error",
        message: "rtcToken missing from Agora response",
        data: undefined,
      });
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
    return Promise.reject({ code: statusCode, status, message: errorMessage, data: undefined });
  }
}


export async function fetchAgoraRtmToken(
  sessionName: string,
  uid: string | number,
  config?: AxiosRequestConfig
): Promise<IAPIResult<AgoraRtmTokenResult> | null> {
  // Convert string uid → number for the backend, guard against NaN.
  const numericUid = typeof uid === "number" ? uid : parseInt(uid, 10);
  if (isNaN(numericUid) || numericUid === 0) {
    return Promise.reject({
      code: 0,
      status: "error",
      message: `fetchAgoraRtmToken: uid "${uid}" is not a valid non-zero integer.`,
      data: undefined,
    });
  }

  try {
    const response = await Api.get<AgoraTokenAPIResponse>(
      "/api/agora/refresh/rtm-token",
      {
        ...config,
        params: {
          sessionName,
          uid: numericUid,
          ...config?.params,
        },
      }
    );

    const d = extractTokenData(response.data);

    if (!d?.rtmToken) {
      return Promise.reject({
        code: response.status,
        status: "error",
        message: "rtmToken missing from Agora response",
        data: undefined,
      });
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
    return Promise.reject({ code: statusCode, status, message: errorMessage, data: undefined });
  }
}