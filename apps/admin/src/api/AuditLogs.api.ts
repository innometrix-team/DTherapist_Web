import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";

export type AuditCategory = "auth" | "booking" | "payment" | "admin";
export type AuditOutcome = "success" | "failure" | "partial";

export interface IAuditLog {
  _id: string;
  createdAt: string;
  event: string;
  category: AuditCategory | string;
  outcome: AuditOutcome | string;
  actorId?: string | null;
  source?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  affectedUserId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface IAuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IAuditLogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: AuditCategory | "";
  event?: string;
  outcome?: AuditOutcome | "";
  actorId?: string;
  targetId?: string;
  affectedUserId?: string;
  from?: string;
  to?: string;
}

export interface IAuditLogsResult {
  logs: IAuditLog[];
  pagination: IAuditLogPagination;
}

interface AuditLogsEnvelope {
  status: string;
  message?: string;
  data: IAuditLog[];
  pagination?: IAuditLogPagination;
}

export async function getAuditLogsApi(
  query: IAuditLogsQuery = {},
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAuditLogsResult> | null> {
  const page = query.page ?? 1;
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.category) params.set("category", query.category);
  if (query.event?.trim()) params.set("event", query.event.trim());
  if (query.outcome) params.set("outcome", query.outcome);
  if (query.actorId?.trim()) params.set("actorId", query.actorId.trim());
  if (query.targetId?.trim()) params.set("targetId", query.targetId.trim());
  if (query.affectedUserId?.trim()) {
    params.set("affectedUserId", query.affectedUserId.trim());
  }
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  try {
    const response = await Api.get<AuditLogsEnvelope>(
      `/api/admin/audit-logs?${params.toString()}`,
      config
    );
    const logs = Array.isArray(response.data.data) ? response.data.data : [];
    const pagination: IAuditLogPagination = response.data.pagination ?? {
      page,
      limit,
      total: logs.length,
      totalPages: 1,
    };
    return {
      code: response.status,
      status: response.data.status ?? "success",
      message: response.data.message ?? "Audit logs loaded",
      data: { logs, pagination },
    };
  } catch (e) {
    if (axios.isCancel(e)) return null;
    const axiosErr = e as AxiosError<{ status?: string; message?: string }>;
    const statusCode = axiosErr.response?.status || 0;
    const errorMessage =
      axiosErr.response?.data?.message ||
      (e instanceof Error ? e.message : "Failed to load audit logs") ||
      "Failed to load audit logs";
    const status = axiosErr.response?.data?.status || "error";
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}
