import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IResetPasswordRequestData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface IResetPasswordResponseData {
  message: string;
}

interface ResetPasswordAPIResponse {
  status: string;
  message: string;
  data: IResetPasswordResponseData;
}

export default async function ResetPasswordApi(
  data: IResetPasswordRequestData, 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IResetPasswordResponseData> | null> {
  try {
    const response = await Api.post<ResetPasswordAPIResponse>('/api/auth/reset-password', data, {
      ...config,
    });
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