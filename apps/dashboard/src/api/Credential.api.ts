import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Define Role type (ensure this matches your existing type definitions)
type Role = "client" | "therapist" | "user" | "counselor";

export interface ICredentialUploadData {
  resume?: File | null;
  certification?: File | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface ICredentialResponseData {
  user?: User;
  message: string;
  resumeUrl?: string;
  certificationUrl?: string;
}

interface APIResponse {
  status: string;
  message: string;
  data?: ICredentialResponseData;
}

interface APIErrorResponse {
  code: number;
  status: string;
  message: string;
  data: undefined;
}

// Upload CV/Resume
export async function uploadCVApi(
  file: File,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  try {
    const formData = new FormData();
    formData.append('cv', file);
    
    const response = await Api.post<APIResponse>("/api/profile/upload-cv", formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "CV uploaded successfully",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data.message || error.message || "An error occurred";
    const status = error.response?.data.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Upload Certification
export async function uploadCertificationApi(
  file: File,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  try {
    const formData = new FormData();
    formData.append('certification', file);
    
    const response = await Api.post<APIResponse>("/api/profile/upload-certification", formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Certification uploaded successfully",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data.message || error.message || "An error occurred";
    const status = error.response?.data.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Save Credentials (final submission)
export async function saveCredentialsApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  try {
    const response = await Api.post<APIResponse>("/api/profile/save-credentials", {}, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Credentials saved successfully",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data.message || error.message || "An error occurred";
    const status = error.response?.data.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Remove CV
export async function removeCVApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  try {
    const response = await Api.delete<APIResponse>("/api/profile/remove-cv", {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "CV removed successfully",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data.message || error.message || "An error occurred";
    const status = error.response?.data.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Remove Certification
export async function removeCertificationApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  try {
    const response = await Api.delete<APIResponse>("/api/profile/remove-certification", {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Certification removed successfully",
      data: response.data.data
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data.message || error.message || "An error occurred";
    const status = error.response?.data.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}