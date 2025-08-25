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

// FIXED: Updated interface to match your actual API response
interface APIResponse<T> {
  status?: string;
  message: string;
  data?: T;
  // Add direct properties for the flat response structure
  reviews?: IReview[];
  totalCount?: number;
  averageRating?: number;
  ratingDistribution?: {
    [key: string]: number;
  };
  // For create review response
  review?: IReview;
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
    
    // Handle both nested and flat response structures for create review
    let reviewData: ICreateReviewResponse;
    
    if (response.data.data) {
      // Nested structure
      reviewData = response.data.data;
    } else if (response.data.review) {
      // Flat structure with review property
      reviewData = {
        review: response.data.review,
        message: response.data.message
      };
    } else {
      // Fallback - treat the entire response.data as the review
      reviewData = {
        review: response.data as unknown as IReview,
        message: response.data.message
      };
    }
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status || "success",
      message: response.data.message ?? "success",
      data: reviewData
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

// FIXED: Get reviews for a specific therapist
export async function getTherapistReviewsApi(
  therapistId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IReviewsListResponse> | null> {
  try {
    const response = await Api.get<APIResponse<IReviewsListResponse>>(
      `/api/user/reviews/${encodeURIComponent(therapistId)}`,
      { ...config }
    );
    
    // DEBUG: Log the raw response to see what we're actually getting
    console.log('Raw API Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
      config: response.config.url
    });
    
    // FIXED: Handle both nested and flat response structures
    let reviewsData: IReviewsListResponse;
    
    if (response.data.data) {
      // Nested structure: { status: "success", message: "...", data: { reviews: [...] } }
      console.log('Using nested structure');
      reviewsData = response.data.data;
    } else if (response.data.reviews) {
      // Flat structure: { message: "...", reviews: [...] }
      console.log('Using flat structure');
      reviewsData = {
        reviews: response.data.reviews,
        totalCount: response.data.totalCount || response.data.reviews.length,
        averageRating: response.data.averageRating || 0,
        ratingDistribution: response.data.ratingDistribution || {}
      };
    } else {
      // Fallback: empty reviews
      console.log('No reviews found in response, using fallback');
      reviewsData = {
        reviews: [],
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: {}
      };
    }

    const result = {
      code: response.status,
      status: response.data.status || "success",
      message: response.data.message ?? "success",
      data: reviewsData
    };
    
    console.log('Final result:', result);
    return Promise.resolve(result);
  } catch (e) {
    console.error('Error in getTherapistReviewsApi:', e);
    
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

// FIXED: Get all reviews (for admin or user's own reviews)
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
    
    // FIXED: Handle both nested and flat response structures
    let reviewsData: IReviewsListResponse;
    
    if (response.data.data) {
      // Nested structure
      reviewsData = response.data.data;
    } else if (response.data.reviews) {
      // Flat structure
      reviewsData = {
        reviews: response.data.reviews,
        totalCount: response.data.totalCount || response.data.reviews.length,
        averageRating: response.data.averageRating || 0,
        ratingDistribution: response.data.ratingDistribution || {}
      };
    } else {
      // Fallback
      reviewsData = {
        reviews: [],
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: {}
      };
    }

    return Promise.resolve({
      code: response.status,
      status: response.data.status || "success",
      message: response.data.message ?? "success",
      data: reviewsData
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