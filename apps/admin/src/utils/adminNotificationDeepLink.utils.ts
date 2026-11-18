import type { IAdminNotification } from "../api/AdminNotifications.api";

/**
 * Resolves the destination route for an admin notification based on its payload data.
 *
 * Supported Action Alerts & Types (Item 9):
 * - verified registrations / registration -> /user/:userId
 * - file uploads / credentials -> /user/:userId?tab=credentials
 * - disputes -> /disputes/:disputeId or /disputes
 * - profession requests -> /user/:userId (or /user?professionalCategoryRequestStatus=pending)
 * - therapist commission / fee split -> /user/:userId?tab=commission
 * - bookings -> /bookings
 * - transactions / payouts -> /transaction
 * - moderation / flags / danonymous -> /danonymous
 * - feedback -> /feedback
 */
export function getAdminNotificationDeepLink(
  notification: IAdminNotification
): string | null {
  const data = notification.data || {};
  const rawType = (data.type || notification.type || "").toLowerCase().trim();

  // If a direct URL is passed in payload
  if (typeof data.url === "string" && data.url.startsWith("/")) {
    return data.url;
  }

  const userId =
    (typeof data.userId === "string" && data.userId.trim()) ||
    (typeof data.therapistId === "string" && data.therapistId.trim()) ||
    undefined;

  const disputeId =
    (typeof data.disputeId === "string" && data.disputeId.trim()) ||
    (typeof data.bookingId === "string" &&
      rawType.includes("dispute") &&
      data.bookingId.trim()) ||
    undefined;

  switch (rawType) {
    // 1. Verified Registrations / User Registration
    case "verified_registration":
    case "registration":
    case "user_registered":
    case "user_verification":
      return userId ? `/user/${userId}` : "/user";

    // 2. File Uploads / Credentials
    case "file_upload":
    case "credential_upload":
    case "therapist_verification":
    case "credentials":
      return userId ? `/user/${userId}?tab=credentials` : "/user";

    // 3. Disputes
    case "dispute":
    case "dispute_created":
    case "dispute_updated":
    case "dispute_resolved":
      return disputeId ? `/disputes/${disputeId}` : "/disputes";

    // 4. Profession Requests
    case "profession_request":
    case "professional_category_request":
    case "profession_change":
      return userId
        ? `/user/${userId}`
        : "/user?professionalCategoryRequestStatus=pending";

    // 5. Therapist Commission / Split
    case "commission":
    case "fee_split":
    case "commission_update":
      return userId ? `/user/${userId}?tab=commission` : "/user";

    // 6. Bookings
    case "booking":
    case "booking_created":
    case "appointment":
      return "/bookings";

    // 7. Transactions
    case "transaction":
    case "payout":
    case "withdrawal":
    case "payment":
      return "/transaction";

    // 8. Moderation / DAnonymous
    case "danonymous":
    case "post_flagged":
    case "flagged_post":
    case "moderation":
      return "/danonymous";

    // 9. Feedback
    case "feedback":
      return "/feedback";

    // Fallback: If userId is present, route to user detail
    default:
      if (userId) {
        return `/user/${userId}`;
      }
      return null;
  }
}

