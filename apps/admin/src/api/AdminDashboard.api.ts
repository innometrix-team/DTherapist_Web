import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IAdminDashboardData {
  withdrawableBalance: number;
  activeUsers: number;
  activeTherapists: number;
  deposits: number;
  withdrawals: number;
  trends: {
    deposits: number[];
    withdrawals: number[];
  };
}

// Admin API response interface
interface AdminAPIResponse {
  withdrawableBalance: number;
  activeUsers: number;
  activeTherapists: number;
  deposits: number;
  withdrawals: number;
  trends: {
    deposits: number[];
    withdrawals: number[];
  };
}

interface APIResponse {
  status: string;
  message: string;
  data: AdminAPIResponse;
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
      deposits: response.data.data.deposits,
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
    
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}