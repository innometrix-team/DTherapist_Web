import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import toast from "react-hot-toast";

import {
  getUserNotificationsApi,
  IUserNotification,
  formatNotificationDate,
  getNotificationTypeColor,
  getNotificationIcon,
} from "../../api/Notifications.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

interface UserNotificationsDropdownProps {
  className?: string;
}

const UserNotificationsDropdown: React.FC<UserNotificationsDropdownProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { role, id } = useAuthStore();
  const currentUserId = id;
  const isUser = role === "user";
  const isCounselor = role === "counselor";
  const userType = isCounselor ? "counselor" : "user";

  // Fetch notifications
  const {
    data: notificationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-notifications", userType, currentUserId],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return getUserNotificationsApi(userType, { signal: controller.signal });
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    retry: 2,
    enabled: (isUser || isCounselor) && !!currentUserId,
  });

  // Filter notifications for current user only
  const notifications = useMemo(() => {
    const allNotifications = notificationsResponse?.data || [];
    
    // Filter notifications by current user ID
    return allNotifications.filter((notification: IUserNotification) => 
      notification.userId === currentUserId
    );
  }, [notificationsResponse?.data, currentUserId]);
  
  const unreadCount = useMemo(() => {
    return notifications.filter((n: IUserNotification) => !n.seen).length;
  }, [notifications]);

 
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

  // Don't render if not user or counselor or no user ID
  if ((!isUser && !isCounselor) || !currentUserId) {
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
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
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
                  onClick={() => refetch()}
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
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.seen ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
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
                              <span className={`text-xs font-medium capitalize ${getNotificationTypeColor(notification.type)}`}>
                                {notification.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatNotificationDate(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length > 10 && (
                  <div className="p-4 text-center border-t border-gray-200">
                    <span className="text-sm text-gray-500">
                      Showing 10 of {notifications.length} notifications
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // You can add navigation to a full notifications page here
                }}
                className="w-full text-center text-sm text-primary hover:text-blue-800 font-medium"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserNotificationsDropdown;