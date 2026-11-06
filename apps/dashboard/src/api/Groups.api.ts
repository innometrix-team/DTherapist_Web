import { AxiosRequestConfig } from "axios";
import { z } from "zod";
import Api, { IAPIResult, handleApiRequest } from "./Api";

// Zod Schemas for Runtime Validation
export const GroupSchema = z.object({
  _id: z.string(),
  name: z.string().default(""),
  description: z.string().default(""),
  image: z.string().default(""),
  createdAt: z.string().default(""),
});

export type IGroup = z.infer<typeof GroupSchema>;
export const GroupsArraySchema = z.array(GroupSchema);

export const ReplyToSchema = z.object({
  _id: z.string(),
  alias: z.string().optional(),
  content: z.string(),
});

export type IReplyTo = z.infer<typeof ReplyToSchema>;

export const MessageUserIdSchema = z.preprocess((val) => {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj._id === "string") return obj._id;
    if (typeof obj.id === "string") return obj.id;
  }
  return "";
}, z.string().default(""));

export const MessageSchema = z.object({
  _id: z.string(),
  content: z.string().default(""),
  createdAt: z.string().default(""),
  userId: MessageUserIdSchema,
  groupId: z.string().optional(),
  alias: z.string().optional(),
  replyTo: ReplyToSchema.nullable().optional(),
  isOwnMessage: z.boolean().optional(),
});

export type IMessage = z.infer<typeof MessageSchema>;
export const MessagesArraySchema = z.array(MessageSchema);

export interface IGroupMessagesRequestData {
  groupId: string;
}

export interface ISendGroupMessageRequestData {
  groupId: string;
  content: string;
  replyTo?: string | null;
  parentAuthorId?: string;
}

export const MessageDataSchema = z.object({
  _id: z.string(),
  content: z.string().default(""),
  groupId: z.string().default(""),
  userId: MessageUserIdSchema,
  alias: z.string().optional(),
  createdAt: z.string().default(""),
  updatedAt: z.string().optional().default(""),
  replyTo: z.string().nullable().optional(),
  isOwnMessage: z.boolean().optional(),
  __v: z.number().optional(),
});

export type IMessageData = z.infer<typeof MessageDataSchema>;

export interface IReportMessageRequestData {
  groupId: string;
  _id: string;
  reason: string;
  description: string;
}

export interface IBlockUserRequestData {
  userId: string;
}

export interface IDeleteMessageRequestData {
  groupId: string;
  _id: string;
}

interface GroupMessagesAPIResponse {
  message?: string;
  messages: IMessage[];
}

const GroupMessagesResponseSchema = z.object({
  message: z.string().optional(),
  messages: MessagesArraySchema.default([]),
});

interface SimpleMessageResponse {
  message?: string;
  data?: string | { message?: string };
}

const extractMessage = (res: SimpleMessageResponse, fallback: string): string => {
  if (typeof res?.data === "string" && res.data.length > 0) return res.data;
  if (res?.data && typeof res.data === "object" && typeof res.data.message === "string") {
    return res.data.message;
  }
  return res?.message ?? fallback;
};

// API Functions
export const GetGroupsApi = (
  config?: AxiosRequestConfig
): Promise<IAPIResult<IGroup[]> | null> =>
  handleApiRequest<IGroup[]>(
    () => Api.get("/api/group/getGroups", config),
    undefined,
    GroupsArraySchema
  );

export const JoinGroupApi = (
  groupId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> =>
  handleApiRequest<SimpleMessageResponse, string>(
    () => Api.post(`/api/group/${groupId}/join`, {}, config),
    (raw) => extractMessage(raw, "Joined group successfully")
  );

export const GetGroupMessagesApi = (
  data: IGroupMessagesRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IMessage[]> | null> =>
  handleApiRequest<GroupMessagesAPIResponse, IMessage[]>(
    () => Api.get(`/api/group/${data.groupId}/messages`, config),
    (raw) => raw.messages ?? [],
    GroupMessagesResponseSchema
  );

export const SendGroupMessageApi = (
  data: ISendGroupMessageRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IMessageData> | null> => {
  const payload: {
    content: string;
    replyTo?: string | null;
    parentAuthorId?: string;
  } = {
    content: data.content,
  };

  if (data.replyTo) {
    payload.replyTo = data.replyTo;
  }

  if (data.parentAuthorId) {
    payload.parentAuthorId = data.parentAuthorId;
  }

  return handleApiRequest<IMessageData>(
    () => Api.post(`/api/group/${data.groupId}/message`, payload, config),
    undefined,
    MessageDataSchema
  );
};

export const ReportGroupMessageApi = (
  data: IReportMessageRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> =>
  handleApiRequest<SimpleMessageResponse, string>(
    () =>
      Api.post(
        `/api/group/${data.groupId}/messages/${data._id}/report`,
        { reason: data.reason, description: data.description },
        config
      ),
    (raw) => extractMessage(raw, "Message reported successfully")
  );

export interface IGroupBlockItem {
  blockId: string;
  alias: string;
}

export const BlockAuthorApi = (
  messageId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<{ blockId: string }> | null> =>
  handleApiRequest<{ blockId: string }>(
    () => Api.post(`/api/group/messages/${messageId}/block-author`, {}, config)
  );

export const GetGroupBlocksApi = (
  config?: AxiosRequestConfig
): Promise<IAPIResult<IGroupBlockItem[]> | null> =>
  handleApiRequest<IGroupBlockItem[]>(
    () => Api.get(`/api/group/blocks`, config)
  );

export const UnblockAuthorApi = (
  blockId: string,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> =>
  handleApiRequest<SimpleMessageResponse, string>(
    () => Api.delete(`/api/group/blocks/${blockId}`, config),
    (raw) => extractMessage(raw, "Author unblocked successfully")
  );

export const BlockUserApi = (
  data: IBlockUserRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> =>
  handleApiRequest<SimpleMessageResponse, string>(
    () => Api.post(`/api/group/block/${data.userId}`, {}, config),
    (raw) => extractMessage(raw, "User blocked successfully")
  );

export const UnblockUserApi = (
  data: IBlockUserRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> =>
  handleApiRequest<SimpleMessageResponse, string>(
    () => Api.delete(`/api/group/block/${data.userId}`, config),
    (raw) => extractMessage(raw, "User unblocked successfully")
  );

export const DeleteOwnMessageApi = (
  data: IDeleteMessageRequestData,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> =>
  handleApiRequest<SimpleMessageResponse, string>(
    () => Api.delete(`/api/group/groups/${data.groupId}/messages/${data._id}`, config),
    (raw) => extractMessage(raw, "Message deleted successfully")
  );
