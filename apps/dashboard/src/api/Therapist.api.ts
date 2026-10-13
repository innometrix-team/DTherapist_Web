import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest } from "./Api";

export interface ITherapist {
  id: string;
  name: string;
  email?: string;
  profilePicture: string;
  category: string;
  experience: number;
  cost: {
    video: number;
    inPerson: number;
    groupVideo: number;
  } | number | null;
  about?: string;
  specializations?: string[];
  availability?: {
    [key: string]: string[];
  };
  reviews: {
    averageRating: number | null;
    totalReviews: number;
    count?: number;
  };
  userId: string;
}

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

export interface ITherapistListResponse {
  therapists: ITherapist[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface ICategoriesResponse {
  categories: string[];
}

export interface ITherapistDetailResponse {
  therapist: ITherapist;
}

interface APIResponse<T> {
  status?: string;
  message?: string;
  data?: T;
}

type TherapistListPayload = APIResponse<ITherapistListResponse> | ITherapistListResponse;

function extractTherapistList(res: TherapistListPayload): ITherapistListResponse {
  if (res && typeof res === 'object') {
    if ('data' in res && res.data) {
      return res.data;
    }
    if ('therapists' in res) {
      return res;
    }
  }
  return {
    therapists: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
  };
}

type TherapistDetailPayload =
  | APIResponse<ITherapistDetailResponse>
  | ITherapistDetailResponse
  | ITherapist;

function extractTherapistDetail(res: TherapistDetailPayload): ITherapistDetailResponse {
  if (res && typeof res === 'object') {
    if ('data' in res && res.data) {
      return res.data;
    }
    if ('therapist' in res) {
      return res;
    }
    if ('id' in res) {
      return { therapist: res };
    }
  }
  return { therapist: res as unknown as ITherapist };
}

export const getCategoriesApi = (
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICategoriesResponse> | null> =>
  handleApiRequest<ICategoriesResponse>(() =>
    Api.get<ICategoriesResponse>('/api/user/counselors/categories', config)
  );

export const getTherapistsByCategoryApi = (
  category: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistListResponse> | null> =>
  handleApiRequest<TherapistListPayload, ITherapistListResponse>(
    () =>
      Api.get<TherapistListPayload>(
        `/api/user/counselors/categories/${encodeURIComponent(category)}`,
        config
      ),
    extractTherapistList
  );

export const getTherapistsApi = (
  params?: ITherapistListParams,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistListResponse> | null> => {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append('category', params.category);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const url = queryString ? `/api/user/counselors?${queryString}` : '/api/user/counselors';

  return handleApiRequest<TherapistListPayload, ITherapistListResponse>(
    () => Api.get<TherapistListPayload>(url, config),
    extractTherapistList
  );
};

export const getTherapistDetailsApi = (
  therapistId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITherapistDetailResponse> | null> =>
  handleApiRequest<TherapistDetailPayload, ITherapistDetailResponse>(
    () =>
      Api.get<TherapistDetailPayload>(
        `/api/user/counselors/${encodeURIComponent(therapistId)}`,
        config
      ),
    extractTherapistDetail
  );

export function convertCategoriesToObjects(categories: string[]): ICategory[] {
  return categories.map((categoryName) => ({
    id: categoryName.toLowerCase().replace(/\s+/g, '-'),
    name: categoryName,
    description: `${categoryName} counseling services`,
  }));
}