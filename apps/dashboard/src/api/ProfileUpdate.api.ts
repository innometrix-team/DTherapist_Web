import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";
import { STORE_KEYS } from "../configs/store.config";
import { AuthState } from "../store/auth/types";

export interface IProfileUpdateData {
  fullName: string;
  email: string;
  bio: string;
  specialization?: string;
  experience?: number;
  country: string;
  gender?: string;
  profilePicture?: File;
}

interface IResponseData {
  id: string;
  fullName: string;
  email: string;
  bio: string;
  specialization?: string;
  experience?: number;
  country: string;
  gender?: string;
  profilePicture?: string;
  updatedAt: string;
  token: string;
}

interface APIResponse {
  status: string;
  message: string;
  data: IResponseData;
}

function getAuthFromStorage(): AuthState | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORE_KEYS.AUTH);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch {
    return null;
  }
}

function validateProfilePicture(file: File): void {
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Profile picture is too large. Maximum size is 5MB.');
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }
}

function validateRequiredFields(data: IProfileUpdateData): void {
  if (!data.fullName?.trim() || !data.email?.trim() || !data.country?.trim()) {
    throw new Error('Required fields (fullName, email, country) are missing or empty');
  }
}

function createProfileFormData(data: IProfileUpdateData, isTherapist: boolean): FormData {
  const formData = new FormData();

  formData.append('fullName', data.fullName.trim());
  formData.append('email', data.email.trim());
  formData.append('bio', data.bio || '');
  formData.append('country', data.country.trim());

  if (isTherapist) {
    formData.append('specialization', data.specialization?.trim() || '');

    // Append experience as number string only if valid
    if (typeof data.experience === 'number' && !isNaN(data.experience)) {
      formData.append('experience', String(data.experience)); // will be parsed as number on backend
    } else {
      formData.append('experience', '0');
    }
  }

  if (data.gender?.trim()) {
    formData.append('gender', data.gender.trim());
  }

  if (data.profilePicture && data.profilePicture instanceof File) {
    validateProfilePicture(data.profilePicture);
    formData.append('profilePicture', data.profilePicture, data.profilePicture.name);
  }

  return formData;
}


export default async function ProfileUpdateApi(
  data: IProfileUpdateData,
  config?: AxiosRequestConfig,
  userRole?: string
): Promise<IAPIResult<IResponseData> | null> {
  try {
    validateRequiredFields(data);

    let role = userRole;
    if (!role) {
      const auth = getAuthFromStorage();
      role = auth?.role || 'user';
    }

    const isTherapist = role === "therapist" || role === "counselor";
    const endpoint = isTherapist ? "/api/profile" : "/api/user";

    const formData = createProfileFormData(data, isTherapist);
    
    const requestConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
      },
      timeout: 30000,
    };

    // Ensure Content-Type is NOT set manually for FormData
    if (requestConfig.headers) {
      delete requestConfig.headers['Content-Type'];
    }

    const response = await Api.patch<APIResponse>(endpoint, formData, requestConfig);

    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Profile updated successfully",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message ||
      "An error occurred while updating profile";
    const status = (e as AxiosError<IAPIResult>).response?.data?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}
