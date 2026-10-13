import Axios, { AxiosError, AxiosRequestHeaders, AxiosResponse } from 'axios';
import { STORE_KEYS } from '../configs/store.config';
import { AuthState } from '../store/auth/types';
import { StoreResult } from '../store/types';

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

const Api = Axios.create({ baseURL: import.meta.env.VITE_API_URL });

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

Api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    let message = error.message;

    // Handle network errors
    if (/network error/i.test(message)) {
      if (!navigator.onLine) {
        message = 'No internet connection – please check your network.';
      } else {
        message = 'Whoops, something went wrong. Please try again in a moment.';
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem(STORE_KEYS.AUTH);

      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/auth/')) {
        window.location.href = '/auth/login';
      }

      message = 'Your session has expired. Please log in again.';
    }

    return Promise.reject(
      new ApiError(message, error.response?.status || 0, 'error')
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
  transform?: (data: TRaw) => TResult
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
      const innerData = envelope.data as TRaw;
      payload = transform ? transform(innerData) : (innerData as unknown as TResult);
    } else {
      payload = transform ? transform(rawData as TRaw) : (rawData as unknown as TResult);
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
    const err = e as AxiosError<IAPIResult<unknown>>;
    const statusCode = err.response?.status || 0;
    const errorMessage =
      err.response?.data?.message || err.message || 'An unexpected error occurred';
    const status = err.response?.data?.status || 'error';
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

export default Api;