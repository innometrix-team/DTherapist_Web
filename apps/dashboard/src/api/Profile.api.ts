import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IProfile {
  _id: string;
  userId: string;
  status: string;
  profilePicture?: string; // Make optional to match API response
  fullName: string;
  email: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  country?: string;
  gender?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// User API response interface
interface UserProfileAPIResponse {
  profile: {
    _id: string;
    userId: string;
    status: string;
    profilePicture?: string;
    fullName: string;
    email: string;
    bio?: string;
    country?: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

// Counselor API response interface
interface CounselorProfileAPIResponse {
  profile: IProfile;
}

interface APIResponse<T = UserProfileAPIResponse | CounselorProfileAPIResponse> {
  status: string;
  message: string;
  data: T;
}

export default async function ProfileApi(
  userType: "user" | "counselor", 
  config?: AxiosRequestConfig
): Promise<IAPIResult<IProfile> | null> {
  try {
    const endpoint = userType === "user" 
      ? '/api/user' 
      : '/api/profile';
    
    const response = await Api.get<APIResponse>(endpoint, {
      ...config,
    });
    
    let transformedData: IProfile;

    if (userType === "user") {
      // Handle user response format - also wrapped in profile object
      const userData = response.data.data as UserProfileAPIResponse;
      transformedData = userData.profile;
    } else {
      // Handle counselor/service-provider response format
      const counselorData = response.data.data as CounselorProfileAPIResponse;
      transformedData = counselorData.profile;
    }
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: transformedData
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