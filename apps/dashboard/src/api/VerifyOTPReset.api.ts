import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IVerifyOTPResetRequestData {
  token: string;
  otp: string;
}

interface IVerifyOTPResetResponseData {
  token: string;
}

interface VerifyOTPResetAPIResponse {
  status: string;
  message: string;
  token: string;
}

export default async function VerifyOTPResetApi(
  data: IVerifyOTPResetRequestData, 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IVerifyOTPResetResponseData> | null> {
  try {
    const response = await Api.post<VerifyOTPResetAPIResponse>('/api/auth/verify-otp-reset', data, {
      ...config,
    });
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: {
        token: response.data.token
      }
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