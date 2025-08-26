import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IFundWalletRequest {
  amount: number;
  email: string; // Made required since we'll always pass it from auth store
  callback_url?: string;
}

export interface IFundWalletResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  data: IFundWalletResponse;
}

export default async function FundWalletApi(
  data: IFundWalletRequest, 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IFundWalletResponse> | null> {
  try {
    const response = await Api.post<APIResponse>('/api/user/wallet/fund', data, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.success ? "success" : "error",
      message: response.data.message ?? "Payment link created",
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