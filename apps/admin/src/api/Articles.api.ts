import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

// Article interfaces
export interface IArticle {
  _id: string;
  title: string;
  body?: string;
  category: string;
  image: string;
  status: string;
  date: string;
}

export interface IArticleCreateData {
  title: string;
  body: string;
  category: string;
  image: string;
  status: "published";
}

export interface IArticleEditData {
  title: string;
  body: string;
  category: string;
  status: "published";
  image?: string; // Optional for image updates
}

export interface IImageUploadResponse {
  imageUrl: string;
}

export interface ICategoryResponse {
  categories: string[];
}

// API Response interfaces
interface ArticlesAPIResponse {
  status: string;
  message: string;
  data: IArticle[];
}

interface ArticleAPIResponse {
  status: string;
  message: string;
  data: IArticle;
}

interface ImageUploadAPIResponse {
  status: string;
  message: string;
  data: IImageUploadResponse;
}

interface CategoriesAPIResponse {
  status: string;
  message: string;
  data: ICategoryResponse;
}

interface GenericAPIResponse {
  status: string;
  message: string;
  data: Record<string, unknown>;
}

// Get all articles
export async function getArticlesApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IArticle[]> | null> {
  try {
    const endpoint = '/api/admin/articles';
    
    const response = await Api.get<ArticlesAPIResponse>(endpoint, {
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

// Get all categories
export async function getCategoriesApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICategoryResponse> | null> {
  try {
    const endpoint = '/api/admin/articles/category';
    
    const response = await Api.get<CategoriesAPIResponse>(endpoint, {
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

// Get single article
export async function getArticleApi(
  id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IArticle> | null> {
  try {
    const endpoint = `/api/admin/articles/${id}`;
    
    const response = await Api.get<ArticleAPIResponse>(endpoint, {
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

// Create article
export async function createArticleApi(
  articleData: IArticleCreateData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IArticle> | null> {
  try {
    const endpoint = '/api/admin/articles/create';
    
    const response = await Api.post<ArticleAPIResponse>(endpoint, articleData, {
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

// Edit article
export async function editArticleApi(
  id: string,
  articleData: IArticleEditData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Record<string, unknown>> | null> {
  try {
    const endpoint = `/api/admin/articles/edit/${id}`;
    
    const response = await Api.patch<GenericAPIResponse>(endpoint, articleData, {
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

// Delete article
export async function deleteArticleApi(
  id: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Record<string, unknown>> | null> {
  try {
    const endpoint = `/api/admin/articles/${id}`;
    
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
export async function uploadImageApi(
  imageFile: File,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IImageUploadResponse> | null> {
  try {
    const endpoint = '/api/admin/articles/upload-image';
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await Api.patch<ImageUploadAPIResponse>(endpoint, formData, {
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
export async function removeImageApi(
  imageUrl: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<Record<string, unknown>> | null> {
  try {
    const endpoint = '/api/admin/articles/remove-image';
    
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