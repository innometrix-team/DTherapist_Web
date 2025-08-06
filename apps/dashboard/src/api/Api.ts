// src/services/api.ts
import Axios, { AxiosRequestHeaders } from 'axios';
import { STORE_KEYS } from '../configs/store.config';
import { AuthState } from '../store/auth/types';
import { StoreResult } from '../store/types';


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
    const auth: StoreResult<AuthState>  | null= raw ? JSON.parse(raw) : null;

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

    if (/network error/i.test(message)) {
      if (!navigator.onLine) {
        message = "No internet connection – please check your network.";
      } else {
        message = "Whoops, something went wrong. Please try again in a moment.";
      }
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