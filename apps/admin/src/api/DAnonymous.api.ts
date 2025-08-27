import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// DAnonymous Group interfaces
export interface IDAnonymousGroup {
  _id: string;
  name: string;
  description?: string;
  image: string;
  createdAt: string; // Changed from createdDate to createdAt
  updatedAt: string; // Added updatedAt to match API response
  __v?: number; // Added version field from MongoDB
  membersCount?: number; // Optional field for UI display
}

export interface IDAnonymousGroupCreateData {
  name: string;
  description: string;
  image?: string; // Make image optional since it might be uploaded separately
}

export interface IDAnonymousGroupEditData {
  name: string;
  description: string;
  image?: string; // Optional for image updates
}

export interface IImageUploadResponse {
  imageUrl: string;
}

// API Response interfaces
interface DAnonymousGroupsAPIResponse {
  status: string;
  message: string;
  data: IDAnonymousGroup[];
}

interface DAnonymousGroupAPIResponse {
  status: string;
  message: string;
  data: IDAnonymousGroup;
}

interface ImageUploadAPIResponse {
  status: string;
  message: string;
  data: IImageUploadResponse;
}

interface GenericAPIResponse {
  status: string;
  message: string;
  data: Record<string, unknown>;
}

// Get all groups
export async function getDAnonymousGroupsApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDAnonymousGroup[]> | null> {
  try {
    const endpoint = '/api/DAnonymous/';
    
    const response = await Api.get<DAnonymousGroupsAPIResponse>(endpoint, {
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

// Get single group
export async function getDAnonymousGroupApi(
  groupId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDAnonymousGroup> | null> {
  try {
    const endpoint = `/api/DAnonymous/${groupId}`;
    
    const response = await Api.get<DAnonymousGroupAPIResponse>(endpoint, {
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

// Create group
export async function createDAnonymousGroupApi(
  groupData: IDAnonymousGroupCreateData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IDAnonymousGroup> | null> {
  try {
    const endpoint = '/api/DAnonymous/create';
    
    const response = await Api.post<DAnonymousGroupAPIResponse>(endpoint, groupData, {
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

// Edit group
export async function editDAnonymousGroupApi(
  groupId: string,
  groupData: IDAnonymousGroupEditData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Record<string, unknown>> | null> {
  try {
    const endpoint = `/api/DAnonymous/${groupId}`;
    
    const response = await Api.patch<GenericAPIResponse>(endpoint, groupData, {
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

// Delete group
export async function deleteDAnonymousGroupApi(
  groupId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Record<string, unknown>> | null> {
  try {
    const endpoint = `/api/DAnonymous/${groupId}`;
    
    const response = await Api.delete<GenericAPIResponse>(endpoint, {
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

// Upload image
export async function uploadDAnonymousGroupImageApi(
  groupId: string,
  imageFile: File,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IImageUploadResponse> | null> {
  try {
    const endpoint = `/api/DAnonymous/${groupId}/upload-image`;
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await Api.post<ImageUploadAPIResponse>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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

// Remove image
export async function removeDAnonymousGroupImageApi(
  groupId: string,
  imageUrl: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Record<string, unknown>> | null> {
  try {
    const endpoint = `/api/DAnonymous/${groupId}/remove-image`;
    
    const response = await Api.delete<GenericAPIResponse>(endpoint, {
      data: { imageUrl },
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