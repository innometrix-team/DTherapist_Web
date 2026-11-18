import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().min(1, "VITE_API_URL is required"),
  VITE_SOCKET_URL: z.string().optional().default(""),
  MODE: z.string().optional().default("development"),
  DEV: z.boolean().optional().default(false),
  PROD: z.boolean().optional().default(false),
});

const rawEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  const errorDetails = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  console.error(`[ADMIN ENV ERROR] Missing or invalid environment configuration: ${errorDetails}`);
  if (import.meta.env.PROD) {
    throw new Error(`Admin environment validation failed: ${errorDetails}`);
  }
}

const rawApiUrl = parsed.data?.VITE_API_URL || import.meta.env.VITE_API_URL || "";
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
const rawSocketUrl = parsed.data?.VITE_SOCKET_URL || import.meta.env.VITE_SOCKET_URL || normalizedApiUrl;
const normalizedSocketUrl = rawSocketUrl.replace(/\/+$/, "");

export const env = {
  API_URL: normalizedApiUrl,
  SOCKET_URL: normalizedSocketUrl,
  IS_DEV: parsed.data?.DEV ?? Boolean(import.meta.env.DEV),
  IS_PROD: parsed.data?.PROD ?? Boolean(import.meta.env.PROD),
  MODE: parsed.data?.MODE ?? import.meta.env.MODE ?? "development",
};
