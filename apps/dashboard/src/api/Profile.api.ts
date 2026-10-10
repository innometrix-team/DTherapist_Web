import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest } from "./Api";
import { STORE_KEYS } from "../configs/store.config";
import { AuthState } from "../store/auth/types";
import { StoreResult } from "../store/types";

export interface IProfile {
  _id: string;
  userId: string;
  status: string;
  profilePicture?: string;
  fullName: string;
  email: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  country?: string;
  gender?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IProfileUpdateData {
  fullName: string;
  bio: string;
  specialization?: string;
  experience?: number;
  country: string;
  gender?: string;
  phoneNumber?: string;
  profilePicture?: File;
}

export interface IProfileUpdateResponseData {
  id: string;
  fullName: string;
  email: string;
  bio: string;
  specialization?: string;
  experience?: number;
  country: string;
  gender?: string;
  profilePicture?: string;
  phoneNumber?: string;
  updatedAt: string;
  token: string;
}

interface UserProfileAPIResponse {
  profile: IProfile;
}

interface CounselorProfileAPIResponse {
  profile: IProfile;
}

interface APIResponse<T = UserProfileAPIResponse | CounselorProfileAPIResponse> {
  status: string;
  message: string;
  data: T;
}

function getAuthFromStorage(): AuthState | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORE_KEYS.AUTH);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreResult<AuthState>;
        return parsed?.state || null;
      }
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
  if (!data.fullName?.trim() || !data.country?.trim()) {
    throw new Error('Required fields (fullName, country) are missing or empty');
  }
}

function createProfileFormData(data: IProfileUpdateData, isTherapist: boolean): FormData {
  const formData = new FormData();
  formData.append('fullName', data.fullName.trim());
  formData.append('bio', data.bio || '');
  formData.append('country', data.country.trim());
  formData.append('phoneNumber', data.phoneNumber?.trim() || '');

  if (isTherapist) {
    formData.append('specialization', data.specialization?.trim() || '');
    if (typeof data.experience === 'number' && !isNaN(data.experience)) {
      formData.append('experience', String(data.experience));
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

type ProfilePayload = UserProfileAPIResponse | CounselorProfileAPIResponse | IProfile;

export async function getProfile(
  userType: "user" | "counselor",
  config?: AxiosRequestConfig
): Promise<IAPIResult<IProfile> | null> {
  const endpoint = userType === "user" ? '/api/user' : '/api/profile';
  return handleApiRequest<ProfilePayload, IProfile>(
    () => Api.get<APIResponse<ProfilePayload>>(endpoint, config),
    (raw) => {
      if (raw && typeof raw === 'object' && 'profile' in raw) {
        return raw.profile;
      }
      return raw;
    }
  );
}

export async function updateProfile(
  data: IProfileUpdateData,
  config?: AxiosRequestConfig,
  userRole?: string
): Promise<IAPIResult<IProfileUpdateResponseData> | null> {
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
    headers: { ...config?.headers },
    timeout: 30000,
  };

  if (requestConfig.headers) {
    delete requestConfig.headers['Content-Type'];
  }

  return handleApiRequest<IProfileUpdateResponseData>(() =>
    Api.patch(endpoint, formData, requestConfig)
  );
}

// Backward-compatible default export
export default getProfile;
