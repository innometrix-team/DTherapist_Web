import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IAdminNotification {
  _id: string;
  type: string;
  audience: "admin" | "user";
  seenBy: string[];
  title: string;
  message: string;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface APIResponse {
  status: string;
  message: string;
  data: IAdminNotification[];
}

interface APIMarkReadResponse {
  status: string;
  message: string;
  data: null;
}

interface APIErrorResponse {
  code: number;
  status: string;
  message: string;
  data: undefined;
}

// Get Admin Notifications
export async function getAdminNotificationsApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAdminNotification[]> | null> {
  try {
    const response = await Api.get<APIResponse>("/api/admin/notifications", {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message,
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch admin notifications";
    const status = error.response?.data?.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Mark Notification as Read
export async function markNotificationAsReadApi(
  notificationId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<null> | null> {
  try {
    const response = await Api.patch<APIMarkReadResponse>(
      `/api/notifications/${notificationId}/read`,
      {},
      {
        ...config,
      }
    );
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message,
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data?.message || error.message || "Failed to mark notification as read";
    const status = error.response?.data?.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Helper function to format notification date
export function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

// Helper function to get notification type color
export function getNotificationTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'transaction':
      return 'text-blue-600';
    case 'user':
      return 'text-green-600';
    case 'system':
      return 'text-purple-600';
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

// Helper function to get notification icon based on type
export function getNotificationIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'transaction':
      return '💰';
    case 'user':
      return '👤';
    case 'system':
      return '⚙️';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return '📢';
  }
}