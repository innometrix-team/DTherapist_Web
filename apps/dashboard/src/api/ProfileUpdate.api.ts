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

// Helper function to safely get auth from localStorage
function getAuthFromStorage(): AuthState | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORE_KEYS.AUTH);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch (error) {
    console.error('Error reading auth from localStorage:', error);
    return null;
  }
}

export default async function ProfileUpdateApi(
  data: IProfileUpdateData,
  config?: AxiosRequestConfig,
  userRole?: string
): Promise<IAPIResult<IResponseData> | null> {
  try {
    // Get user role from parameter or localStorage
    let role = userRole;
    if (!role) {
      const auth = getAuthFromStorage();
      role = auth?.role || 'client';
    }

    // Determine endpoints based on user role
    const isTherapist = role === "therapist" || role === "counselor";
    const isUser = role === "user" || role === "client";

    let profileEndpoint: string;
    let imageEndpoint: string;

    if (isTherapist) {
      profileEndpoint = "/api/profile";
      imageEndpoint = "/api/profile/upload-profile-picture";
    } else if (isUser) {
      profileEndpoint = "/api/user";
      imageEndpoint = "/api/user/upload-profile-picture";
    } else {
      // Fallback - default to user endpoints if role is unclear
      profileEndpoint = "/api/user";
      imageEndpoint = "/api/user/upload-profile-picture";
    }

    console.log('Selected profile endpoint:', profileEndpoint);
    console.log('Selected image endpoint:', imageEndpoint);

    // If there's a profile picture, upload it first
    let profilePictureUrl: string | undefined;
    if (data.profilePicture) {
      const imageFormData = new FormData();
      imageFormData.append('profilePicture', data.profilePicture);

      try {
        const imageResponse = await Api.post<APIResponse>(imageEndpoint, imageFormData, {
          ...config,
          headers: {
            'Content-Type': 'multipart/form-data',
            ...config?.headers,
          },
        });

        if (imageResponse.data.data?.profilePicture) {
          profilePictureUrl = imageResponse.data.data.profilePicture;
        }
      } catch (imageError) {
        console.error('Error uploading profile picture:', imageError);
        // Continue with profile update even if image upload fails
      }
    }

    // Prepare profile update data
    const profileUpdateData = {
      fullName: data.fullName,
      email: data.email,
      bio: data.bio,
      country: data.country,
      ...(data.specialization && { specialization: data.specialization }),
      ...(data.experience !== undefined && { experience: data.experience }),
      ...(data.gender && { gender: data.gender }),
      ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
    };

    console.log('Profile update data:', profileUpdateData);

    const response = await Api.put<APIResponse>(profileEndpoint, profileUpdateData, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });

    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Profile updated successfully",
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