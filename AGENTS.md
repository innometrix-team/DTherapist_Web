# AGENTS.md — DTherapist Web Monorepo Agent Guide

This file defines the architecture, styling principles, refactoring guardrails, and documentation standards for AI agents and developers working across the **DTherapist_Web** monorepo.

---

## 1. Monorepo Overview & Tech Stack

The repository is structured as a multi-app frontend monorepo hosted on Vercel:

```text
DTherapist_Web/
├── apps/
│   ├── landing/       # Public marketing & acquisition site
│   ├── dashboard/     # Client & therapist portal (chat, Agora video, booking, wallet)
│   └── admin/         # Platform administration & moderation portal
├── shared/            # Reusable types, pure utility functions, and shared configs
├── docs/              # Technical, architectural, and onboarding documentation
├── AGENTS.md          # Repository-wide agent instructions (this file)
└── CLAUDE.md          # Claude Code instructions
```

### Core Technologies
- **UI Framework:** React 19 (`react`, `react-dom`)
- **Language:** TypeScript (strict mode enabled across all apps)
- **Build Tooling:** Vite (v6 & v7) with `@tailwindcss/vite` and `vite-plugin-svgr`
- **Styling:** Tailwind CSS v4 using CSS theme tokens (`@theme` directive)
- **State Management:** Zustand v5
- **Server State / Networking:** TanStack Query v5 + Axios (centralized client)
- **Routing:** React Router v7
- **Real-Time / Media:** Agora RTC & RTM SDKs, Socket.io client

---

## 2. Global Styling & Design System Rules (Option B: Vercel-Safe)

To guarantee that each app builds independently on Vercel without relying on cross-directory root dependencies, each app maintains its own self-contained `src/index.css` while adhering to **strictly synchronized global design tokens**.

### A. The Standardized Theme Tokens
Every app (`apps/landing/src/index.css`, `apps/dashboard/src/index.css`, `apps/admin/src/index.css`) must declare and maintain identical `@theme` tokens:

```css
@import "tailwindcss";

@theme {
  --color-primary: #014CB1;
  --color-darkerb: #052046;
  --color-success: #00BF63;
  --color-success-700: #F08000;
  --color-neutral: #A6A6A6;
  --color-offwhite: #f0f2f6;
  --color-divider: #D3D5DB;
}
```

### B. Styling Invariants
1. **No Arbitrary Hex Classes:** Never hardcode colors in Tailwind classes (e.g. `bg-[#014CB1]`, `text-[#052046]`). Always use semantic token classes: `bg-primary`, `text-darkerb`, `border-divider`, `bg-offwhite`.
2. **No Invented Utility Classes:** Never use unregistered classes (e.g. `hover:text-Dblue`). If a new brand color is introduced, register it in the `@theme` block across all apps before using it.
3. **Reusable Design Components:** Common UI components (buttons, badges, inputs, modal containers) should share standard class composition rather than ad-hoc styles in individual page files.
4. **Third-Party CSS Isolation:** Third-party styling imports (e.g. Agora video wrappers, React-Slick carousel) should remain isolated in their respective app entry points or dedicated component styles.

---

## 3. Directory & Code Architecture Standards

### A. Directory & Naming Conventions
- **Folders:** strictly `kebab-case` or lowercase `camelCase`. 
  - Consolidate duplicated directories: use `constants/` (remove `constant/`).
  - Standardize casing: use `store/` everywhere (rename `Store/` in admin).
  - Eliminate special characters in folder names: rename `terms&condition/` to `terms-and-conditions/`.
- **Components:** `PascalCase.tsx` (e.g. `AppointmentCard.tsx`, `ChatWindow.tsx`).
- **Hooks:** `camelCase.ts` prefixed with `use` (e.g. `useDashboardData.ts`, `useAuthSession.ts`).
- **Services & APIs:** `camelCase.ts` with descriptive suffix (e.g. `appointments.api.ts`, `socket.service.ts`).
- **Types & Interfaces:** `PascalCase` with explicit domain names (`Appointment`, `UserProfileDTO`).

### B. Component Layer Separation & Hook Rules
- **Functional Components Exclusively:** Always write modern functional components (`React.FC<Props>` or `function Component(props: Props)`). Never use legacy class components (`class Component extends React.Component`).
- **Strict Hook Placement (Top-Level Invariant):**
  - Never call `useEffect` (or any React hook) inside nested functions, helper methods, loops, event handlers, or conditionals.
  - All hooks must be invoked strictly at the top level of the component or custom hook before any conditional statements or early returns.
  - Side effects should be cleanly isolated; extract complex data fetching or event listener logic into custom hooks (`useAppointmentSession.ts`).
- **Strict TypeScript:** No `any` types. All props and states must be explicitly typed.
- **Unused Declarations:** Do not leave unused imports or variables (e.g. unused `import React from 'react'`), as TypeScript's `noUnusedLocals` will fail Vite builds (`tsc -b`).

### C. State Management (Zustand v5)
- Keep stores modular by domain (e.g. `auth`, `notification`, `ui`).
- Always use selective selectors to prevent unnecessary component re-renders:
  ```ts
  // Correct:
  const token = useAuthStore((s) => s.token);
  // Avoid:
  const { token } = useAuthStore();
  ```

---

## 4. Folder-Specific Guidance: API Layer (`src/api/`)

For in-depth API refactoring instructions, consult the folder-specific guide:
👉 **[`apps/dashboard/src/api/AGENT.md`](apps/dashboard/src/api/AGENT.md)**

### Key API Layer Directives:
1. **Centralize Error & Cancel Handling:**
   - Eliminate repetitive 30-line `try/catch` blocks from individual `.api.ts` files.
   - Let Axios interceptors in `Api.ts` normalize response errors and cancelation signals.
2. **Reject Promises Exclusively with `Error` Instances (`prefer-promise-reject-errors`):**
   - Never reject a promise with a plain object literal (e.g. `Promise.reject({ code, message })`) or a primitive.
   - Always reject with an instance of `Error` or the shared `ApiError` class: `return Promise.reject(new ApiError(errorMessage, statusCode, status))`.
   - Plain objects omit stack traces and trigger ESLint errors (`@typescript-eslint/prefer-promise-reject-errors`).
3. **Deduplicate Endpoints:**
   - Consolidate redundant files (e.g. merge `Appointment.api.ts` and `Appointments.api.ts` into a unified `appointments.api.ts`).
4. **Centralize Query Keys:**
   - All TanStack Query keys must be registered in `configs/queryKeys.config.ts`.
   - Disallow magic string arrays like `['appointments', id]` inside components.
5. **Decouple Types:**
   - Store domain entities in `src/types/` rather than inlining them inside individual API files.

---

## 5. Documentation Standards (`docs/`)

When generating or updating documentation in `docs/`:
- **Audience:** Incoming developers. Write with clarity, practical code examples, and explicit file references. Avoid assumptions and unexplained jargon.
- **Structure:**
  - `docs/architecture/` – System flows, authentication flow, monorepo setup.
  - `docs/api/` – Endpoint documentation, query keys, payload contracts.
  - `docs/design-system/` – Shared theme tokens, reusable layout patterns.
  - `docs/guides/` – Developer onboarding, deployment steps, video/chat integration.
- **Style & Quality:**
  - Use GitHub-flavored Markdown.
  - Keep sentences value-dense and concise.
  - Test all documentation with `npx markdownlint docs/`.

---

## 6. Commands Reference

### Landing App (`apps/landing/`)
```bash
npm --prefix apps/landing run dev       # Start Vite dev server
npm --prefix apps/landing run build     # Type-check and build (tsc -b && vite build)
npm --prefix apps/landing run lint      # Run ESLint
```

### Dashboard App (`apps/dashboard/`)
```bash
npm --prefix apps/dashboard run dev     # Start Vite dev server
npm --prefix apps/dashboard run build   # Type-check and build (tsc -b && vite build)
npm --prefix apps/dashboard run lint    # Run ESLint
```

### Admin App (`apps/admin/`)
```bash
npm --prefix apps/admin run dev         # Start Vite dev server
npm --prefix apps/admin run build       # Type-check and build (tsc -b && vite build)
npm --prefix apps/admin run lint        # Run ESLint
```

### Documentation & Markdown Quality
```bash
npx markdownlint docs/                  # Lint markdown documentation
```

---

## 7. Agent Operational Boundaries

### Mode A: Documentation Tasks
- ✅ **Always do:** Write new files into `docs/` or folder-level `AGENT.md`/`README.md`; run markdownlint; cross-link referenced code symbols.
- ⚠️ **Ask first:** Before deleting or heavily rewriting existing developer documentation.
- 🚫 **Never do:** Modify code files in `apps/*/src/` while operating in documentation-only mode.

### Mode B: Code Refactoring & Engineering Tasks
- ✅ **Always do:**
  - Verify type safety before and after changes by running `npm run build` (`tsc -b`).
  - Maintain backward compatibility of routes, API contracts, and user flows.
  - Consolidate duplicate code and remove dead imports/unused variables.
  - Ensure all styles use the global synchronized theme tokens.
- ⚠️ **Ask first:**
  - Before deleting or merging duplicate API endpoints/files.
  - Before introducing new third-party npm packages.
  - Before altering URL routes in React Router.
- 🚫 **Never do:**
  - Commit or edit secrets/credentials in `.env` files.
  - Suppress TypeScript errors with `@ts-ignore` or `any` without explicit justification.
  - Break Vercel SPA routing rules in `vercel.json`.
