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
  userId: string; // Changed from senderId to userId to match API response
  groupId?: string;
  alias?: string;
  replyTo?: IReplyTo | null;
  isOwnMessage?: boolean; // This will be computed on the client side
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
  _id: string;
  content: string;
  groupId: string;
  userId: string;
  alias?: string;
  createdAt: string;
  updatedAt: string;
  replyTo?: string | null;
  isOwnMessage?: boolean; // This will be computed on the client side
  __v?: number;
}

interface SendGroupMessageApiResponse {
  message: string;
  data: IMessageData;
}

// Report message interface
interface IReportMessageRequestData {
  groupId: string;
  _id: string;
  reason: string;
  description: string;
}

interface ReportMessageApiResponse {
  message: string;
}

// Block/Unblock user interface
interface IBlockUserRequestData {
  userId: string;
}

interface BlockUserApiResponse {
  message: string;
}

// Delete message interface
interface IDeleteMessageRequestData {
  groupId: string;
  _id: string;
}

interface DeleteMessageApiResponse {
  message: string;
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

export async function ReportGroupMessageApi(
  data: IReportMessageRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const payload = {
      reason: data.reason,
      description: data.description,
    };

    const response = await Api.post<ReportMessageApiResponse>(
      `/api/group/${data.groupId}/messages/${data._id}/report`,
      payload,
      {
        ...config,
      }
    );

    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "Message reported successfully",
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

export async function BlockUserApi(
  data: IBlockUserRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.post<BlockUserApiResponse>(
      `/api/group/block/${data.userId}`,
      null,
      {
        ...config,
      }
    );

    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "User blocked successfully",
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

export async function UnblockUserApi(
  data: IBlockUserRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.delete<BlockUserApiResponse>(
      `/api/group/block/${data.userId}`,
      {
        ...config,
      }
    );

    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "User unblocked successfully",
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

export async function DeleteOwnMessageApi(
  data: IDeleteMessageRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.delete<DeleteMessageApiResponse>(
      `/api/group/groups/${data.groupId}/messages/${data._id}`,
      {
        ...config,
      }
    );

    return Promise.resolve({
      code: response.status,
      status: "success",
      message: response.data.message ?? "Message deleted successfully",
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