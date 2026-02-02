# DTherapist Web Copilot Instructions

## Project Overview

DTherapist is a monorepo TypeScript/React application with three Vite-based apps: **dashboard** (therapist & client interface), **admin** (admin panel), and **landing** (public-facing). All apps use Tailwind CSS, React Router for navigation, Zustand + localStorage for state, React Query for server state, and Axios with JWT interceptors for API communication.

## Architecture

### Monorepo Structure
- **apps/dashboard**: Main therapist/client platform with chat, appointments, video calls (Agora SDK)
- **apps/admin**: Admin dashboard for managing users, bookings, disputes
- **apps/landing**: Marketing/public landing page
- **shared**: Shared utilities/types (currently minimal)

Each app is independently built with `tsc -b && vite build` and runs with `vite dev`.

### Data Flow & State Management
1. **Auth State**: Zustand store (`useAuthStore`) persists to localStorage at `@DTHERAPIST:AUTH` (or `@DTHERAPIST:dev` in dev mode)
2. **Server State**: React Query handles API caching with query keys defined in `configs/queryKeys.config.ts`
3. **API Layer**: Every feature has dedicated API files (e.g., `src/api/Login.api.ts`, `src/api/Booking.api.ts`) with standardized request/response shapes
4. **Auth Flow**: Token stored in store, auto-injected via Axios interceptor, 401 response clears auth and redirects to login

### API Client Pattern
```typescript
// All API functions follow this shape:
async function FeatureApi(data: IRequestData, config?: AxiosRequestConfig): Promise<IAPIResult<IResponseData> | null>
// Returns: { code, status, message, data } | null on error
// Uses centralized Api client (src/api/Api.ts) with Axios interceptors for auth headers
```

## Key Patterns & Conventions

### Form Handling
- **zod + react-hook-form + @hookform/resolvers**: Define validation schema with Zod, use with RHF for type-safe forms
- **Example** ([apps/dashboard/src/components/auth/SignupForm.tsx](apps/dashboard/src/components/auth/SignupForm.tsx)): Role-based signup with enum validation, AbortController for cancellation
- **Toast notifications**: Use `react-hot-toast` for user feedback (already wrapped with `<Toaster />` in App)

### Component Structure
- Pages in `src/pages/`, reusable components in `src/components/` (organized by feature: `auth/`, `booking/`, `appointment/`, etc.)
- Use React Router for nested layouts (`<Layout />` wraps protected routes, contains sidebar/header)
- Protected routes checked in `ProtectedRoute.tsx` via `useAuthStore` token

### Styling
- **Tailwind CSS** via `@tailwindcss/vite` plugin (Vite 4.1.4+)
- **Emotion** for CSS-in-JS (`@emotion/react`, `@emotion/styled`)
- **MUI** components in dashboard app (`@mui/material`)
- **Icons**: `@heroicons/react` (v1/v2), `lucide-react`, `react-icons`
- **SVG**: `vite-plugin-svgr` auto-converts imports to components

### Async Operations & Cancellation
- Use `AbortController` in mutation functions (see SignupForm) to cancel in-flight requests
- Example: `const controller = new AbortController(); RegisterApi(data, { signal: controller.signal })`
- Cleanup AbortController on unmount or component state changes

### Query & Mutation Management
- Define query keys in `configs/queryKeys.config.ts` (e.g., `QUERY_KEYS.auth.register`, `QUERY_KEYS.groups.messages(id)`)
- Use `useQuery()` for server state fetching, `useMutation()` for POST/PUT/DELETE
- Handle loading/error states via `isPending`, `isError`, `error` from hooks

### Environment Variables
- **Base URL**: `import.meta.env.VITE_API_URL` for API endpoint (set in `.env`)
- **Mode**: `import.meta.env.MODE` for dev/prod detection (affects localStorage key prefixes)

## Build & Development Commands

### All Apps (from `apps/{app}/`)
- `npm run dev` or `yarn dev`: Start Vite dev server (HMR enabled)
- `npm run build`: Type-check with `tsc -b`, then build with Vite
- `npm run lint`: ESLint check
- `npm run preview`: Preview production build locally

### Workspace Root
- Package manager: **yarn 1.22.22** (pinned in root package.json)
- Install deps: `yarn install` at root, then `yarn workspaces run dev` to run all apps

## Common Tasks

### Adding a New API Feature
1. Create `src/api/FeatureName.api.ts` with typed interfaces (IRequestData, IResponseData, APIResponse)
2. Export default async function returning `Promise<IAPIResult<Data> | null>`
3. Use centralized `Api` client (Axios instance with auth interceptors)
4. Add query key to `configs/queryKeys.config.ts`
5. Use in component via `useMutation()` or `useQuery()`

### Adding a New Form Component
1. Define Zod schema with validation rules
2. Initialize `useForm<FormData>` with `zodResolver(schema)`
3. Use mutation to call API on submit
4. Handle `onSuccess` (navigate, set auth, show toast) and `onError` (show error toast)
5. Return AbortController from mutation for cleanup

### Adding a New Page
1. Create component in `src/pages/{Feature}/{Feature}.tsx`
2. Add Route in `App.tsx` (wrap with `<ProtectedRoute>` if authenticated-only)
3. Add navigation links in layout/sidebar
4. Use `useNavigate()` from react-router-dom for programmatic navigation

### Debugging State & Network
- **Auth State**: Open DevTools Console → `JSON.parse(localStorage.getItem('@DTHERAPIST:AUTH' or '@DTHERAPIST:dev'))`
- **API Calls**: Check Network tab in DevTools; Axios interceptor auto-injects `Authorization: Bearer {token}`
- **React Query Cache**: Install React Query DevTools extension or log `useQuery` `data` directly

## Important Files to Reference

| Purpose | Location |
|---------|----------|
| Auth store (Zustand + persist) | [apps/dashboard/src/store/auth/useAuthStore.ts](apps/dashboard/src/store/auth/useAuthStore.ts) |
| API client (Axios + interceptors) | [apps/dashboard/src/api/Api.ts](apps/dashboard/src/api/Api.ts) |
| Storage keys (mode-aware) | [apps/dashboard/src/configs/store.config.ts](apps/dashboard/src/configs/store.config.ts) |
| Query key registry | [apps/dashboard/src/configs/queryKeys.config.ts](apps/dashboard/src/configs/queryKeys.config.ts) |
| Protected route wrapper | [apps/dashboard/src/components/auth/ProtectedRoute.tsx](apps/dashboard/src/components/auth/ProtectedRoute.tsx) |
| Router setup | [apps/dashboard/src/App.tsx](apps/dashboard/src/App.tsx) |

## Gotchas & Troubleshooting

- **Token expiration**: 401 response auto-clears auth and redirects to login; don't manually override this in components
- **Form validation**: Always use Zod + RHF together; manual validation is error-prone
- **SVG imports**: Use `import { ReactComponent as Icon } from './icon.svg'` or import as component (vite-plugin-svgr)
- **Styling conflicts**: Emotion CSS-in-JS may override Tailwind; specify scoping carefully
- **AbortController cleanup**: Cancel mutations in `onSuccess`/`onError` to prevent memory leaks
- **localStorage prefix**: Mode-aware (dev = `@DTHERAPIST:dev`, prod = `@DTHERAPIST:`); don't hardcode keys
