import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, ApiResponseEnvelope, handleApiRequest } from "./Api";

export interface IUpcomingAppointment {
  _id: string;
  fullname: string;
  profilePicture: string;
  date: string;
  time: string;
  type: string;
  joinLink?: string;
  chatId?: string | null;
  agoraChannel?: string | null;
  agoraToken?: {
    token: string;
    uid: number;
  } | null;
  invoiceDownloadLink?: string | null;
}

export interface IDashboardData {
  balance: number;
  totalSessions: number;
  timeSpent: number;
  amountEarned: number;
  upcomingAppointments: IUpcomingAppointment[];
}

export interface RawDashboardAppointment {
  bookingId: string;
  fullName: string;
  profilePicture: string | null;
  date: string;
  time: string;
  type: string;
  status: string;
  chatId: string | null;
  invoiceDownloadLink?: string | null;
  action?: {
    agoraChannel: string | null;
    agoraToken: {
      token: string;
      uid: number;
    } | null;
    invoiceDownloadLink: string | null;
  } | null;
}

export interface UserAPIResponse {
  walletBalance: number;
  totalSessions: number;
  timeSpent: number;
  amountPaid: number;
  upcomingAppointments: Array<RawDashboardAppointment & { therapistId: string }>;
}

export interface CounselorAPIResponse {
  balance: number;
  totalSessions: number;
  timeSpent: number;
  amountEarned: number;
  professionalBodies?: Array<{
    bodyName: string;
    certificationName: string;
  }>;
  upcomingAppointments: Array<RawDashboardAppointment & { userId: string }>;
}

function mapDashboardAppointment(appointment: RawDashboardAppointment): IUpcomingAppointment {
  return {
    _id: appointment.bookingId,
    fullname: appointment.fullName,
    profilePicture: appointment.profilePicture ?? "",
    date: appointment.date,
    time: appointment.time,
    type: appointment.type,
    chatId: appointment.chatId,
    agoraChannel: appointment.action?.agoraChannel ?? null,
    agoraToken: appointment.action?.agoraToken ?? null,
    invoiceDownloadLink:
      appointment.action?.invoiceDownloadLink ?? appointment.invoiceDownloadLink ?? null,
  };
}

function transformUserDashboard(data: UserAPIResponse): IDashboardData {
  return {
    balance: data.walletBalance,
    totalSessions: data.totalSessions,
    timeSpent: data.timeSpent,
    amountEarned: data.amountPaid,
    upcomingAppointments: (data.upcomingAppointments || []).map(mapDashboardAppointment),
  };
}

function transformCounselorDashboard(data: CounselorAPIResponse): IDashboardData {
  return {
    balance: data.balance,
    totalSessions: data.totalSessions,
    timeSpent: data.timeSpent,
    amountEarned: data.amountEarned,
    upcomingAppointments: (data.upcomingAppointments || []).map(mapDashboardAppointment),
  };
}

export default async function DashboardApi(
  userType: "user" | "service-provider",
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDashboardData> | null> {
  if (userType === "user") {
    return handleApiRequest<UserAPIResponse, IDashboardData>(
      () => Api.get<ApiResponseEnvelope<UserAPIResponse>>("/api/user/dashboard", config),
      transformUserDashboard
    );
  }

  return handleApiRequest<CounselorAPIResponse, IDashboardData>(
    () =>
      Api.get<ApiResponseEnvelope<CounselorAPIResponse>>(
        "/api/service-provider/dashboard",
        config
      ),
    transformCounselorDashboard
  );
}