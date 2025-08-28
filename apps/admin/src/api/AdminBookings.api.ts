import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IAdminBooking {
  _id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  sessionType: "video" | "audio" | "chat";
  date: string;
  time: string;
  tab: "upcoming" | "past" | "cancelled";
  client: {
    name: string;
    profilePicture: string;
  };
  therapist: {
    name: string;
    profilePicture: string;
  };
}

export interface IAdminBookingHistoryData {
  bookings: IAdminBooking[];
  total: number;
  page: number;
  limit: number;
}

interface APIResponse {
  status: string;
  message: string;
  data: IAdminBooking[];
}

interface APIErrorResponse {
  code: number;
  status: string;
  message: string;
  data: undefined;
}

export interface IAdminBookingQueryParams {
  page?: number;
  limit?: number;
  status?: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  sessionType?: "video" | "audio" | "chat";
  tab?: "upcoming" | "past" | "cancelled";
  search?: string; // For searching client/therapist names
  startDate?: string;
  endDate?: string;
}

// Get Admin Bookings History
export async function getAdminBookingsApi(
  params?: IAdminBookingQueryParams,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAdminBookingHistoryData> | null> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sessionType) queryParams.append('sessionType', params.sessionType);
    if (params?.tab) queryParams.append('tab', params.tab);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/api/admin/bookings${queryString ? `?${queryString}` : ''}`;

    const response = await Api.get<APIResponse>(url, {
      ...config,
    });
    
    // TEMPORARY CLIENT-SIDE PAGINATION FIX
    // (Remove this once your backend implements proper pagination)
    let filteredBookings = response.data.data;
    
    // Filter out null/undefined bookings and ensure required properties exist
    filteredBookings = filteredBookings.filter(booking => 
      booking && 
      booking._id && 
      booking.client && 
      booking.therapist &&
      booking.status &&
      booking.sessionType
    );
    
    // Apply client-side filtering
    if (params?.status) {
      filteredBookings = filteredBookings.filter(b => b && b.status === params.status);
    }
    
    if (params?.sessionType) {
      filteredBookings = filteredBookings.filter(b => b && b.sessionType === params.sessionType);
    }

    if (params?.tab) {
      filteredBookings = filteredBookings.filter(b => b && b.tab === params.tab);
    }
    
    if (params?.search) {
      filteredBookings = filteredBookings.filter(b => 
        b && 
        b.client && 
        b.therapist &&
        (
          (b.client.name && b.client.name.toLowerCase().includes(params.search!.toLowerCase())) ||
          (b.therapist.name && b.therapist.name.toLowerCase().includes(params.search!.toLowerCase()))
        )
      );
    }
    
    // Apply client-side pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
    
    // Transform the response to match our expected structure
    const transformedData: IAdminBookingHistoryData = {
      bookings: paginatedBookings,
      total: filteredBookings.length, // Total after filtering
      page: page,
      limit: limit,
    };
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message,
      data: transformedData
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch admin bookings";
    const status = error.response?.data?.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Helper function to format date (matching the "Mon, Jun 23, 2025" format)
export function formatAdminBookingDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}

// Helper function to get status badge color
export function getAdminBookingStatusColor(status: IAdminBooking['status']): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'rescheduled':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get status display text
export function getAdminBookingStatusText(status: IAdminBooking['status']): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'rescheduled':
      return 'Rescheduled';
    default:
      return status;
  }
}

// Helper function to get session type color
export function getAdminSessionTypeColor(sessionType: IAdminBooking['sessionType']): string {
  switch (sessionType) {
    case 'video':
      return 'text-blue-600';
    case 'audio':
      return 'text-green-600';
    case 'chat':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}

// Helper function to get session type display text
export function getAdminSessionTypeText(sessionType: IAdminBooking['sessionType']): string {
  switch (sessionType) {
    case 'video':
      return 'Video Call';
    case 'audio':
      return 'Audio Call';
    case 'chat':
      return 'Chat';
    default:
      return sessionType;
  }
}

// Helper function to get tab color
export function getAdminTabColor(tab: IAdminBooking['tab']): string {
  switch (tab) {
    case 'upcoming':
      return 'text-blue-600';
    case 'past':
      return 'text-gray-600';
    case 'cancelled':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}