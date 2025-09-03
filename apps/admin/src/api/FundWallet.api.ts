import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Fund Wallet Interfaces
export interface IFundWalletRequest {
  amount: number;
  email: string;
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
    let errorMessage = (e as AxiosError<IAPIResult>).response?.data.message || (e as Error).message;
    
    // Enhanced error message for funding issues
    if (statusCode === 400) {
      errorMessage = "Invalid payment details. Please check your information and try again.";
    } else if (statusCode === 401) {
      errorMessage = "Authentication failed. Please login again.";
    } else if (statusCode >= 500) {
      errorMessage = "Payment service is temporarily unavailable. Please try again later.";
    }
    
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
    let errorMessage = (e as AxiosError<IAPIResult>).response?.data.message || (e as Error).message;
    
    // Enhanced error message for banks fetching
    if (statusCode >= 500) {
      errorMessage = "Unable to load banks list. Please try again later.";
    } else if (statusCode === 401) {
      errorMessage = "Authentication failed. Please login again.";
    }
    
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Admin Withdraw API
export async function adminWithdrawFundsApi(
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
      message: response.data.message ?? "Admin withdrawal request submitted",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    let errorMessage = (e as AxiosError<IAPIResult>).response?.data.message || (e as Error).message;
    
    // Enhanced error messages for admin withdrawal issues
    if (statusCode === 400) {
      const errorData = (e as AxiosError<{ data?: { error?: string }; error?: string }>).response?.data;
      const originalError = errorData?.data?.error || errorData?.error || "";
      
      if (originalError.includes("400") || 
          errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("account") ||
          errorMessage.toLowerCase().includes("bank")) {
        errorMessage = "Invalid account number or bank details. Please verify your account information and try again.";
      } else {
        errorMessage = "Invalid withdrawal request. Please check your details.";
      }
    } else if (statusCode === 401) {
      errorMessage = "Authentication failed. Please login again.";
    } else if (statusCode === 403) {
      errorMessage = "Admin permission required for this withdrawal operation.";
    } else if (statusCode === 422) {
      errorMessage = "Invalid withdrawal details. Please check your account number and selected bank.";
    } else if (statusCode >= 500) {
      errorMessage = "Withdrawal service is temporarily unavailable. Please try again later.";
    }
    
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}