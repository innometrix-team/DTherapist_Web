import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";


export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'counselor' | 'client' | 'therapist';
  isSuspended: boolean;
  profilePicture?: string;
  alias: string;
}

export interface IUserProfile {
  id: string;
  fullName: string;
  bio: string;
  country: string;
  profilePicture: string;
  status: string;
  areaOfSpecialization: string;
  yearsOfExperience: number;
}

export interface ICertificate {
  _id: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  cvUrl: string;
  cvStatus: string;
  cvNote?: string;
  certificationUrl: string;
  certificationStatus: string;
  certificationNote?: string;
}

interface GetUsersApiResponse {
    status: string;
    message: string;
    data: IUser[]
}

interface GetUserCertificateApiResponse {
    status: string;
    message: string;
    data: ICertificate
}

interface DeleteUserApiResponse {
    status: string;
    message: string;
}

interface GetUserProfileApiResponse {
    status: string;
    message: string;
    data: IUserProfile
}

export async function GetAllUsersApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IUser[]> | null> {
  try {
    
    const response = await Api.get<GetUsersApiResponse>( "/api/admin/users", {
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

export async function GetUserDetailApi(
    id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IUserProfile> | null> {
  try {
    
    const response = await Api.get<GetUserProfileApiResponse>( `/api/admin/users/${id}`, {
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

export async function GetUserCertificationsApi(
    id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICertificate> | null> {
  try {
    
    const response = await Api.get<GetUserCertificateApiResponse>( `/api/admin/users/certifications/${id}`, {
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

export async function DeleteUserApi(
    id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult | null> {
  try {
    
    const response = await Api.delete<DeleteUserApiResponse>( `/api/admin/users/${id}`, {
      ...config,
    });
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
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
