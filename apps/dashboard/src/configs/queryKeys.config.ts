export const QUERY_KEYS = {
  auth: {
    register: 'register',
    user: ['auth', 'user'] as const,
  },
  profile: {
    current: (userType: string) => ['profile', userType] as const,
    userProfile: (typeOrId: string) => ['user-profile', typeOrId] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    userList: ['appointments', 'user'] as const,
    counselorList: ['appointments', 'counselor'] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
    withUser: (userId: string) => ['appointments', 'user', userId] as const,
    history: (clientId: string) => ['appointment-history', clientId] as const,
  },
  therapists: {
    all: ['therapists'] as const,
    list: (selectedCategory?: string, searchQuery?: string, currentPage?: number) =>
      ['therapists', selectedCategory, searchQuery, currentPage] as const,
    categories: ['categories'] as const,
    detail: (id: string) => ['therapist', id] as const,
    schedule: (therapistId: string, sessionType: string) =>
      ['therapist-schedule', therapistId, sessionType] as const,
    schedules: (therapistId: string) => ['therapistSchedules', therapistId] as const,
    details: (therapistId: string) => ['therapistDetails', therapistId] as const,
    reviews: (therapistId: string) => ['reviews', therapistId] as const,
  },
  chat: {
    history: (chatId: string) => ['chat-history', chatId] as const,
  },
  groups: {
    list: "groups/list",
    messages: (groupId: string) => ["groups", groupId, "messages"] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    user: (userType: string, userId: string) =>
      ['user-notifications', userType, userId] as const,
  },
  wallet: {
    balance: ['wallet', 'balance'] as const,
    transactions: (filters?: unknown) => ['transactions', filters] as const,
    banks: ['banks'] as const,
  },
  library: {
    categories: ['categories'] as const,
    articles: (category?: string) => ['articles', category] as const,
    article: (id: string) => ['article', id] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
} as const;