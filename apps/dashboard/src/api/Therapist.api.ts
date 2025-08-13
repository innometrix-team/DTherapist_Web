import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Updated Therapist interfaces to match your API response
export interface ITherapist {
  id: string;
  name: string;
  email?: string;
  profilePicture: string;
  category: string;
  experience: number; // Number of years
  cost: {
    video: number;
    inPerson: number;
  } | number | null; // Updated to handle both formats
  about?: string;
  specializations?: string[];
  availability?: {
    [key: string]: string[];
  };
  reviews: {
    averageRating: number | null;
    totalReviews: number;
    count?: number; // Add this for backward compatibility
  };
  userId: string;
}

// Simplified category interface - just strings
export interface ICategory {
  id: string;
  name: string;
  description?: string;
}

export interface ITherapistListParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ITherapistListResponse {
  therapists: ITherapist[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// Updated to match actual API response
interface ICategoriesResponse {
  categories: string[]; // Array of strings, not objects
}

interface ITherapistDetailResponse {
  therapist: ITherapist;
}

// Generic wrapper for when API doesn't use standard wrapper
interface APIResponse<T> {
  status?: string;
  message?: string;
  data?: T;
}

// Get all categories - updated to handle your actual response structure
export async function getCategoriesApi(config?: AxiosRequestConfig): Promise<IAPIResult<ICategoriesResponse> | null> {
  try {
    // Your API returns { "categories": ["string1", "string2"] } directly
    const response = await Api.get<ICategoriesResponse>('/api/user/counselors/categories', {
      ...config,
    });
    
    // Since your API doesn't wrap in standard format, we create the wrapper
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: "Categories retrieved successfully",
      data: response.data // This should be { categories: ["string1", "string2"] }
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data?.status || "error";
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Get therapists by category
export async function getTherapistsByCategoryApi(
  category: string, 
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistListResponse> | null> {
  try {
    const response = await Api.get<APIResponse<ITherapistListResponse> | ITherapistListResponse>(
      `/api/user/counselors/categories/${encodeURIComponent(category)}`, 
      { ...config }
    );
    
    // Handle both wrapped and unwrapped responses
    let responseData: ITherapistListResponse;
    
    if ('data' in response.data && response.data.data) {
      // Wrapped response: { status, message, data: ITherapistListResponse }
      responseData = response.data.data;
    } else if ('therapists' in response.data) {
      // Unwrapped response: ITherapistListResponse directly
      responseData = response.data as ITherapistListResponse;
    } else {
      // Fallback - create empty response
      responseData = {
        therapists: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1
      };
    }
    
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: "Therapists retrieved successfully",
      data: responseData
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data?.status || "error";
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Get all therapists with optional filters
export async function getTherapistsApi(
  params?: ITherapistListParams,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistListResponse> | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/api/user/counselors?${queryString}` : '/api/user/counselors';

    const response = await Api.get<APIResponse<ITherapistListResponse> | ITherapistListResponse>(url, {
      ...config,
    });
    
    // Handle both wrapped and unwrapped responses
    let responseData: ITherapistListResponse;
    
    if ('data' in response.data && response.data.data) {
      // Wrapped response: { status, message, data: ITherapistListResponse }
      responseData = response.data.data;
    } else if ('therapists' in response.data) {
      // Unwrapped response: ITherapistListResponse directly
      responseData = response.data as ITherapistListResponse;
    } else {
      // Fallback - create empty response
      responseData = {
        therapists: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1
      };
    }
    
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: "Therapists retrieved successfully",
      data: responseData
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data?.status || "error";
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Get therapist details by ID
export async function getTherapistDetailsApi(
  therapistId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistDetailResponse> | null> {
  try {
    const response = await Api.get<APIResponse<ITherapistDetailResponse> | ITherapistDetailResponse>(
      `/api/user/counselors/${encodeURIComponent(therapistId)}`,
      { ...config }
    );
    
    // Handle both wrapped and unwrapped responses
    let responseData: ITherapistDetailResponse;
    
    if ('data' in response.data && response.data.data) {
      // Wrapped response: { status, message, data: ITherapistDetailResponse }
      responseData = response.data.data;
    } else if ('therapist' in response.data) {
      // Unwrapped response: ITherapistDetailResponse directly
      responseData = response.data as ITherapistDetailResponse;
    } else {
      // If the response is just the therapist object directly
      responseData = { therapist: response.data as ITherapist };
    }
    
    return Promise.resolve({
      code: response.status,
      status: "success",
      message: "Therapist details retrieved successfully",
      data: responseData
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data?.status || "error";
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Helper function to convert string array to category objects (for UI consistency)
export function convertCategoriesToObjects(categories: string[]): ICategory[] {
  return categories.map((categoryName) => ({
    id: categoryName.toLowerCase().replace(/\s+/g, '-'), // Create ID from name
    name: categoryName,
    description: `${categoryName} counseling services`
  }));
}