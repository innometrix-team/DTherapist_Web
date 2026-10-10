export const QUERY_KEYS = {
  auth: {
    register: 'register',
  },
  groups: {
    list: "groups/list",
    messages: (groupId: string) => ["groups", groupId, "messages"] as const,
    danonymous: ["danonymous-groups"] as const,
  },
  bookings: {
    adminList: (filters?: Record<string, unknown>) => ["admin-bookings", filters] as const,
  },
  users: {
    list: ["admin-users"] as const,
    profile: (userId?: string) => ["user-profile", userId] as const,
    credentials: (userId?: string) => ["user-credentials", userId] as const,
  },
  transactions: {
    list: (filters?: Record<string, unknown>) => ["admin-transactions", filters] as const,
  },
  notifications: {
    all: ["admin-notifications"] as const,
  },
  moderation: {
    reports: ["admin-moderation-reports"] as const,
  },
  feedback: {
    flags: ["admin-flags"] as const,
  },
  disputes: {
    list: ["disputes"] as const,
    detail: (disputeId?: string) => ["dispute", disputeId] as const,
  },
  dashboard: {
    stats: ["admin-dashboard-stats"] as const,
    chart: ["admin-dashboard-chart"] as const,
    userDashboard: (userType: string) => ["dashboard", userType] as const,
    adminDashboard: ["admin-dashboard"] as const,
    banks: ["banks"] as const,
  },
  articles: {
    list: ["articles"] as const,
    categories: ["categories"] as const,
    detail: (id?: string) => ["article", id] as const,
  },
} as const;