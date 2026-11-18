import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";


export interface IProfessionalCategoryRequest {
  requestId?: string;
  _id?: string;
  id?: string;
  status: "pending" | "approved" | "rejected";
  professionalCategory?: "counselor" | "psychologist";
  requestedCategory?: "counselor" | "psychologist";
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'counselor' | 'client' | 'therapist';
  isSuspended: boolean;
  profilePicture?: string;
  alias: string;
  createdAt?: string;
  professionalCategory?: "counselor" | "psychologist";
  professionalCategoryRequest?: IProfessionalCategoryRequest | null;
  professionalCategoryRequestStatus?: "pending" | "approved" | "rejected" | null;
}

export type UserListItem = Omit<IUser, "role"> & {
  role: string;
};

export interface IUserProfile {
  id: string;
  _id?: string;
  fullName: string;
  bio: string;
  country: string;
  phoneNumber: string;
  profilePicture: string;
  status: string;
  areaOfSpecialization?: string;
  yearsOfExperience?: number;
  role?: 'admin' | 'counselor' | 'client' | 'therapist';
  createdAt?: string;
  professionalCategory?: "counselor" | "psychologist";
  professionalCategoryRequest?: IProfessionalCategoryRequest | null;
  professionalCategoryRequestStatus?: "pending" | "approved" | "rejected" | null;
}

export interface ICertificateCompliance {
  status?: string;
  canAcceptNewBookings?: boolean;
  provisionalStartedAt?: string | null;
  provisionalDeadline?: string | null;
  transitionNoticePending?: boolean;
}

export interface ICertificate {
  _id: string;
  userId: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  cvUrl: string;
  cvStatus: string;
  cvNote?: string;
  certificationUrl: string;
  certificationStatus: string;
  certificationNote?: string;
  professionalBodyCertificateUrl?: string;
  professionalBodyCertificateStatus?: string;
  professionalBodyCertificateNote?: string;
  compliance?: ICertificateCompliance;
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

export interface GetAllUsersParams {
  professionalCategory?: "counselor" | "psychologist";
  professionalCategoryRequestStatus?: "pending" | "approved" | "rejected";
  role?: string;
  search?: string;
  isSuspended?: boolean | string;
}

export async function GetAllUsersApi(
  paramsOrConfig?: GetAllUsersParams | AxiosRequestConfig,
  optionalConfig?: AxiosRequestConfig
): Promise<IAPIResult<IUser[]> | null> {
  try {
    const isConfig =
      paramsOrConfig &&
      ("headers" in paramsOrConfig ||
        "signal" in paramsOrConfig ||
        "timeout" in paramsOrConfig);

    const params = isConfig ? undefined : paramsOrConfig;
    const config = isConfig ? paramsOrConfig : optionalConfig;

    const response = await Api.get<GetUsersApiResponse>("/api/admin/users", {
      params,
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
    
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

export interface IReviewProfessionCategoryRequestPayload {
  requestId: string;
  status: "approved" | "rejected";
  note?: string;
}

export async function ReviewProfessionCategoryRequestApi(
  userId: string,
  data: IReviewProfessionCategoryRequestPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult<{ message?: string }> | null> {
  try {
    const response = await Api.patch<{ status: string; message: string }>(
      `/api/admin/users/${userId}/professional-category-request`,
      data,
      config
    );

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
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data?.status || "error";

    return Promise.reject(new ApiError(errorMessage, statusCode, status));
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
    
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
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
    
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
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
    
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}
