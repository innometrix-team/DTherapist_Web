import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api,  { IAPIResult } from "./Api";

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

export interface IMessage {
  content: string;
  createdAt: string;
  userId: string;
  _id: string;
  groupId: string;
}

interface GroupMessagesAPIResponse {
  message: string;
  messages: IMessage[];
}

interface ISendGroupMessageRequestData {
  groupId: string;
  content: string;
}

interface IMessageData {
  content: string;
  groupId: string;
  createdAt: string;
}

interface SendGroupMessageApiResponse {
  message: string;
  data: IMessageData;
}


export async function GetGroupsApi(config?: AxiosRequestConfig): Promise<IAPIResult<IGroup[]> | null> {
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

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}



export async function JoinGroupApi(groupId: string, config?: AxiosRequestConfig): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.post<GetGroupsApiResponse>(`/api/group/${groupId}/join`, null, {
      ...config,
    });

    return Promise.resolve({
      code: response.status,
      status: response.status === 200 || response.status === 201 ? "success" : "error",
      message: response.data.message ?? "Joined group successfully",
      data: response.data.message,
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";

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

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}


export  async function SendGroupMessageApi(
  data: ISendGroupMessageRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IMessageData> | null> {
  try {
    const response = await Api.post<SendGroupMessageApiResponse>(
      `/api/group/${data.groupId}/message`,
      { content: data.content },
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

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status =
      (e as AxiosError<IAPIResult>).response?.data.status || "error";

    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}