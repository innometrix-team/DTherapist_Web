import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IForgotPasswordRequestData {
  email: string;
}

interface IForgotPasswordResponseData {
  message: string;
  token: string;
}

interface ForgotPasswordAPIResponse {
  status: string;
  message: string;
  data: {
    token: string;
  };
}

export default async function ForgotPasswordApi(
  data: IForgotPasswordRequestData, 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IForgotPasswordResponseData> | null> {
  try {
    const response = await Api.post<ForgotPasswordAPIResponse>('/api/auth/forgot-password', data, {
      ...config,
    });
    
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: {
        message: response.data.message,
        token: response.data.data.token  // ✅ Fixed: Get token from data.token
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