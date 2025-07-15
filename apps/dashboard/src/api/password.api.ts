import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";
import { STORE_KEYS } from "../configs/store.config";
import { AuthState } from "../store/auth/types";

export interface IPasswordChangeData {
  newPassword: string;
  confirmPassword: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "therapist" | "user" | "counselor"
}

interface IPasswordResponseData {
  user: User;
  message: string;
  token: string;
}

interface APIResponse {
  status: string;
  message: string;
  data?: IPasswordResponseData;
}

// Helper function to safely get auth from localStorage
function getAuthFromStorage(): AuthState | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORE_KEYS.AUTH);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch (error) {
    console.error('Error reading auth from localStorage:', error);
    return null;
  }
}

export default async function PasswordChangeApi(
  data: IPasswordChangeData, 
  config?: AxiosRequestConfig,
  userRole?: string
): Promise<IAPIResult<IPasswordResponseData> | null> {
  try {
    // Get user role from parameter or localStorage
    let role = userRole;
    if (!role) {
      const auth = getAuthFromStorage();
      role = auth?.role || 'client';
    }
    
    
    
    // Determine endpoint based on user role
    // Handle all possible role variations
    const isTherapist = role === "therapist" || role === "counselor";
    const isUser = role === "user" || role === "client";
    
    let endpoint: string;
    if (isTherapist) {
      endpoint = "/api/profile/password"; // therapist/counselor endpoint
    } else if (isUser) {
      endpoint = "/api/user/password"; // user/client endpoint
    } else {
      // Fallback - default to user endpoint if role is unclear
      
      endpoint = "/api/user/password";
    }
    
    console.log('Selected endpoint:', endpoint);
    console.log('Request data:', data);
    
    const response = await Api.patch<APIResponse>(endpoint, data, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Password updated successfully",
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