import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IRequestData {
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin"
}

interface IResponseData {
  user: User;
  token: string;
}

interface APIResponse {
  status: string;
  message: string;
  data: IResponseData;
}


export default async function LoginApi(data: IRequestData, config?: AxiosRequestConfig): Promise<IAPIResult<IResponseData> | null> {
  try {
    const response = await Api.post<APIResponse>('/api/auth/login', data, {
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