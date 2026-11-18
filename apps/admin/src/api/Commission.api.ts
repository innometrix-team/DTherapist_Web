import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";

export interface ICommissionData {
  therapistPercentage: number;
  adminPercentage: number;
  updatedAt?: string;
  effectiveFrom?: string;
  userId?: string;
}

interface CommissionApiResponse {
  status: string;
  message?: string;
  data: ICommissionData;
}

export const DEFAULT_COMMISSION: ICommissionData = {
  therapistPercentage: 65,
  adminPercentage: 35,
};

/**
 * Fetch fee split commission for a therapist.
 * GET /api/admin/users/{id}/commission
 */
export async function getTherapistCommissionApi(
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICommissionData> | null> {
  try {
    const response = await Api.get<CommissionApiResponse>(
      `/api/admin/users/${userId}/commission`,
      config
    );

    const data: ICommissionData = response.data?.data || DEFAULT_COMMISSION;

    return {
      code: response.status,
      status: response.data?.status || "success",
      message: response.data?.message || "Commission retrieved",
      data,
    };
  } catch (e) {
    if (axios.isCancel(e)) {
      return null;
    }

    const axiosError = e as AxiosError<IAPIResult>;
    // If backend returns 404 for a user without custom commission, return default 65/35
    if (axiosError.response?.status === 404) {
      return {
        code: 200,
        status: "success",
        message: "Default commission applied",
        data: DEFAULT_COMMISSION,
      };
    }

    const statusCode = axiosError.response?.status || 0;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Failed to fetch commission split";
    const status = axiosError.response?.data?.status || "error";

    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

export interface IUpdateCommissionPayload {
  therapistPercentage: number;
  adminPercentage: number;
}

/**
 * Update fee split commission for a therapist.
 * PATCH /api/admin/users/{id}/commission
 * Payload must sum to 100.
 */
export async function updateTherapistCommissionApi(
  userId: string,
  payload: IUpdateCommissionPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICommissionData> | null> {
  if (payload.therapistPercentage + payload.adminPercentage !== 100) {
    return Promise.reject(
      new ApiError("Therapist and admin percentages must sum to 100", 400, "error")
    );
  }

  try {
    const response = await Api.patch<CommissionApiResponse>(
      `/api/admin/users/${userId}/commission`,
      payload,
      config
    );

    return {
      code: response.status,
      status: response.data?.status || "success",
      message: response.data?.message || "Commission updated successfully",
      data: response.data?.data || payload,
    };
  } catch (e) {
    if (axios.isCancel(e)) {
      return null;
    }

    const axiosError = e as AxiosError<IAPIResult>;
    const statusCode = axiosError.response?.status || 0;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Failed to update commission split";
    const status = axiosError.response?.data?.status || "error";

    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

