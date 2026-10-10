# Admin API Layer Guide (`src/api/`)

This guide directs AI agents and developers on refactoring and consuming APIs within [`apps/admin/src/api/`](./).

---

## 1. Overview
The admin API layer interacts with moderation, disputes, user records, and analytics. It uses the centralized Axios client defined in [`Api.ts`](./Api.ts).

---

## 2. Refactoring Directives
1. **Centralize Error Handling:** Do not duplicate try/catch Axios error parsing across functions. Let [`Api.ts`](./Api.ts) interceptors handle status and error normalization.
2. **TanStack Query Usage:** Always consume admin APIs via TanStack Query hooks with typed query keys.
3. **DTO Typing:** Explicitly type all admin actions (e.g. `ResolveDisputePayload`, `ModerationActionPayload`). Avoid `any`.
