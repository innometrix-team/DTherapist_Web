import { Role } from "../../store/auth/types";

export interface BalanceConfig {
  amount: string;
  actions: Array<"topUp" | "withdraw">;
}

export interface PromoConfig {
  title: string;
  subtitle: string;
  ctaLabel: string;
}

export interface StatCardConfig {
  label: string;
  value: string;
  trend: string;
}

export interface DashboardConfig {
  balance: BalanceConfig;
  promo: PromoConfig;
  stats: StatCardConfig[];
}

export const DUMMY_DASHBOARD_CONFIG: Record<Role, DashboardConfig> = {
  user: {
    balance: { amount: "₦00,000", actions: ["topUp", "withdraw"] },
    promo: {
      title: "Trust the Healing Process",
      subtitle: " Your mental health matters. Here’s how we can help you.",
      ctaLabel: "Get Therapy",
    },
    stats: [
      { label: "Total Sessions", value: "20", trend: "30% This Month" },
      { label: "Time Spent",    value: "150 hrs", trend: "30% This Month" },
      { label: "Amount Paid",   value: "₦120,000", trend: "30% This Month" },
        { label: "Amount Received",   value: "₦120,000", trend: "30% This Month" }
    ],
  },

  counselor: {
    balance: { amount: "₦30,000", actions: ["withdraw"] },
    promo: {
      title: "Your Next Session Awaits",
      subtitle: "Quick stats on your appointments…",
      ctaLabel: "View Schedule",
    },
    stats: [
      { label: "Sessions Held", value: "18", trend: "20% This Month" },
      { label: "Hours Billed",  value: "140 hrs", trend: "25% This Month" },
      { label: "Earnings",      value: "₦115,000", trend: "15% This Month" },
    ],
  },
};