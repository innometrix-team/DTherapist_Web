import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ShieldAlert,
  Trash2,
  CheckCircle2,
  X,
  MessageSquareWarning,
  User,
  Clock,
  Hash,
  Flag,
} from "lucide-react";
import AdminModerationApi, {
  IAdminModerationReport,
  ReviewReportApi,
  DeleteReportApi,
} from "../../api/AdminModeration.api";

// ── Helpers ───────────────────────────────────────────────────────────────────
// messageId may arrive as a populated object OR a raw string ID
// depending on whether the backend populates the field.
function getMessageId(
  messageId: IAdminModerationReport["messageId"]
): string | null {
  if (!messageId) return null;
  if (typeof messageId === "string") return messageId || null;
  return messageId._id || null;
}

function getMessageContent(
  messageId: IAdminModerationReport["messageId"]
): string {
  if (!messageId || typeof messageId === "string") return "N/A";
  return messageId.content || "N/A";
}

function getMessageCreatedAt(
  messageId: IAdminModerationReport["messageId"]
): string {
  if (!messageId || typeof messageId === "string") return "";
  return messageId.createdAt || "";
}

// Reports grouped by the message that was flagged
interface GroupedReport {
  messageId: IAdminModerationReport["messageId"];
  groupId: string;
  reports: IAdminModerationReport[];
}

const AdminModeration: React.FC = () => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [reviewTarget, setReviewTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const {
    data: moderationData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-moderation-reports"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return AdminModerationApi({ signal: controller.signal });
    },
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: markReviewed, isPending: reviewing } = useMutation({
    mutationFn: (reportId: string) => ReviewReportApi(reportId),
    onSuccess: () => {
      toast.success("Report marked as reviewed");
      setReviewTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-reports"] });
    },
    onError: (e: Error) =>
      toast.error(e?.message || "Failed to mark as reviewed"),
  });

  const { mutate: deleteMessage, isPending: deleting } = useMutation({
    mutationFn: (reportId: string) => DeleteReportApi(reportId),
    onSuccess: () => {
      toast.success("Message deleted successfully");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-reports"] });
    },
    onError: (e: Error) =>
      toast.error(e?.message || "Failed to delete message"),
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (error)
      toast.error("Failed to load moderation reports. Please try again.");
  }, [error]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const { groupedReports, totalCount } = useMemo(() => {
    
    const rawReports: IAdminModerationReport[] = 
  (moderationData?.data as unknown as IAdminModerationReport[]) ?? [];
const count: number = moderationData?.data?.count ?? rawReports.length;
    const map = new Map<string, GroupedReport>();

    for (const report of rawReports) {
      // FIX: messageId can be a string ID or a populated object — handle both
      const msgId = getMessageId(report.messageId);

      // FIX: if msgId is null we still show the report grouped under a fallback key
      const groupKey = msgId ?? `fallback-${report._id}`;

      if (map.has(groupKey)) {
        map.get(groupKey)!.reports.push(report);
      } else {
        map.set(groupKey, {
          messageId: report.messageId,
          groupId: report.groupId,
          reports: [report],
        });
      }
    }

    return { groupedReports: Array.from(map.values()), totalCount: count };
  }, [moderationData]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white space-y-4 sm:space-y-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Content Moderation</h2>
            <p className="text-xs text-gray-500 mt-0.5">Review and act on flagged messages</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">Pending Reports:</span>
            <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mx-4 sm:mx-6" />

      {/* Content */}
      <div className="min-h-[300px] sm:min-h-[500px] px-4 sm:px-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
            <span className="ml-2 text-gray-600 text-sm">Loading reports…</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-red-600 mb-4">Failed to load reports</p>
            <button
              onClick={() => refetch()}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        ) : groupedReports.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquareWarning className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No pending reports</p>
            <p className="text-gray-400 text-sm mt-1">All reported content has been reviewed.</p>
          </div>
        ) : (
          <>
            {/* ── Mobile Card View ─────────────────────────────────────── */}
            <div className="block sm:hidden space-y-4">
              {groupedReports.map((group) => {
                const msgId = getMessageId(group.messageId) ?? "unknown";
                const content = getMessageContent(group.messageId);
                const createdAt = getMessageCreatedAt(group.messageId);

                return (
                  <div
                    key={msgId}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="mb-3">
                      <div className="flex items-start gap-2 mb-1">
                        <MessageSquareWarning className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-800 break-words line-clamp-3">
                          {content}
                        </p>
                      </div>
                      {createdAt && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 ml-6">
                          <Clock className="w-3 h-3" />
                          {formatDate(createdAt)}
                        </div>
                      )}
                    </div>

                    {group.reports.length > 1 && (
                      <div className="flex items-center gap-1.5 mb-3 ml-6">
                        <Flag className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-medium text-orange-600">
                          Reported {group.reports.length} times
                        </span>
                      </div>
                    )}

                    {group.reports.map((report, i) => (
                      <div
                        key={report._id}
                        className={`space-y-1.5 mb-3 ${i > 0 ? "pt-3 border-t border-gray-200" : ""}`}
                      >
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Reason:</span>
                          <span className="font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded capitalize">
                            {report.reason || "N/A"}
                          </span>
                        </div>
                        {report.description && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Description:</span>
                            <span className="text-gray-700 text-right max-w-[60%]">
                              {report.description}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Reporter:</span>
                          <span className="font-medium text-gray-800">
                            {report.reporterId?.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Role:</span>
                          <span className="capitalize font-medium text-gray-800">
                            {report.reporterId?.role || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Reported At:</span>
                          <span className="text-gray-700">{formatDate(report.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => setReviewTarget(report._id)}
                            disabled={reviewing || deleting}
                            className="px-3 py-1.5 text-xs border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
                          </button>
                          <button
                            onClick={() => setDeleteTarget(report._id)}
                            disabled={reviewing || deleting}
                            className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded hover:bg-rose-50 inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* ── Desktop Table View ────────────────────────────────────── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported Message
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason / Description
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported At
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedReports.map((group) => {
                    const msgId = getMessageId(group.messageId) ?? "unknown";
                    const content = getMessageContent(group.messageId);
                    const createdAt = getMessageCreatedAt(group.messageId);

                    return group.reports.map((report, i) => (
                      <tr
                        key={report._id}
                        className={`hover:bg-gray-50 ${
                          i === group.reports.length - 1
                            ? "border-b-2 border-gray-300"
                            : "border-b border-gray-100"
                        }`}
                      >
                        {i === 0 ? (
                          <td
                            className="py-4 px-6 max-w-xs align-top"
                            rowSpan={group.reports.length}
                          >
                            <div className="flex items-start gap-2">
                              <MessageSquareWarning className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm text-gray-800 line-clamp-2 break-words">
                                  {content}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                  <Hash className="w-3 h-3" />
                                  <span className="font-mono truncate max-w-[120px]">
                                    {msgId}
                                  </span>
                                </div>
                                {createdAt && (
                                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(createdAt)}
                                  </div>
                                )}
                                {group.reports.length > 1 && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Flag className="w-3 h-3 text-orange-500" />
                                    <span className="text-xs font-medium text-orange-600">
                                      {group.reports.length} reports
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        ) : null}

                        <td className="py-4 px-6 align-top">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 capitalize">
                            {report.reason || "N/A"}
                          </span>
                          {report.description && (
                            <p className="text-xs text-gray-500 mt-1.5 max-w-[180px]">
                              {report.description}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-6 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {report.reporterId?.email || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {report.reporterId?.role || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 align-top">
                          <div className="text-sm text-gray-600">
                            {formatDate(report.createdAt)}
                          </div>
                        </td>

                        <td className="py-4 px-6 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReviewTarget(report._id)}
                              disabled={reviewing || deleting}
                              title="Mark report as reviewed"
                              className="px-3 py-1.5 text-xs border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
                            </button>
                            <button
                              onClick={() => setDeleteTarget(report._id)}
                              disabled={reviewing || deleting}
                              title="Delete flagged message"
                              className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded hover:bg-rose-50 inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Message
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Mark Reviewed Confirm Dialog */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewTarget(null)} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">Mark as Reviewed</h3>
              </div>
              <button onClick={() => setReviewTarget(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to mark this report as reviewed? The report will be dismissed
              and no further action will be taken on the message.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewTarget(null)}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (reviewTarget) markReviewed(reviewTarget); }}
                disabled={reviewing}
                className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {reviewing ? "Marking…" : "Mark as Reviewed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-semibold">Delete Message</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to permanently delete this message? This action cannot be
              undone and the message will be removed from the chat for all participants.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Keep Message
              </button>
              <button
                onClick={() => { if (deleteTarget) deleteMessage(deleteTarget); }}
                disabled={deleting}
                className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;