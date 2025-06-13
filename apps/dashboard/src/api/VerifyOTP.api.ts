import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IRequestData {
  token: string;
  otp: string;
}

interface IResponseData {
  token: string;
}

interface APIResponse {
  status: string;
  message: string;
  data: IResponseData;
}


export default async function VerifyOtpApi(data: IRequestData, config?: AxiosRequestConfig): Promise<IAPIResult<IResponseData> | null> {
  try {
    const response = await Api.post<APIResponse>('/api/auth/verify-otp', data, {
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
    const status =  (e as AxiosError<IAPIResult>).response?.data.status || "error"
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}