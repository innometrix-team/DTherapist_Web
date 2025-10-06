import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IGroup {
  _id: string;
  name: string;
  description: string;
  image: string;
  createdAt: string;
}

interface APIResponse {
  status: string;
  message: string;
  data: IGroup[];
}

interface GetGroupsApiResponse {
  message: string;
}

interface IGroupMessagesRequestData {
  groupId: string;
}

// Updated reply structure
export interface IReplyTo {
  _id: string;
  alias?: string;
  content: string;
}

export interface IMessage {
  _id: string;
  content: string;
  createdAt: string;
  senderId: string; // Changed from userId to senderId to match actual API response
  groupId: string;
  alias?: string;
  replyTo?: IReplyTo | null; // Changed from string to IReplyTo object
}

interface GroupMessagesAPIResponse {
  message: string;
  messages: IMessage[];
}

interface ISendGroupMessageRequestData {
  groupId: string;
  content: string;
  replyTo?: string | null;
}

interface IMessageData {
  content: string;
  groupId: string;
  createdAt: string;
  replyTo?: string | null;
}

interface SendGroupMessageApiResponse {
  message: string;
  data: IMessageData;
}

// Define an interface for error response data
interface ErrorResponseData {
  error?: string;
  message?: string;
  status?: string;
}

// Helper function to extract error message from response
function getErrorMessage(error: AxiosError): string {
  const responseData = error.response?.data as ErrorResponseData;

  // Check for different error message formats
  if (responseData?.error) {
    return responseData.error;
  }
  if (responseData?.message) {
    return responseData.message;
  }

  // Fallback to default error message
  return error.message || "An unexpected error occurred";
}

export async function GetGroupsApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<IGroup[]> | null> {
  try {
    const response = await Api.get<APIResponse>("/api/group/getGroups", {
      ...config,
    });

    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message ?? "success",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const axiosError = e as AxiosError;
    const statusCode = axiosError.response?.status || 0;
    const errorMessage = getErrorMessage(axiosError);
    const status =
      (axiosError.response?.data as ErrorResponseData)?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

export async function JoinGroupApi(
  groupId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.post<GetGroupsApiResponse>(
      `/api/group/${groupId}/join`,
      null,
      {
        ...config,
      }
    );

    return Promise.resolve({
      code: response.status,
      status:
        response.status === 200 || response.status === 201
          ? "success"
          : "error",
      message: response.data.message ?? "Joined group successfully",
      data: response.data.message,
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const axiosError = e as AxiosError;
    const statusCode = axiosError.response?.status || 0;
    const errorMessage = getErrorMessage(axiosError);
    const status =
      (axiosError.response?.data as ErrorResponseData)?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

export async function GetGroupMessagesApi(
  data: IGroupMessagesRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IMessage[]> | null> {
  try {
    const response = await Api.get<GroupMessagesAPIResponse>(
      `/api/group/${data.groupId}/messages`,
      {
        ...config,
      }
    );

    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "Group messages fetched",
      data: response.data.messages,
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const axiosError = e as AxiosError;
    const statusCode = axiosError.response?.status || 0;
    const errorMessage = getErrorMessage(axiosError);
    const status =
      (axiosError.response?.data as ErrorResponseData)?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

export async function SendGroupMessageApi(
  data: ISendGroupMessageRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IMessageData> | null> {
  try {
    const payload: { content: string; replyTo?: string | null } = {
      content: data.content,
    };

    // Only include replyTo if it exists
    if (data.replyTo) {
      payload.replyTo = data.replyTo;
    }

    const response = await Api.post<SendGroupMessageApiResponse>(
      `/api/group/${data.groupId}/message`,
      payload,
      {
        ...config,
      }
    );

    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "Message sent",
      data: response.data.data,
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const axiosError = e as AxiosError;
    const statusCode = axiosError.response?.status || 0;
    const errorMessage = getErrorMessage(axiosError);
    const status =
      (axiosError.response?.data as ErrorResponseData)?.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}