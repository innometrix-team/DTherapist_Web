import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/auth/useAuthStore";
import socketService from "../services/SocketService";
import {
  type IUserNotification,
  getNotificationIcon,
} from "../api/Notifications.api";
import {
  extractNotificationData,
  getNotificationDeepLink,
  getNotificationEffectiveType,
  isSelfNotification,
  showPushNotification,
} from "../utils/notificationDeepLink.utils";
import { QUERY_KEYS } from "../configs/queryKeys.config";

/**
 * Listens for real-time notifications via Socket.IO, manages native push & in-app toast alerts,
 * suppresses self-notifications (e.g. parent author is self on direct reply),
 * and triggers TanStack Query cache invalidation for both notification badges and active group messages.
 */
export function useNotificationListener(): void {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const currentUserId = useAuthStore((s) => s.id);

  const userType = role === "counselor" ? "counselor" : "user";
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const userTypeRef = useRef(userType);
  userTypeRef.current = userType;

  useEffect(() => {
    if (!token) return;

    // Connect to socket service if not connected
    void socketService.connect(token).catch((err: unknown) => {
      console.warn("Socket notification connection deferred:", err);
    });

    const unsubscribe = socketService.onNotification(
      (notification: IUserNotification) => {
        const myId = currentUserIdRef.current;
        const myType = userTypeRef.current;

        // 1. Direct replies alert the parent message author (no self-notifications)
        if (isSelfNotification(notification, myId)) {
          return;
        }

        // If target userId is specified and differs from current user, suppress
        if (notification.userId && myId && notification.userId !== myId) {
          return;
        }

        // 2. Refresh notification query cache so dropdown badge updates immediately
        if (myId) {
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.notifications.user(myType, myId),
          });
        }

        const notifData = extractNotificationData(notification);

        // 3. If this notification corresponds to a forum/community reply, refresh group messages
        const groupId = notifData.groupId;
        if (groupId) {
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.groups.messages(groupId),
          });
        }

        const deepLink = getNotificationDeepLink(notification);

        // 4. Trigger native browser push notification (if permission is granted)
        showPushNotification(
          notification.title || "New notification",
          {
            body: notification.message,
            tag: notification._id || notifData.messageId,
          },
          () => {
            if (deepLink) {
              void navigate(deepLink);
            }
          }
        );

        // 5. In-app interactive toast notification with direct deep link
        const icon = getNotificationIcon(
          getNotificationEffectiveType(notification)
        );

        toast(
          (t) =>
            React.createElement(
              "div",
              {
                onClick: () => {
                  toast.dismiss(t.id);
                  if (deepLink) {
                    void navigate(deepLink);
                  }
                },
                className:
                  "flex items-start gap-2.5 cursor-pointer max-w-sm text-left select-none",
              },
              React.createElement(
                "span",
                { className: "text-xl shrink-0 mt-0.5" },
                icon
              ),
              React.createElement(
                "div",
                { className: "flex-1 min-w-0" },
                React.createElement(
                  "p",
                  { className: "text-xs font-semibold text-darkerb truncate" },
                  notification.title
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-neutral line-clamp-2 mt-0.5" },
                  notification.message
                ),
                deepLink
                  ? React.createElement(
                      "span",
                      {
                        className:
                          "inline-block text-[11px] font-semibold text-primary hover:underline mt-1",
                      },
                      "View thread →"
                    )
                  : null
              )
            ),
          {
            id: notification._id || undefined,
            duration: 5000,
            position: "top-right",
          }
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [token, queryClient, navigate]);
}
