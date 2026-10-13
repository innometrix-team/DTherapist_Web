import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest } from "./Api";

export interface IUserNotification {
  _id: string;
  userId: string;
  type: string;
  audience: "client" | "therapist | all";
  seenBy: string[];
  title: string;
  message: string;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Get User/Counselor Notifications
export const getUserNotificationsApi = (
  userType: "user" | "counselor",
  config?: AxiosRequestConfig
): Promise<IAPIResult<IUserNotification[]> | null> => {
  const endpoint =
    userType === "counselor"
      ? "/api/service-provider/notifications"
      : "/api/user/notifications";
  return handleApiRequest<IUserNotification[]>(() => Api.get(endpoint, config));
};

// Mark notification as read
export const markNotificationAsReadApi = (
  notificationId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IUserNotification> | null> =>
  handleApiRequest<IUserNotification>(() =>
    Api.patch(`/api/notifications/${notificationId}`, {}, config)
  );

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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

// Helper function to get notification type color
export function getNotificationTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'booking':
      return 'text-blue-600';
    case 'session':
      return 'text-green-600';
    case 'payment':
      return 'text-purple-600';
    case 'other':
      return 'text-orange-600';
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
    case 'booking':
      return '📅';
    case 'session':
      return '🎯';
    case 'payment':
      return '💳';
    case 'other':
      return '📢';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return '🔔';
  }
}