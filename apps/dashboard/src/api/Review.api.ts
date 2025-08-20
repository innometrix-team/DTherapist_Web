import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IReviewRequest {
  therapistId: string;
  rating: number; // 1-5
  comment: string;
}

export interface IReview {
  _id: string;
  therapistId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateReviewResponse {
  review: IReview;
  message: string;
}

export interface IReviewsListResponse {
  reviews: IReview[];
  totalCount: number;
  averageRating: number;
  ratingDistribution: {
    [key: string]: number; // "5": 10, "4": 5, etc.
  };
}

interface APIResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Create a review
export default async function createReviewApi(
  data: IReviewRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICreateReviewResponse> | null> {
  try {
    const response = await Api.post<APIResponse<ICreateReviewResponse>>(
      '/api/user/reviews',
      data,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Get reviews for a specific therapist
export async function getTherapistReviewsApi(
  therapistId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IReviewsListResponse> | null> {
  try {
    const response = await Api.get<APIResponse<IReviewsListResponse>>(
      `/api/user/reviews/${encodeURIComponent(therapistId)}`,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Get all reviews (for admin or user's own reviews)
export async function getAllReviewsApi(
  params?: { page?: number; limit?: number; userId?: string },
  config?: AxiosRequestConfig
): Promise<IAPIResult<IReviewsListResponse> | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.userId) searchParams.append('userId', params.userId);

    const queryString = searchParams.toString();
    const url = queryString ? `/api/user/reviews?${queryString}` : '/api/user/reviews';

    const response = await Api.get<APIResponse<IReviewsListResponse>>(url, {
      ...config,
    });
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}


