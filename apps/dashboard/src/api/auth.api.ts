import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest } from "./Api";
import { STORE_KEYS } from "../configs/store.config";
import { AuthState } from "../store/auth/types";
import { StoreResult } from "../store/types";

// ========================
// Types & Interfaces
// ========================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "therapist" | "user" | "counselor";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: AuthUser;
  token: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: "client" | "therapist";
  phoneNumber?: string;
}

export interface RegisterResponseData {
  token: string;
  otp: string;
  id: string;
}

export interface VerifyOtpPayload {
  token: string;
  otp: string;
}

export interface VerifyOtpResponseData {
  token: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponseData {
  message: string;
  token: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponseData {
  message: string;
}

export interface PasswordChangePayload {
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeResponseData {
  user: AuthUser;
  message: string;
  token: string;
}

export interface DeleteAccountResponse {
  message: string;
  code: string;
  status: boolean;
}

function getStoredRole(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem(STORE_KEYS.AUTH);
      if (raw) {
        const auth = JSON.parse(raw) as StoreResult<AuthState>;
        return auth?.state?.role || "client";
      }
    }
    return "client";
  } catch {
    return "client";
  }
}

// ========================
// API Service Methods
// ========================

export const login = (
  data: LoginPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<LoginResponseData> | null> =>
  handleApiRequest<LoginResponseData>(() =>
    Api.post("/api/auth/login", data, config)
  );

export const register = (
  data: RegisterPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<RegisterResponseData> | null> =>
  handleApiRequest<RegisterResponseData>(() =>
    Api.post("/api/auth/register", data, config)
  );

export const verifyOtp = (
  data: VerifyOtpPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<VerifyOtpResponseData> | null> =>
  handleApiRequest<VerifyOtpResponseData>(() =>
    Api.post("/api/auth/verify-otp", data, config)
  );

interface VerifyOtpResetApiResponse {
  status?: string;
  message?: string;
  token?: string;
  data?: { token?: string };
}

interface ForgotPasswordApiResponse {
  status?: string;
  message?: string;
  token?: string;
  data?: { token?: string };
}

export const verifyOtpReset = (
  data: VerifyOtpPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<VerifyOtpResponseData> | null> =>
  handleApiRequest<VerifyOtpResetApiResponse, VerifyOtpResponseData>(
    () => Api.post<VerifyOtpResetApiResponse>("/api/auth/verify-otp-reset", data, config),
    (res) => ({ token: res.token || res.data?.token || "" })
  );

export const resendOtp = (
  data: ResendOtpPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<{ token: string }> | null> =>
  handleApiRequest<{ token: string }>(() =>
    Api.post("/api/auth/resend-otp", data, config)
  );

export const forgotPassword = (
  data: ForgotPasswordPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ForgotPasswordResponseData> | null> =>
  handleApiRequest<ForgotPasswordApiResponse, ForgotPasswordResponseData>(
    () => Api.post<ForgotPasswordApiResponse>("/api/auth/forgot-password", data, config),
    (res) => ({
      message: res.message || "Success",
      token: res.data?.token || res.token || "",
    })
  );

export const resetPassword = (
  data: ResetPasswordPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ResetPasswordResponseData> | null> =>
  handleApiRequest<ResetPasswordResponseData>(() =>
    Api.post("/api/auth/reset-password", data, config)
  );

export const changePassword = (
  data: PasswordChangePayload,
  config?: AxiosRequestConfig,
  userRole?: string
): Promise<IAPIResult<PasswordChangeResponseData> | null> => {
  const role = userRole || getStoredRole();
  const isTherapist = role === "therapist" || role === "counselor";
  const endpoint = isTherapist ? "/api/profile/password" : "/api/user/password";

  return handleApiRequest<PasswordChangeResponseData>(() =>
    Api.patch(endpoint, data, config)
  );
};

export async function deleteAccount(
  config?: AxiosRequestConfig
): Promise<DeleteAccountResponse | null> {
  try {
    const response = await Api.delete<DeleteAccountResponse>("/api/delete", config);
    return response.data;
  } catch (error) {
    console.error("Error deleting account:", error);
    return null;
  }
}
