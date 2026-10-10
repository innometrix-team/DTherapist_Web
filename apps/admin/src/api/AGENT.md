# Admin API Layer Guide (`src/api/`)

This guide directs AI agents and developers on refactoring and consuming APIs within [`apps/admin/src/api/`](./).

---

## 1. Overview
The admin API layer interacts with moderation, disputes, user records, and analytics. It uses the centralized Axios client defined in [`Api.ts`](./Api.ts).

---

## 2. Refactoring Directives
1. **Centralize Error Handling:** Do not duplicate try/catch Axios error parsing across functions. Let [`Api.ts`](./Api.ts) interceptors handle status and error normalization.
2. **Promise Rejections Must Be `Error` Instances (`prefer-promise-reject-errors`):** Never reject a Promise with a plain object literal (e.g. `Promise.reject({ code, message })`). Always reject with an [`ApiError`](./Api.ts) instance:
   ```ts
   return Promise.reject(new ApiError(errorMessage, statusCode, status));
   ```
   Plain objects omit stack traces and violate `@typescript-eslint/prefer-promise-reject-errors`.
3. **TanStack Query Usage:** Always consume admin APIs via TanStack Query hooks with typed query keys.
4. **DTO Typing:** Explicitly type all admin actions (e.g. `ResolveDisputePayload`, `ModerationActionPayload`). Avoid `any`.
