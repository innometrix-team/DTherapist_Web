import { ITherapist } from "../api/Therapist.api";
import { SessionType } from "../components/CounselorList/types";

export interface FormatNairaOptions {
  showDecimals?: boolean;
  suffix?: string;
}

/**
 * Formats a numeric Naira amount with thousand separators (e.g. 15000 -> "₦15,000").
 */
export function formatNaira(
  amount: number | null | undefined,
  options?: FormatNairaOptions
): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "₦0";
  }

  const num = Number(amount);
  const hasDecimals = num % 1 !== 0;
  const useDecimals = options?.showDecimals ?? hasDecimals;

  const formatted = num.toLocaleString("en-NG", {
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  });

  return `₦${formatted}${options?.suffix ?? ""}`;
}

/**
 * Extracts the numeric rate for a specific session type ("video" | "physical" | "group").
 */
export function getCostForSessionType(
  cost: ITherapist["cost"] | undefined,
  sessionType: SessionType
): number {
  if (cost === null || cost === undefined) return 0;
  if (typeof cost === "number") return cost > 0 ? cost : 0;

  if (typeof cost === "object") {
    if (sessionType === "physical") return cost.inPerson > 0 ? cost.inPerson : 0;
    if (sessionType === "group") {
      return cost.groupVideo && cost.groupVideo > 0 ? cost.groupVideo : 0;
    }
    return cost.video > 0 ? cost.video : 0;
  }

  return 0;
}

/**
 * Formats a single session type's price (e.g. "₦15,000") or null if not set.
 */
export function formatSessionTypeRate(
  cost: ITherapist["cost"] | undefined,
  sessionType: SessionType,
  suffix = ""
): string | null {
  const amount = getCostForSessionType(cost, sessionType);
  if (amount <= 0) return null;
  return formatNaira(amount, { suffix });
}

/**
 * Formats a professional's overall cost for directory listings:
 * - Single price or identical prices: "₦15,000/hr"
 * - Multiple different prices: "₦15,000 – ₦25,000/hr"
 * - No price configured: fallback (default "--")
 */
export function formatTherapistCostSummary(
  cost: ITherapist["cost"] | undefined,
  fallback = "--"
): string {
  if (cost === null || cost === undefined) return fallback;

  if (typeof cost === "number") {
    return cost > 0 ? formatNaira(cost, { suffix: "/hr" }) : fallback;
  }

  const rates = [cost.video, cost.inPerson, cost.groupVideo].filter(
    (v): v is number => typeof v === "number" && v > 0
  );

  if (rates.length === 0) return fallback;

  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  if (minRate === maxRate) {
    return formatNaira(minRate, { suffix: "/hr" });
  }

  return `${formatNaira(minRate)} – ${formatNaira(maxRate)}/hr`;
}

