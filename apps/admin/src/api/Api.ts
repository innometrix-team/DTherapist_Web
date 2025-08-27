// src/services/api.ts
import  Axios, { AxiosRequestHeaders } from 'axios';
import { STORE_KEYS } from '../configs/store.config';
import { AuthState } from '../Store/auth/types';
import { StoreResult } from '../Store/types';

const Api = Axios.create({ baseURL: import.meta.env.VITE_API_URL });

Api.interceptors.request.use(
  async (config) => {
    if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
    }
   
   config.headers = {
      'Content-Type': 'application/json',
      Accept: 'text/plain',
      ...config.headers,
    } as AxiosRequestHeaders;

    const raw = localStorage.getItem(STORE_KEYS.AUTH);
    const auth: StoreResult<AuthState> | null = raw ? JSON.parse(raw) : null;
    
    if (auth?.state.token && !config.headers.authorization) {
      config.headers.authorization = `Bearer ${auth.state.token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

Api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.message;
    
    // Handle network errors
    if (/network error/i.test(message)) {
      if (!navigator.onLine) {
        message = "No internet connection – please check your network.";
      } else {
        message = "Whoops, something went wrong. Please try again in a moment.";
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
      
      message = "Your session has expired. Please log in again.";
    }
    
    return Promise.reject({ ...error, message });
  }
);

export type IAPIResult<D = unknown> = {
  message: string;
  data?: D;
  status?: string;
  code: number;
  responseCode?: string;
};

export default Api;