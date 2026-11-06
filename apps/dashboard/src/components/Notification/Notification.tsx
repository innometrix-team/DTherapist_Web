import { useState, useEffect, useRef, useMemo } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellIcon, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import {
  getNotificationDeepLink,
  getNotificationEffectiveType,
  isSelfNotification,
  formatNotificationTypeLabel,
  requestNotificationPermission,
} from "../../utils/notificationDeepLink.utils";

import {
  getUserNotificationsApi,
  markNotificationAsReadApi,
  type IUserNotification,
  formatNotificationDate,
  getNotificationTypeColor,
  getNotificationIcon,
} from "../../api/Notifications.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

interface UserNotificationsDropdownProps {
  className?: string;
}

const UserNotificationsDropdown: FC<UserNotificationsDropdownProps> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const currentUserId = useAuthStore((s) => s.id);
  const isCounselor = role === "counselor";
  const userType = isCounselor ? "counselor" : "user";
  const queryClient = useQueryClient();

  const [desktopPermission, setDesktopPermission] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  });

  const handleEnablePush = async () => {
    const perm = await requestNotificationPermission();
    setDesktopPermission(perm);
    if (perm === "granted") {
      toast.success("Desktop alerts enabled");
    }
  };

  // Fetch notifications
  const {
    data: notificationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.notifications.user(userType, currentUserId || ''),
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return getUserNotificationsApi(userType, { signal: controller.signal });
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    retry: 2,
    enabled: !!token,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsReadApi(notificationId),
    onSuccess: (_data, notificationId) => {
      // Update the query cache optimistically
      queryClient.setQueryData(
        ["user-notifications", userType, currentUserId],
        (oldData: unknown) => {
          const typedOldData = oldData as { data: IUserNotification[] } | undefined;
          if (!typedOldData?.data) return oldData;
          return {
            ...typedOldData,
            data: typedOldData.data.map((notif: IUserNotification) =>
              notif._id === notificationId ? { ...notif, seen: true } : notif
            ),
          };
        }
      );
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read");
      console.error("Mark as read error:", error);
    },
  });

  // Filter notifications for current user only and suppress self-notifications
  const notifications = useMemo(() => {
    const allNotifications = notificationsResponse?.data || [];
    
    return allNotifications.filter((notification: IUserNotification) => {
      // Filter by user ID only if both notification.userId and currentUserId exist
      if (notification.userId && currentUserId && notification.userId !== currentUserId) {
        return false;
      }
      // Direct replies alert the parent message author (no self-notifications)
      if (isSelfNotification(notification, currentUserId)) {
        return false;
      }
      return true;
    });
  }, [notificationsResponse?.data, currentUserId]);
  
  const unreadCount = useMemo(() => {
    return notifications.filter((n: IUserNotification) => !n.seen).length;
  }, [notifications]);

  // Handle notification click with deep linking to exact thread/view
  const handleNotificationClick = (notification: IUserNotification) => {
    if (!notification.seen) {
      markAsReadMutation.mutate(notification._id);
    }
    const deepLink = getNotificationDeepLink(notification);
    if (deepLink) {
      setIsOpen(false);
      void navigate(deepLink);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error("Failed to load notifications");
    }
  }, [error]);

  // Render bell icon whenever authenticated in layout
  if (!token) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {desktopPermission === "default" && (
              <button
                type="button"
                onClick={() => { void handleEnablePush(); }}
                className="text-xs text-primary font-medium hover:underline cursor-pointer"
                title="Enable browser desktop notifications"
              >
                Enable alerts
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 px-4">
                <p className="text-red-600 text-sm mb-2">Failed to load notifications</p>
                <button
                  onClick={() => {
                    void refetch();
                  }}
                  className="text-primary hover:text-blue-800 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.seen ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <span className="text-lg">
                          {getNotificationIcon(getNotificationEffectiveType(notification))}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.seen ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              !notification.seen ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs font-medium ${getNotificationTypeColor(getNotificationEffectiveType(notification))}`}>
                                {formatNotificationTypeLabel(notification)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500">
                                  {formatNotificationDate(notification.createdAt)}
                                </span>
                                {getNotificationDeepLink(notification) && (
                                  <ExternalLink className="w-3 h-3 text-primary opacity-70 group-hover:opacity-100" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
        </div>
      )}
    </div>
  );
};

export default UserNotificationsDropdown;