import { AxiosRequestConfig } from "axios";
import { z } from "zod";
import Api, { IAPIResult, handleApiRequest } from "./Api";

// Zod Schemas for Runtime Validation
export const AppointmentActionSchema = z
  .object({
    joinMeetingLink: z.string().optional(),
    agoraChannel: z.string().optional(),
    agoraToken: z
      .object({
        token: z.string(),
        expiresAt: z.string().optional(),
        uid: z.union([z.number(), z.string()]).optional(),
      })
      .optional(),
    invoiceDownloadLink: z.string().optional(),
  })
  .catch({});

export type AppointmentAction = z.infer<typeof AppointmentActionSchema>;

export const BookingStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed"]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export interface IUserAppointmentsParams {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface ICounselorAppointmentsParams {
  therapistId?: string;
  page?: number;
  limit?: number;
}

export const AppointmentSchema = z.object({
  bookingId: z.string(),
  fullName: z.string().default(""),
  profilePicture: z.string().default(""),
  date: z.string().default(""),
  time: z.string().default(""),
  type: z.string().default(""),
  chatId: z.string().nullable().default(null),
  status: z.enum(["upcoming", "passed", "confirmed"]).or(z.string()).default("upcoming"),
  bookingStatus: BookingStatusSchema.optional(),
  price: z.number().nullable().optional(),
  action: AppointmentActionSchema.default({}),
  therapistId: z.string().optional(),
  userId: z.string().optional(),
  isDemo: z.boolean().optional(),
  demoLabel: z.string().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const AppointmentsArraySchema = z.array(AppointmentSchema);

export const UserDashboardDataSchema = z.object({
  walletBalance: z.number().default(0),
  totalSessions: z.number().default(0),
  timeSpent: z.number().default(0),
  amountPaid: z.number().default(0),
  upcomingAppointments: z.array(AppointmentSchema).default([]),
});

export type UserDashboardData = z.infer<typeof UserDashboardDataSchema>;

export const UserAppointmentsResponseSchema = z.union([
  AppointmentsArraySchema,
  UserDashboardDataSchema,
]);
export type UserAppointmentsResponse = z.infer<typeof UserAppointmentsResponseSchema>;

export const UserProfileSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  profilePicture: z.string().optional(),
  phoneNumber: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  experience: z.string().optional(),
  about: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export const UserProfilesArraySchema = z.array(UserProfileSchema);

export interface DisputePayload {
  reason: string;
  description: string;
  attachments?: string[];
}

export const DisputeResponseSchema = z.object({
  disputeId: z.string(),
  bookingId: z.string(),
  reason: z.string(),
  description: z.string(),
  attachments: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export interface DisputeResponse {
  status: string;
  message: string;
  data: z.infer<typeof DisputeResponseSchema>;
}

interface AppointmentsAPIResponse {
  status: string;
  message: string;
  data: Appointment[];
}

interface UserDashboardAPIResponse {
  status: string;
  message: string;
  data: UserAppointmentsResponse;
}

interface UserProfileAPIResponse {
  status: string;
  message: string;
  data: UserProfile[];
}

// API Functions with Runtime Boundary Validation
export const getCounselorAppointments = (
  config?: AxiosRequestConfig
): Promise<IAPIResult<Appointment[]> | null> =>
  handleApiRequest<Appointment[]>(
    () => Api.get<AppointmentsAPIResponse>("/api/service-provider/appointments", config),
    undefined,
    AppointmentsArraySchema
  );

export const getCounselorAppointmentsByTherapistId = (
  therapistId?: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Appointment[]> | null> => {
  const endpoint = therapistId
    ? `/api/service-provider/appointments?therapistId=${therapistId}`
    : "/api/service-provider/appointments";
  return handleApiRequest<Appointment[]>(
    () => Api.get<AppointmentsAPIResponse>(endpoint, config),
    undefined,
    AppointmentsArraySchema
  );
};

export const getUserAppointments = (
  params?: IUserAppointmentsParams,
  config?: AxiosRequestConfig
): Promise<IAPIResult<UserAppointmentsResponse> | null> => {
  const searchParams = new URLSearchParams();
  if (params?.status) {
    searchParams.append("status", params.status);
  }
  if (params?.page !== undefined) {
    searchParams.append("page", String(params.page));
  }
  if (params?.limit !== undefined) {
    searchParams.append("limit", String(params.limit));
  }

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/api/user/appointments?${queryString}`
    : "/api/user/appointments";

  return handleApiRequest<UserAppointmentsResponse>(
    () => Api.get<UserDashboardAPIResponse>(endpoint, config),
    undefined,
    UserAppointmentsResponseSchema
  );
};

export const getUserProfile = (
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<UserProfile[]> | null> =>
  handleApiRequest<UserProfile[]>(
    () =>
      Api.get<UserProfileAPIResponse>(
        `/api/service-provider/appointments/${userId}/profile`,
        config
      ),
    undefined,
    UserProfilesArraySchema
  );

export const getAppointmentsWithUser = (
  userId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string[]> | null> =>
  handleApiRequest<string[]>(
    () =>
      Api.get<{ status: string; message: string; data: string[] }>(
        `/api/service-provider/appointments/${userId}`,
        config
      ),
    undefined,
    z.array(z.string())
  );

export async function downloadInvoice(
  bookingId: string,
  config?: AxiosRequestConfig
): Promise<void> {
  const response = await Api.get(`/api/invoice/${bookingId}/invoice/`, {
    ...config,
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
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
): Promise<IAPIResult<DisputeResponse["data"]> | null> =>
  handleApiRequest<DisputeResponse["data"]>(
    () =>
      Api.post<DisputeResponse>(`/api/user/disputes/${bookingId}`, disputeData, {
        ...config,
        headers: {
          "Content-Type": "application/json",
          ...config?.headers,
        },
      }),
    undefined,
    DisputeResponseSchema
  );
