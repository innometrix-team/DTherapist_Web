import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest } from "./Api";

// Types for API responses
export interface AppointmentAction {
  joinMeetingLink?: string;
  agoraChannel?: string;
  agoraToken?: {
    token: string;
    expiresAt: string;
    uid: number;
  };
  invoiceDownloadLink?: string;
}

export interface Appointment {
  bookingId: string;
  fullName: string;
  profilePicture: string;
  date: string;
  time: string;
  type: string;
  chatId: string | null;
  status: "upcoming" | "passed" | "confirmed";
  action: AppointmentAction;
  therapistId?: string;
  userId?: string;
}

export interface UserDashboardData {
  walletBalance: number;
  totalSessions: number;
  timeSpent: number;
  amountPaid: number;
  upcomingAppointments: Appointment[];
}

export interface UserProfile {
  _id?: string;
  id?: string;
  userId?: string;
  title?: string;
  message?: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  phoneNumber?: string;
  nationality?: string;
  occupation?: string;
  experience?: string;
  about?: string;
}

export interface DisputePayload {
  reason: string;
  description: string;
  attachments?: string[];
}

export interface DisputeResponse {
  status: string;
  message: string;
  data: {
    disputeId: string;
    bookingId: string;
    reason: string;
    description: string;
    attachments: string[];
    createdAt: string;
  };
}

interface AppointmentsAPIResponse {
  status: string;
  message: string;
  data: Appointment[];
}

interface UserDashboardAPIResponse {
  status: string;
  message: string;
  data: UserDashboardData;
}

interface UserProfileAPIResponse {
  status: string;
  message: string;
  data: UserProfile[];
}

// API Functions

export const getCounselorAppointments = (
  config?: AxiosRequestConfig
): Promise<IAPIResult<Appointment[]> | null> =>
  handleApiRequest<Appointment[]>(() =>
    Api.get<AppointmentsAPIResponse>('/api/service-provider/appointments', config)
  );

export const getCounselorAppointmentsByTherapistId = (
  therapistId?: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Appointment[]> | null> => {
  const endpoint = therapistId
    ? `/api/service-provider/appointments?therapistId=${therapistId}`
    : '/api/service-provider/appointments';
  return handleApiRequest<Appointment[]>(() =>
    Api.get<AppointmentsAPIResponse>(endpoint, config)
  );
};

export const getUserAppointments = (
  config?: AxiosRequestConfig
): Promise<IAPIResult<UserDashboardData> | null> =>
  handleApiRequest<UserDashboardData>(() =>
    Api.get<UserDashboardAPIResponse>('/api/user/appointments', config)
  );

export const getUserProfile = (
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<UserProfile[]> | null> =>
  handleApiRequest<UserProfile[]>(() =>
    Api.get<UserProfileAPIResponse>(`/api/service-provider/appointments/${userId}/profile`, config)
  );

export const getAppointmentsWithUser = (
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string[]> | null> =>
  handleApiRequest<string[]>(() =>
    Api.get<{ status: string; message: string; data: string[] }>(
      `/api/service-provider/appointments/${userId}`,
      config
    )
  );

export async function downloadInvoice(
  bookingId: string,
  config?: AxiosRequestConfig
): Promise<void> {
  const response = await Api.get(`/api/invoice/${bookingId}/invoice/`, {
    ...config,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `invoice-${bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export const submitDispute = (
  bookingId: string,
  disputeData: DisputePayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<DisputeResponse['data']> | null> =>
  handleApiRequest<DisputeResponse['data']>(() =>
    Api.post<DisputeResponse>(`/api/user/disputes/${bookingId}`, disputeData, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    })
  );