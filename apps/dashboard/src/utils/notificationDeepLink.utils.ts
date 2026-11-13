export interface INotificationData {
  type?: string;
  groupId?: string;
  messageId?: string;
  replyTo?: string;
  parentAuthorId?: string;
  authorId?: string;
  senderId?: string;
  bookingId?: string;
  appointmentId?: string;
  disputeId?: string;
  clientId?: string;
  chatId?: string;
  userId?: string;
  url?: string;
}

export interface IUserNotification {
  _id: string;
  userId: string;
  type: string;
  audience: "client" | "therapist" | "all" | "therapist | all";
  seenBy?: string[];
  title: string;
  message: string;
  seen: boolean;
  data?: INotificationData;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

/**
 * Safely extracts the notification `data` payload from any notification object
 * without relying on cross-file type cache resolution.
 */
export function extractNotificationData(
  notification: unknown
): INotificationData {
  if (!notification || typeof notification !== "object") {
    return {};
  }
  const rawRecord = notification as Record<string, unknown>;
  const rawData = rawRecord.data;
  if (!rawData || typeof rawData !== "object") {
    return {};
  }
  const d = rawData as Record<string, unknown>;
  return {
    type: typeof d.type === "string" ? d.type : undefined,
    groupId: typeof d.groupId === "string" ? d.groupId : undefined,
    messageId: typeof d.messageId === "string" ? d.messageId : undefined,
    replyTo: typeof d.replyTo === "string" ? d.replyTo : undefined,
    parentAuthorId:
      typeof d.parentAuthorId === "string" ? d.parentAuthorId : undefined,
    authorId: typeof d.authorId === "string" ? d.authorId : undefined,
    senderId: typeof d.senderId === "string" ? d.senderId : undefined,
    bookingId: typeof d.bookingId === "string" ? d.bookingId : undefined,
    appointmentId:
      typeof d.appointmentId === "string" ? d.appointmentId : undefined,
    disputeId: typeof d.disputeId === "string" ? d.disputeId : undefined,
    clientId: typeof d.clientId === "string" ? d.clientId : undefined,
    chatId: typeof d.chatId === "string" ? d.chatId : undefined,
    userId: typeof d.userId === "string" ? d.userId : undefined,
    url: typeof d.url === "string" ? d.url : undefined,
  };
}

/**
 * Returns the effective notification type string (preferring `data.type` over `notification.type`).
 */
export function getNotificationEffectiveType(notification: unknown): string {
  if (!notification || typeof notification !== "object") {
    return "";
  }
  const data = extractNotificationData(notification);
  if (data.type && data.type.trim().length > 0) {
    return data.type.trim();
  }
  const rawRecord = notification as Record<string, unknown>;
  return typeof rawRecord.type === "string" ? rawRecord.type.trim() : "";
}

/**
 * Maps a notification's data and type to its corresponding in-app route.
 * Supports:
 * - Forum / DAnonymous replies (using data.groupId, data.messageId, data.replyTo)
 * - Disputes (bookingId / disputeId)
 * - Bookings / Appointments / Sessions
 * - Profile updates / Profession change requests
 * - Direct chat
 */
export function getNotificationDeepLink(
  notification: unknown
): string | null {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const data = extractNotificationData(notification);
  const rawType: string = getNotificationEffectiveType(notification).toLowerCase();

  // 1. Forum / DAnonymous / Community Replies (Item 3)
  const isForumType: boolean =
    rawType.includes("forum") ||
    rawType.includes("community") ||
    rawType.includes("danonymous") ||
    rawType.includes("reply") ||
    rawType === "group_message";

  const groupId =
    typeof data.groupId === "string" && data.groupId.trim().length > 0
      ? data.groupId.trim()
      : undefined;

  if (groupId || isForumType) {
    if (groupId) {
      const params = new URLSearchParams();
      if (typeof data.messageId === "string" && data.messageId.trim().length > 0) {
        params.set("messageId", data.messageId.trim());
      }
      if (typeof data.replyTo === "string" && data.replyTo.trim().length > 0) {
        params.set("replyTo", data.replyTo.trim());
      }
      const qs = params.toString();
      return `/anonymous/${groupId}${qs ? `?${qs}` : ""}`;
    }
    return "/anonymous";
  }

  // 2. Disputes (Item 9)
  if (rawType.includes("dispute")) {
    const bookingId =
      typeof data.bookingId === "string" && data.bookingId.trim().length > 0
        ? data.bookingId.trim()
        : typeof data.disputeId === "string" && data.disputeId.trim().length > 0
        ? data.disputeId.trim()
        : typeof data.appointmentId === "string" && data.appointmentId.trim().length > 0
        ? data.appointmentId.trim()
        : undefined;

    if (bookingId) {
      return `/dispute/${bookingId}`;
    }
    return "/appointments";
  }

  // 3. Bookings / Appointments / Sessions / Invitations (Item 9)
  if (
    rawType.includes("booking") ||
    rawType.includes("session") ||
    rawType.includes("appointment") ||
    rawType.includes("invitation") ||
    rawType.includes("reminder")
  ) {
    if (typeof data.clientId === "string" && data.clientId.trim().length > 0) {
      return `/appointments/client-details/${data.clientId.trim()}`;
    }

    const bId =
      typeof data.bookingId === "string" && data.bookingId.trim().length > 0
        ? data.bookingId.trim()
        : typeof data.appointmentId === "string" && data.appointmentId.trim().length > 0
        ? data.appointmentId.trim()
        : undefined;

    if (bId) {
      return `/appointments?bookingId=${bId}`;
    }
    return "/appointments";
  }

  // 4. Profile updates / Credentials / Compliance / Profession change (Item 9)
  if (
    rawType.includes("profile") ||
    rawType.includes("profession") ||
    rawType.includes("credential") ||
    rawType.includes("compliance") ||
    rawType.includes("certificate") ||
    rawType.includes("cv")
  ) {
    if (
      rawType.includes("credential") ||
      rawType.includes("compliance") ||
      rawType.includes("certificate") ||
      rawType.includes("cv")
    ) {
      return "/settings?tab=credentials";
    }
    return "/settings?tab=profile";
  }

  // 5. Wallet / Withdrawal / Payment
  if (
    rawType.includes("wallet") ||
    rawType.includes("withdrawal") ||
    rawType.includes("payment") ||
    rawType.includes("fund") ||
    rawType.includes("payout")
  ) {
    return "/";
  }

  // 6. Direct Chat
  if (rawType.includes("chat")) {
    if (typeof data.chatId === "string" && data.chatId.trim().length > 0) {
      return `/chat/${data.chatId.trim()}`;
    }
    return "/appointments";
  }

  // 7. Generic URL fallback
  if (typeof data.url === "string" && data.url.startsWith("/")) {
    return data.url;
  }

  return null;
}

/**
 * Checks if a notification is a self-notification that should be suppressed.
 * Direct replies alert the parent message author, but users should never receive notifications
 * for their own actions.
 */
export function isSelfNotification(
  notification: unknown,
  currentUserId?: string | null
): boolean {
  if (!currentUserId || !notification || typeof notification !== "object") {
    return false;
  }

  const data = extractNotificationData(notification);

  if (data.authorId && data.authorId === currentUserId) {
    return true;
  }
  if (data.senderId && data.senderId === currentUserId) {
    return true;
  }

  return false;
}

/**
 * Formats a notification type into a human-readable title/badge.
 */
export function formatNotificationTypeLabel(
  typeOrNotification: unknown
): string {
  const rawType: string =
    typeof typeOrNotification === "string"
      ? typeOrNotification
      : getNotificationEffectiveType(typeOrNotification);

  const t: string = rawType.toLowerCase().trim();

  if (t.includes("forum") || t.includes("reply") || t.includes("community")) {
    return "Forum Reply";
  }
  if (t.includes("dispute")) {
    return "Dispute";
  }
  if (
    t.includes("credential") ||
    t.includes("compliance") ||
    t.includes("certificate") ||
    t.includes("cv")
  ) {
    return "Credentials";
  }
  if (t.includes("profile") || t.includes("profession")) {
    return "Profile Update";
  }
  if (t.includes("booking") || t.includes("appointment") || t.includes("invitation")) {
    return "Booking";
  }
  if (t.includes("session") || t.includes("reminder")) {
    return "Session";
  }
  if (
    t.includes("payment") ||
    t.includes("wallet") ||
    t.includes("withdrawal") ||
    t.includes("fund") ||
    t.includes("payout")
  ) {
    return "Payment";
  }
  return rawType.length > 0 ? rawType.replace(/_/g, " ") : "Notification";
}

/**
 * Requests browser push notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * Displays a system/browser native push notification if permission is granted.
 */
export function showPushNotification(
  title: string,
  options?: NotificationOptions,
  onClick?: () => void
): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  if (Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: "/d-logo.png",
      badge: "/d-logo.png",
      ...options,
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      notification.close();
      if (onClick) {
        onClick();
      }
    };
  } catch (err) {
    console.warn("Could not display push notification:", err);
  }
}
