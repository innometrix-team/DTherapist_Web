import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IAdminFlag {
  _id: string;
  clientId: {
    _id: string;
    fullName: string;
    email: string;
  };
  therapistId: {
    _id: string;
    fullName: string;
    email: string;
  };
  bookingId: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  note: string;
  status: "pending" | "reviewed" | "dismissed";
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminFlagsData {
  flags: IAdminFlag[];
}

export interface IReviewFlagPayload {
  flagId: string;
  sendEmail: boolean;
  adminNote: string;
}

interface GetFlagsAPIResponse {
  status: string;
  message: string;
  data: IAdminFlagsData;
}

interface ReviewFlagAPIResponse {
  status: string;
  message: string;
}


export async function GetAdminFlagsApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAdminFlag[]> | null> {
  try {
    const response = await Api.get<GetFlagsAPIResponse>(
      "/api/admin/flags",
      { ...config }
    );


    const flags: IAdminFlag[] =
      response.data?.data?.flags ??
      (response.data as unknown as IAdminFlagsData)?.flags ??
      [];

    return Promise.resolve({
      code: response.status,
      status: response.data?.status,
      message: response.data?.message ?? "success",
      data: flags,
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject({ code: statusCode, status, message: errorMessage });
  }
}

export async function ReviewFlagApi(
  payload: IReviewFlagPayload,
  config?: AxiosRequestConfig
): Promise<IAPIResult | null> {
  try {
    const response = await Api.patch<ReviewFlagAPIResponse>(
      "/api/admin/flags/review",
      payload,
      { ...config }
    );
    return Promise.resolve({
      code: response.status,
      status: response.data?.status,
      message: response.data?.message ?? "success",
    });
  } catch (e) {
    if (axios.isCancel(e)) return Promise.resolve(null);
    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";
    return Promise.reject({ code: statusCode, status, message: errorMessage });
  }
}