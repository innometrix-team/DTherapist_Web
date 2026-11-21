import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";

export interface IAdminDashboardData {
  withdrawableBalance: number;
  activeUsers: number;
  activeTherapists: number;
  totalCommission: number; // Changed from deposits
  withdrawals: number;
  trends: {
    commissions: number[]; // Changed from deposits
    withdrawals: number[];
  };
}

// Admin API response interface
interface AdminAPIResponse {
  withdrawableBalance: number;
  activeUsers: number;
  activeTherapists: number;
  totalCommission: number; // Changed from deposits
  withdrawals: number;
  trends: {
    commissions: number[]; // Changed from deposits
    withdrawals: number[];
  };
}

interface APIResponse {
  status: string;
  message: string;
  data: AdminAPIResponse;
}

export interface IAdminOverviewMonthlyItem {
  month: number;
  clientSignups: number;
  therapistSignups: number;
  appointments: number;
  completedAppointments: number;
}

export interface IAdminOverviewData {
  year: number;
  timezone: string;
  clients: {
    total: number;
    active: number;
  };
  therapists: {
    total: number;
    active: number;
    bookable: number;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  monthly: IAdminOverviewMonthlyItem[];
}

interface OverviewAPIResponse {
  status: string;
  message: string;
  data: IAdminOverviewData;
}

export async function getAdminOverviewApi(
  year?: number,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAdminOverviewData> | null> {
  try {
    const query = year ? `?year=${year}` : "";
    const response = await Api.get<OverviewAPIResponse>(
      `/api/admin/dashboard/overview${query}`,
      config
    );
    return {
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data,
    };
  } catch (e) {
    if (axios.isCancel(e)) {
      return null;
    }
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data?.status || "error";
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

export default async function AdminDashboardApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAdminDashboardData> | null> {
  try {
    const endpoint = '/api/admin/dashboard';
    
    const response = await Api.get<APIResponse>(endpoint, {
      ...config,
    });
    
    // Transform data (in this case, the structure already matches)
    const transformedData: IAdminDashboardData = {
      withdrawableBalance: response.data.data.withdrawableBalance,
      activeUsers: response.data.data.activeUsers,
      activeTherapists: response.data.data.activeTherapists,
      totalCommission: response.data.data.totalCommission, // Changed from deposits
      withdrawals: response.data.data.withdrawals,
      trends: response.data.data.trends,
    };
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: transformedData
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
    
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}