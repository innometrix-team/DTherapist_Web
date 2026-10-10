# API Layer Guide & Refactoring Rules (`src/api/`)

This guide directs AI agents and developers on refactoring, structuring, and consuming APIs within [`apps/dashboard/src/api/`](./).

---

## 1. Directory Overview & Current Pain Points

The current API layer contains 31 separate `.api.ts` files with significant code duplication:
- **Repetitive Error Handling:** Nearly every API function repeats 30+ lines of identical `try/catch` boilerplate, manual `axios.isCancel()` checks, and Axios error extraction.
- **Duplicate Files:** Several endpoints have split or overlapping files (e.g. `Appointment.api.ts` vs `Appointments.api.ts`, `VerifyOTP.api.ts` vs `VerifyOTPReset.api.ts`).
- **Inline Types:** Domain entities and DTOs are scattered across individual `.api.ts` files rather than shared in `src/types/`.
- **Ad-hoc Query Keys:** Many components define inline query keys (`['appointments']`) rather than using `configs/queryKeys.config.ts`.

---

## 2. Refactoring Directives

### A. Centralize Error & Cancel Handling in `Api.ts`
Individual API functions must **not** repeat Axios error parsing and cancel checks.
The centralized Axios instance in [`Api.ts`](./Api.ts) should handle error normalization via response interceptors:

```ts
// Recommended Pattern: Clean, concise, typed API service function
export const getAppointments = (params?: AppointmentFilterParams) =>
  Api.get<AppointmentsResponse>('/api/appointments', { params }).then(res => res.data);
```

### B. Consolidate Duplicate & Split Endpoints
When refactoring, merge related endpoints into coherent domain modules:
1. **Appointments:** Merge `Appointment.api.ts` and `Appointments.api.ts` into a single `appointments.api.ts`.
2. **Auth & OTP:** Merge `Login.api.ts`, `Register.api.ts`, `VerifyOTP.api.ts`, `VerifyOTPReset.api.ts`, `ResendOTP.api.ts`, `ForgotPassword.api.ts`, and `ResetPassword.api.ts` into a unified `auth.api.ts`.
3. **Profile:** Merge `Profile.api.ts` and `ProfileUpdate.api.ts` into `profile.api.ts`.
4. **Therapist:** Merge `Therapist.api.ts` and `TherapistSchedule.api.ts` into `therapist.api.ts`.

### C. Standardize TanStack Query Keys
Never use raw string literals inside `useQuery` or `useMutation`.
Register all query key factories in [`configs/queryKeys.config.ts`](../configs/queryKeys.config.ts):

```ts
export const QUERY_KEYS = {
  auth: {
    user: ['auth', 'user'] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    list: (filters?: Record<string, unknown>) => ['appointments', 'list', filters] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
  },
  chat: {
    messages: (chatId: string) => ['chat', chatId, 'messages'] as const,
  },
} as const;
```

### D. Separation of Types and DTOs
- Move reusable domain models (e.g. `Appointment`, `TherapistProfile`, `ChatMessage`) to `src/types/`.
- Keep request-specific DTOs (`CreateBookingPayload`, `UpdateProfilePayload`) co-located with their respective API modules or in dedicated DTO type files.

---

## 3. Component Consumption Best Practice

UI components should **never** invoke raw API calls directly inside `useEffect` or button clicks.
Always wrap API calls in dedicated custom hooks with TanStack Query:

```ts
// In hooks/useAppointments.ts
export const useAppointments = (filters?: AppointmentFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.appointments.list(filters),
    queryFn: () => getAppointments(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
```
