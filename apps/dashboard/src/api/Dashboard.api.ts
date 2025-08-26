import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IUpcomingAppointment {
  _id: string;
  fullname: string;
  profilePicture: string;
  date: string;
  time: string;
  type: string;
  joinLink?: string;
}

export interface IDashboardData {
  balance: number;
  totalSessions: number;
  timeSpent: number;
  amountEarned: number;
  upcomingAppointments: IUpcomingAppointment[];
}

// User API response interface
interface UserAPIResponse {
  walletBalance: number;
  totalSessions: number;
  timeSpent: number;
  amountPaid: number;
  upcomingAppointments: Array<{
    id: string;
    fullName: string;
    profilePicture: string;
    date: string;
    time: string;
    type: string;
    status: string;
    chatId: string | null;
    action: {
      joinMeetingLink: string;
      invoiceDownloadLink: string | null;
    };
  }>;
}

// Counselor API response interface
interface CounselorAPIResponse {
  balance: number;
  totalSessions: number;
  timeSpent: number;
  amountEarned: number;
  upcomingAppointments: Array<{
    _id: string;
    name: string;
    profilePicture: string;
    date: string;
    time: string;
    type: string;
    joinLink: string;
  }>;
}

interface APIResponse<T = UserAPIResponse | CounselorAPIResponse> {
  status: string;
  message: string;
  data: T;
}

export default async function DashboardApi(
  userType: "user" | "service-provider", 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDashboardData> | null> {
  try {
    const endpoint = userType === "user" 
      ? '/api/user/dashboard' 
      : '/api/service-provider/dashboard';
    
    const response = await Api.get<APIResponse>(endpoint, {
      ...config,
    });
    
    let transformedData: IDashboardData;

    if (userType === "user") {
      // Handle user response format
      const userData = response.data.data as UserAPIResponse;
      transformedData = {
        balance: userData.walletBalance,
        totalSessions: userData.totalSessions,
        timeSpent: userData.timeSpent,
        amountEarned: userData.amountPaid,
        upcomingAppointments: userData.upcomingAppointments.map(appointment => ({
          _id: appointment.id,
          fullname: appointment.fullName,
          profilePicture: appointment.profilePicture,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          joinLink: appointment.action.joinMeetingLink,
        }))
      };
    } else {
      // Handle counselor/service-provider response format
      const counselorData = response.data.data as CounselorAPIResponse;
      transformedData = {
        balance: counselorData.balance,
        totalSessions: counselorData.totalSessions,
        timeSpent: counselorData.timeSpent,
        amountEarned: counselorData.amountEarned,
        upcomingAppointments: counselorData.upcomingAppointments.map(appointment => ({
          _id: appointment._id,
          fullname: appointment.name, // Note: counselor API uses 'name' instead of 'fullName'
          profilePicture: appointment.profilePicture,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          joinLink: appointment.joinLink,
        }))
      };
    }
    
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