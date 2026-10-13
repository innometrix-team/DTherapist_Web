# CLAUDE.md — DTherapist Web Assistant Guide

Guidance for Claude Code when working in the **DTherapist_Web** repository.

---

## 1. Monorepo Architecture

- **`apps/landing/`**: Public landing and marketing site (React 19, Tailwind v4, Vite).
- **`apps/dashboard/`**: Patient & therapist application with Agora video/audio, real-time chat, and appointment management.
- **`apps/admin/`**: Admin portal for platform moderation and review.
- **`shared/`**: Reusable pure utilities, TypeScript types, and configs.
- **`docs/`**: Developer documentation and architectural runbooks.
- **Deployment:** Each app deploys independently to Vercel as an SPA with route rewrites to `/index.html`.

---

## 2. Common Commands

All commands are run from the respective app directory:

```bash
# Dashboard (apps/dashboard)
npm --prefix apps/dashboard run dev       # Start dev server
npm --prefix apps/dashboard run build     # Typecheck (tsc -b) & Vite build
npm --prefix apps/dashboard run lint      # ESLint check

# Admin (apps/admin)
npm --prefix apps/admin run dev           # Start dev server
npm --prefix apps/admin run build         # Typecheck (tsc -b) & Vite build
npm --prefix apps/admin run lint          # ESLint check

# Landing (apps/landing)
npm --prefix apps/landing run dev         # Start dev server
npm --prefix apps/landing run build       # Typecheck (tsc -b) & Vite build
npm --prefix apps/landing run lint        # ESLint check

# Documentation Quality
npx markdownlint docs/                    # Lint markdown files
```

> **Note:** If installing packages in `apps/dashboard`, remember `apps/dashboard/vercel.json` uses:
> `npm install --legacy-peer-deps`

---

## 3. Styling Rules (Option B: Vercel Safe)

- **Synchronized Theme Tokens:** Every app has its own `src/index.css` declaring identical `@theme` design tokens:
  - `--color-primary: #014CB1`
  - `--color-darkerb: #052046`
  - `--color-success: #00BF63`
  - `--color-success-700: #F08000`
  - `--color-neutral: #A6A6A6`
  - `--color-offwhite: #f0f2f6`
  - `--color-divider: #D3D5DB`
- **Zero Arbitrary Hex Classes:** Never use inline hex values (e.g. `bg-[#014CB1]` or `text-[#052046]`). Always use semantic Tailwind tokens (`bg-primary`, `text-darkerb`).
- **No Rogue Classnames:** Do not use unregistered utility names like `hover:text-Dblue`.
- **Global Reusability:** Shared styles and design tokens must remain consistent across all 3 applications.

---

## 4. Code Standards & Architecture

### TypeScript & Typing
- **Strict mode:** Never use `any`. Always supply explicit interfaces/types for props, state, and API DTOs.
- **Unused variables:** TypeScript's `noUnusedLocals` is enabled. Remove unused imports (including unused `import React from 'react'`) to prevent `tsc -b` failures.
- **Promise Rejection Reason:** Never reject promises with plain objects (`Promise.reject({ ... })`) or primitives. Always reject with an `Error` instance (e.g. `new ApiError(...)`) to preserve stack traces and satisfy `@typescript-eslint/prefer-promise-reject-errors`.

### Components & Hook Rules
- **Functional Components Exclusively:** Write only React functional components. Never use class components.
- **Top-Level Hooks Invariant:** Never call `useEffect` (or any React hook) inside nested functions, loops, event handlers, or conditionals. All hooks must be invoked at the top level of the component or custom hook before any early returns.
- **Side Effects Isolation:** Keep `useEffect` minimal and focused. Extract complex fetching or subscription logic into custom hooks.

### Directory & Naming Conventions
- Folders must be `kebab-case` or lowercase `camelCase` (no special characters like `terms&condition/`).
- Standardize on `constants/` (not `constant/`) and `store/` (not `Store/`).
- Components: `PascalCase.tsx`.
- Custom hooks: `useCamelCase.ts`.

### State & Server Data
- **Zustand v5:** Always use selective subscriptions: `const user = useAuthStore(s => s.user)`.
- **TanStack Query v5:** Never use raw string arrays as query keys inside components. Always define keys in `configs/queryKeys.config.ts`.
- **API Layer:** See `apps/dashboard/src/api/AGENT.md` for rules on removing repetitive try/catch blocks, unifying duplicate endpoints, and centralizing error handling.

---

## 5. Boundaries & Invariants

- **Safe Refactoring:** Always run `npm run build` (`tsc -b`) in the relevant app to ensure zero TypeScript errors before committing changes.
- **Vercel Routing:** Preserve the SPA rewrites in `vercel.json` (`/(.*) -> /index.html`).
- **Secrets:** Never log, modify, or commit credentials in `.env` files.
- **Documentation:** When generating documentation, write concise, value-dense Markdown into `docs/` that is easily understood by onboarding developers.
