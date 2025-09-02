import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IProfileUpdateData {
  fullName: string;
  bio: string;
  specialization?: string;
  experience?: number;
  country: string;
  gender?: string;
  profilePicture?: File;
}

interface RequestData {
  data: IProfileUpdateData;
  userID: string;
  role: "client" | "therapist" | "counselor"
}

interface IResponseData {
  id: string;
  fullName: string;
  email: string; // Keep in response for auth purposes
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
  if (!data.fullName?.trim() || !data.country?.trim()) {
    throw new Error('Required fields (fullName, country) are missing or empty');
  }
}

function createProfileFormData(data: IProfileUpdateData, isTherapist: boolean): FormData {
  const formData = new FormData();

  formData.append('fullName', data.fullName.trim());
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

  if (data.profilePicture && data.profilePicture instanceof File) {
    validateProfilePicture(data.profilePicture);
    formData.append('profilePicture', data.profilePicture, data.profilePicture.name);
  }

  return formData;
}


export default async function ProfileUpdateApi(
  data: RequestData,
  config?: AxiosRequestConfig,
): Promise<IAPIResult<IResponseData> | null> {
  try {
    validateRequiredFields(data.data);

 const {role} = data
  

    const isTherapist = role === "therapist" || role === "counselor";

    const formData = createProfileFormData(data.data, isTherapist);
    
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

    const response = await Api.put<APIResponse>(`/api/admin/users/${data.userID}`, formData, requestConfig);

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

export async function ReviewCertificationApi(
  params: {
  userId: string;
  status: "approved" | "rejected";
  note?: string;
  },
  config?: AxiosRequestConfig,
): Promise<IAPIResult<IResponseData> | null> {
  try {


    const response = await Api.put<APIResponse>(`/api/admin/users/certifications/${params.userId}`, {
      status: params.status,
      note: params.note ?? ''
    }, config);

    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Certificate status updated",
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

export async function ReviewCVApi(
  params: {
  userId: string;
  status: "approved" | "rejected";
  note?: string;
  },
  config?: AxiosRequestConfig,
): Promise<IAPIResult<IResponseData> | null> {
  try {


    const response = await Api.put<APIResponse>(`/api/admin/users/cvs/${params.userId}`, {
      status: params.status,
      note: params.note ?? ''
    }, config);

    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "CV status updated",
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


// PUT /api/admin/users/{id}/profile-picture  (multipart/form-data, field: profilePicture)
export async function UploadProfilePictureApi(
  params: { userId: string; profilePicture: File },
  config?: AxiosRequestConfig
): Promise<IAPIResult<IResponseData> | null> {
  try {
    const form = new FormData();
    form.append("profilePicture", params.profilePicture);

    const response = await Api.put<APIResponse>(
      `/api/admin/users/${params.userId}/profile-picture`,
      form,
      {
        ...(config || {}),
        headers: {
          ...(config?.headers || {}),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Profile picture uploaded",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message ||
      "An error occurred while uploading profile picture";
    const status =
      (e as AxiosError<IAPIResult>).response?.data?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// DELETE /api/admin/users/{id}/profile-picture
export async function RemoveProfilePictureApi(
  params: { userId: string },
  config?: AxiosRequestConfig
): Promise<IAPIResult<IResponseData> | null> {
  try {
    const response = await Api.delete<APIResponse>(
      `/api/admin/users/${params.userId}/profile-picture`,
      config
    );

    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "Profile picture removed",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data?.message ||
      (e as Error).message ||
      "An error occurred while removing profile picture";
    const status =
      (e as AxiosError<IAPIResult>).response?.data?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}