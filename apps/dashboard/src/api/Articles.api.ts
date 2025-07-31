import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IArticle {
  _id: string;
  title: string;
  body: string; // Made required again since content is necessary
  category: string;
  image: string;
  createdAt: string;
}

interface IArticlesResponse {
  status: string;
  message: string;
  data: IArticle[];
}

interface ISingleArticleResponse {
  status: string;
  message: string;
  data: IArticle;
}

// Get all articles
export async function getAllArticlesApi(config?: AxiosRequestConfig): Promise<IAPIResult<IArticle[]> | null> {
  try {
    const response = await Api.get<IArticlesResponse>('/api/articles', {
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

// Get articles by category
export async function getArticlesByCategoryApi(category: string, config?: AxiosRequestConfig): Promise<IAPIResult<IArticle[]> | null> {
  try {
    const response = await Api.get<IArticlesResponse>(`/api/articles/category/${encodeURIComponent(category)}`, {
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

// Get single article by ID
export async function getArticleByIdApi(id: string, config?: AxiosRequestConfig): Promise<IAPIResult<IArticle> | null> {
  try {
    const response = await Api.get<ISingleArticleResponse>(`/api/articles/${id}`, {
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

// Get unique categories from articles
export async function getCategoriesApi(config?: AxiosRequestConfig): Promise<IAPIResult<string[]> | null> {
  try {
    // First get all articles to extract categories
    const articlesResponse = await getAllArticlesApi(config);
    if (!articlesResponse?.data) {
      return Promise.resolve({
        code: 200,
        status: "success",
        message: "No categories found",
        data: []
      });
    }

    // Extract unique categories
    const categories = Array.from(new Set(
      articlesResponse.data
        .map(article => article.category)
        .filter(category => category && category.trim() !== '')
    ));

    return Promise.resolve({
      code: 200,
      status: "success", 
      message: "Categories fetched successfully",
      data: categories
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