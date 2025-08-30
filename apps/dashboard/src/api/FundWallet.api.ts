import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Fund Wallet Interfaces
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

interface FundWalletAPIResponse {
  success: boolean;
  message: string;
  data: IFundWalletResponse;
}

// Banks Interfaces
export interface IBank {
  name: string;
  code: string;
}

export interface IBanksResponse {
  success: boolean;
  banks: IBank[];
}

// Withdraw Interfaces
export interface IWithdrawRequest {
  amount: number;
  accountNumber: string;
  bankCode: string;
}

export interface IWithdrawResponse {
  success: boolean;
  message: string;
  data?: {
    reference?: string;
    status?: string;
    [key: string]: unknown;
  };
}

// Fund Wallet API
export default async function FundWalletApi(
  data: IFundWalletRequest, 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IFundWalletResponse> | null> {
  try {
    const response = await Api.post<FundWalletAPIResponse>('/api/user/wallet/fund', data, {
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

// Banks API
export async function getBanksApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IBank[]> | null> {
  try {
    const response = await Api.get<IBanksResponse>('/api/paystack/banks', {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.success ? "success" : "error",
      message: response.data.success ? "Banks fetched successfully" : "Failed to fetch banks",
      data: response.data.banks || []
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

// Withdraw API
export async function withdrawFundsApi(
  data: IWithdrawRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IWithdrawResponse['data']> | null> {
  try {
    const response = await Api.post<IWithdrawResponse>('/api/paystack/withdraw', data, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.success ? "success" : "error",
      message: response.data.message ?? "Withdrawal request submitted",
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