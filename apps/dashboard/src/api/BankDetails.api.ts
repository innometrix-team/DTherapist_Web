import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Define Role type (ensure this matches your existing type definitions)
type Role = "client" | "therapist" | "user" | "counselor";

export interface IBankDetailsData {
  bankName: string;
  bankAccount: string;
  accountName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface IBankDetailsResponseData {
  user?: User;
  message: string;
  bankDetails?: IBankDetailsData;
}

interface APIResponse {
  status: string;
  message: string;
  data?: IBankDetailsResponseData;
}

interface APIErrorResponse {
  code: number;
  status: string;
  message: string;
  data: undefined;
}

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaystackBankResponse {
  status: boolean;
  message: string;
  data: PaystackBank[];
}

// Get Banks from Paystack
export async function getBanksApi(
  config?: AxiosRequestConfig
): Promise<string[]> {
  try {
    const response = await axios.get<PaystackBankResponse>(
      "https://api.paystack.co/bank", 
      config
    );
    
    if (response.data.status && response.data.data) {
      // Filter active banks, extract names, and sort alphabetically
      return response.data.data
        .filter(bank => bank.active && !bank.is_deleted)
        .map(bank => bank.name)
        .sort();
    }
    
    return [];
  } catch (e) {
    console.error("Failed to fetch banks:", e);
    throw new Error("Failed to fetch banks. Please try again.");
  }
}

// Save Bank Details for Therapist
export async function saveTherapistBankDetailsApi(
  data: IBankDetailsData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IBankDetailsResponseData> | null> {
  try {
    const response = await Api.put<APIResponse>("/api/profile/bank-details", data, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Bank details saved successfully",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data.message || error.message || "An error occurred";
    const status = error.response?.data.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Save Bank Details for Client
export async function saveClientBankDetailsApi(
  data: IBankDetailsData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IBankDetailsResponseData> | null> {
  try {
    const response = await Api.put<APIResponse>("/api/user/bank-details", data, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Bank details saved successfully",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data.message || error.message || "An error occurred";
    const status = error.response?.data.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Generic function that routes to appropriate endpoint based on role
export async function saveBankDetailsApi(
  data: IBankDetailsData,
  role: Role,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IBankDetailsResponseData> | null> {
  const isTherapist = role === "therapist" || role === "counselor";
  
  if (isTherapist) {
    return saveTherapistBankDetailsApi(data, config);
  } else {
    return saveClientBankDetailsApi(data, config);
  }
}