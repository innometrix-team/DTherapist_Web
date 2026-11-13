import Axios, { AxiosError, AxiosRequestHeaders, AxiosResponse } from 'axios';
import { z } from 'zod';
import { STORE_KEYS } from '../configs/store.config';
import { AuthState } from '../store/auth/types';
import { StoreResult } from '../store/types';
import { clearAdminAuthSession } from '../utils/authSession.utils';
import { env } from '../configs/env.config';

export class ApiError extends Error {
  code: number;
  status: string;
  responseCode?: string;
  data?: unknown;

  constructor(
    message: string,
    code = 0,
    status = 'error',
    responseCode?: string,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.responseCode = responseCode;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const Api = Axios.create({ baseURL: env.API_URL });

Api.interceptors.request.use(
  (config) => {
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders;
    }

    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'text/plain',
      ...config.headers,
    } as AxiosRequestHeaders;

    const raw = localStorage.getItem(STORE_KEYS.AUTH);
    const auth: StoreResult<AuthState> | null = raw
      ? (JSON.parse(raw) as StoreResult<AuthState>)
      : null;

    if (auth?.state.token && !config.headers.authorization) {
      config.headers.authorization = `Bearer ${auth.state.token}`;
    }

    return config;
  },
  (error: unknown) =>
    Promise.reject(error instanceof Error ? error : new Error(String(error)))
);

export function extractErrorMessage(error: AxiosError<unknown>): string {
  const data = error.response?.data;

  // 1. If backend returned an object with a message or error
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    // Case: data.message is a string
    if (typeof record.message === 'string' && record.message.trim().length > 0) {
      return record.message.trim();
    }

    // Case: data.error is a string
    if (typeof record.error === 'string' && record.error.trim().length > 0) {
      return record.error.trim();
    }

    // Case: data.msg is a string
    if (typeof record.msg === 'string' && record.msg.trim().length > 0) {
      return record.msg.trim();
    }

    // Case: data.errors is an array
    if (Array.isArray(record.errors) && record.errors.length > 0) {
      const errorsList = record.errors as unknown[];
      const first: unknown = errorsList[0];
      if (typeof first === 'string' && first.trim().length > 0) {
        return first.trim();
      }
      if (first && typeof first === 'object') {
        const firstObj = first as Record<string, unknown>;
        if (typeof firstObj.message === 'string' && firstObj.message.trim().length > 0) {
          return firstObj.message.trim();
        }
        if (typeof firstObj.msg === 'string' && firstObj.msg.trim().length > 0) {
          return firstObj.msg.trim();
        }
      }
    }

    // Case: data.errors is an object of field -> string[]
    if (record.errors && typeof record.errors === 'object' && !Array.isArray(record.errors)) {
      const errorObj = record.errors as Record<string, unknown>;
      const errorValues: unknown[] = Object.values(errorObj).flat();
      const first: unknown = errorValues[0];
      if (typeof first === 'string' && first.trim().length > 0) {
        return first.trim();
      }
    }

    // Case: nested data.data.message
    if (record.data && typeof record.data === 'object') {
      const innerRecord = record.data as Record<string, unknown>;
      if (typeof innerRecord.message === 'string' && innerRecord.message.trim().length > 0) {
        return innerRecord.message.trim();
      }
    }
  }

  // 2. If data itself is a string (and not an HTML document)
  if (typeof data === 'string' && data.trim().length > 0 && !data.trim().startsWith('<')) {
    return data.trim();
  }

  // 3. Handle network errors
  if (/network error/i.test(error.message)) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'No internet connection – please check your network.';
    }
    return 'Network error – unable to reach the server. Please check your connection.';
  }

  // 4. Handle 401 session expiry vs auth form error
  if (error.response?.status === 401) {
    const isAuthRoute =
      (typeof window !== 'undefined' && window.location.pathname.includes('/auth')) ||
      (error.config?.url && error.config.url.includes('/api/auth/'));

    if (isAuthRoute) {
      return 'Invalid email or password. Please verify your details.';
    }
    return 'Your session has expired. Please log in again.';
  }

  // 5. Fallback for generic Axios HTTP error codes
  if (error.response?.status) {
    const code = error.response.status;
    if (code === 400) return 'Invalid request. Please check your information and try again.';
    if (code === 403) return 'You do not have permission to perform this action.';
    if (code === 404) return 'The requested resource was not found.';
    if (code === 409) return 'A conflict occurred. This record may already exist.';
    if (code === 422) return 'Validation error. Please verify the submitted information.';
    if (code === 429) return 'Too many requests. Please wait a moment and try again.';
    if (code >= 500) return 'Server error. Please try again later.';
  }

  // 6. Clean up Axios default "Request failed with status code ..."
  if (/status code \d+/i.test(error.message)) {
    return 'An unexpected error occurred. Please try again.';
  }

  return error.message || 'An unexpected error occurred';
}

Api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    const isAuthRoute =
      (typeof window !== 'undefined' && window.location.pathname.includes('/auth')) ||
      (error.config?.url && error.config.url.includes('/api/auth/'));

    // Handle authentication errors
    if (error.response?.status === 401 && !isAuthRoute) {
      clearAdminAuthSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    const message = extractErrorMessage(error);
    const statusCode = error.response?.status || 0;
    const record =
      error.response?.data && typeof error.response.data === 'object'
        ? (error.response.data as Record<string, unknown>)
        : undefined;
    const status = (typeof record?.status === 'string' ? record.status : undefined) || 'error';
    const responseCode = typeof record?.responseCode === 'string' ? record.responseCode : undefined;

    return Promise.reject(
      new ApiError(message, statusCode, status, responseCode, error.response?.data)
    );
  }
);

export type IAPIResult<D = unknown> = {
  message: string;
  data?: D;
  status?: string;
  code: number;
  responseCode?: string;
};

export interface ApiResponseEnvelope<T> {
  status?: string;
  message?: string;
  data?: T;
  responseCode?: string;
}

export async function handleApiRequest<TRaw, TResult = TRaw>(
  requestFn: () => Promise<AxiosResponse<ApiResponseEnvelope<TRaw> | TRaw>>,
  transform?: (data: TRaw) => TResult,
  schema?: { safeParse(data: unknown): { success: true; data: TRaw } | { success: false; error: z.ZodError } }
): Promise<IAPIResult<TResult> | null> {
  try {
    const response = await requestFn();
    const rawData = response.data;

    let payload: TResult;
    let status = 'success';
    let message = 'Success';
    let responseCode: string | undefined;

    if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      const envelope = rawData;
      status = envelope.status ?? 'success';
      message = envelope.message ?? 'Success';
      responseCode = envelope.responseCode;
      let innerData = envelope.data as TRaw;

      if (schema && innerData !== undefined) {
        const parseResult = schema.safeParse(innerData);
        if (parseResult.success) {
          innerData = parseResult.data;
        } else if (import.meta.env.DEV) {
          console.warn('[ADMIN API SCHEMA VALIDATION WARN]', parseResult.error.issues);
        }
      }

      payload = transform ? transform(innerData) : (innerData as unknown as TResult);
    } else {
      let innerData = rawData as TRaw;
      if (schema && innerData !== undefined) {
        const parseResult = schema.safeParse(innerData);
        if (parseResult.success) {
          innerData = parseResult.data;
        } else if (import.meta.env.DEV) {
          console.warn('[ADMIN API SCHEMA VALIDATION WARN]', parseResult.error.issues);
        }
      }
      payload = transform ? transform(innerData) : (innerData as unknown as TResult);
    }

    return {
      code: response.status,
      status,
      message,
      data: payload,
      responseCode,
    };
  } catch (e) {
    if (Axios.isCancel(e)) {
      return null;
    }
    if (e instanceof ApiError) {
      return Promise.reject(e);
    }
    const err = e as AxiosError<IAPIResult<unknown>>;
    const statusCode = err.response?.status || 0;
    const errorMessage = extractErrorMessage(err);
    const status = err.response?.data?.status || 'error';
    return Promise.reject(new ApiError(errorMessage, statusCode, status, undefined, err.response?.data));
  }
}

export default Api;