import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit3,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AnnouncementAudience,
  AnnouncementChannel,
  AnnouncementStatus,
  createAnnouncementApi,
  deleteAnnouncementApi,
  getAnnouncementByIdApi,
  getAnnouncementsApi,
  IAnnouncement,
  IAnnouncementPayload,
  sendAnnouncementApi,
  updateAnnouncementApi,
} from "../../api/Announcements.api";
import { ApiError } from "../../api/Api";
import Pagination from "../../components/pagination/Pagination";
import { formatDateDDMMYYYY } from "../../utils/Date.utils";

const CHANNEL_LABELS: Record<AnnouncementChannel, string> = {
  email: "Email",
  notification: "Push and in-app",
  both: "Both",
};

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: "All (incl. admins)",
  client: "Clients",
  therapist: "Therapists",
};

const STATUS_BADGES: Record<AnnouncementStatus, string> = {
  draft: "bg-gray-100 text-gray-700 ring-gray-200",
  sending: "bg-amber-50 text-amber-700 ring-amber-200",
  sent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  partial: "bg-orange-50 text-orange-700 ring-orange-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
};

const EMPTY_FORM: IAnnouncementPayload = {
  title: "",
  message: "",
  channel: "both",
  audience: "all",
};

function isTimeoutOrConflict(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.code === 409 || err.code === 408 || err.code === 504;
  }
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return msg.includes("timeout") || msg.includes("409");
}

const Announcements: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IAnnouncementPayload>(EMPTY_FORM);
  const [confirmSendItem, setConfirmSendItem] = useState<IAnnouncement | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<IAnnouncement | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-announcements", page],
    queryFn: async () => {
      const res = await getAnnouncementsApi({ page, limit: 20 });
      if (!res?.data) throw new Error("Failed to load announcements");
      return res.data;
    },
    staleTime: 30_000,
  });

  const announcements = data?.announcements ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };

  const refreshAnnouncement = async (id: string) => {
    try {
      const latest = await getAnnouncementByIdApi(id);
      if (latest?.data) {
        setSelectedOutcome(latest.data);
      }
    } catch {
      // List invalidation below will still reconcile state
    } finally {
      void qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    }
  };

  const { mutate: saveDraft, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const trimmedTitle = form.title.trim();
      const trimmedMessage = form.message.trim();
      if (trimmedTitle.length < 1 || trimmedTitle.length > 150) {
        throw new Error("Title must be between 1 and 150 characters.");
      }
      if (trimmedMessage.length < 1 || trimmedMessage.length > 3000) {
        throw new Error("Message must be between 1 and 3,000 characters.");
      }
      const payload: IAnnouncementPayload = {
        ...form,
        title: trimmedTitle,
        message: trimmedMessage,
      };
      if (editingId) {
        return updateAnnouncementApi(editingId, payload);
      }
      return createAnnouncementApi(payload);
    },
    onSuccess: (res) => {
      const saved = res?.data;
      toast.success(editingId ? "Draft updated" : "Draft saved");
      setEditingId(saved?._id ?? null);
      if (saved) {
        setForm({
          title: saved.title,
          message: saved.message,
          channel: saved.channel,
          audience: saved.audience,
        });
      }
      void qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: async (err) => {
      if (editingId && isTimeoutOrConflict(err)) {
        await refreshAnnouncement(editingId);
        toast.error("Draft could not be updated because it is no longer a draft. Refreshed latest status.");
        setEditingId(null);
        setForm(EMPTY_FORM);
        return;
      }
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    },
  });

  const { mutate: deleteDraft, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => deleteAnnouncementApi(id),
    onSuccess: (_res, deletedId) => {
      toast.success("Draft deleted");
      if (editingId === deletedId) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      void qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: async (err, id) => {
      if (isTimeoutOrConflict(err)) {
        await refreshAnnouncement(id);
        toast.error("Announcement status changed. Refreshed latest state.");
        return;
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete draft");
    },
  });

  const { mutate: sendAnnouncement, isPending: isSending } = useMutation({
    mutationFn: async (id: string) => sendAnnouncementApi(id),
    onSuccess: (res) => {
      const result = res?.data;
      setConfirmSendItem(null);
      if (result) {
        setSelectedOutcome(result);
        if (editingId === result._id) {
          setEditingId(null);
          setForm(EMPTY_FORM);
        }
        if (result.status === "sent") {
          toast.success("Announcement sent");
        } else if (result.status === "partial") {
          toast("Announcement partially delivered", { icon: "⚠️" });
        } else if (result.status === "sending") {
          toast("Announcement is still sending", { icon: "⏳" });
        } else if (result.status === "failed") {
          toast.error("Announcement delivery failed");
        }
      }
      void qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: async (err, id) => {
      setConfirmSendItem(null);
      if (isTimeoutOrConflict(err)) {
        await refreshAnnouncement(id);
        toast("Refreshed announcement status after timeout/conflict", { icon: "ℹ️" });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Failed to send announcement");
    },
  });

  const handleEditDraft = (item: IAnnouncement) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      message: item.message,
      channel: item.channel,
      audience: item.audience,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Megaphone className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500">
              Create a draft first, then confirm and send to clients, therapists, or everyone.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-divider rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Draft Form */}
      <div className="bg-white border border-divider rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {editingId ? "Edit Draft" : "New Announcement Draft"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Start new draft
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-xs text-gray-400">({form.title.trim().length}/150)</span>
            </label>
            <input
              type="text"
              maxLength={150}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Scheduled maintenance"
              className="w-full px-3 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-xs text-gray-400">({form.message.trim().length}/3000)</span>
            </label>
            <textarea
              rows={4}
              maxLength={3000}
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Write the announcement message..."
              className="w-full px-3 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Channel</label>
            <select
              value={form.channel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, channel: e.target.value as AnnouncementChannel }))
              }
              className="w-full px-3 py-2 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="email">Email</option>
              <option value="notification">Push and in-app</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select
              value={form.audience}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, audience: e.target.value as AnnouncementAudience }))
              }
              className="w-full px-3 py-2 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All</option>
              <option value="client">Clients</option>
              <option value="therapist">Professional</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={isSaving || isSending}
            onClick={() => saveDraft()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingId ? "Update Draft" : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Delivery Outcome Banner */}
      {selectedOutcome && (
        <div className="bg-offwhite border border-divider rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-darkerb">
                {selectedOutcome.title}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ring-1 capitalize ${
                  STATUS_BADGES[selectedOutcome.status]
                }`}
              >
                {selectedOutcome.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshAnnouncement(selectedOutcome._id)}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Refresh status
              </button>
              <button
                type="button"
                onClick={() => setSelectedOutcome(null)}
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          {selectedOutcome.delivery && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs text-gray-700 pt-1">
              <div className="bg-white rounded p-2 border border-divider">
                <span className="text-gray-500 block">In-app published</span>
                <strong>{selectedOutcome.delivery.inAppPublished ?? 0}</strong>
              </div>
              <div className="bg-white rounded p-2 border border-divider">
                <span className="text-gray-500 block">Email accepted</span>
                <strong>{selectedOutcome.delivery.emailAccepted ?? 0}</strong>
              </div>
              <div className="bg-white rounded p-2 border border-divider">
                <span className="text-gray-500 block">Email failed</span>
                <strong>{selectedOutcome.delivery.emailFailed ?? 0}</strong>
              </div>
              <div className="bg-white rounded p-2 border border-divider">
                <span className="text-gray-500 block">Push enabled</span>
                <strong>{selectedOutcome.delivery.pushEnabled ? "Yes" : "No"}</strong>
              </div>
              <div className="bg-white rounded p-2 border border-divider">
                <span className="text-gray-500 block">Push accepted</span>
                <strong>{selectedOutcome.delivery.pushAccepted ?? 0}</strong>
              </div>
              <div className="bg-white rounded p-2 border border-divider">
                <span className="text-gray-500 block">Push failed</span>
                <strong>{selectedOutcome.delivery.pushFailed ?? 0}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-divider rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-divider flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Drafts & Sent Announcements</h2>
          <span className="text-xs text-gray-500">{pagination.total} total</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading announcements…
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-sm text-rose-600">
            Failed to load announcements. Please try refreshing.
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No announcements yet. Create a draft above.
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {announcements.map((item) => {
              const isDraft = item.status === "draft";
              const dateDisplay = formatDateDDMMYYYY(item.sentAt || item.createdAt, "—");
              return (
                <div
                  key={item._id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {item.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ring-1 capitalize ${
                          STATUS_BADGES[item.status]
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>Channel: {CHANNEL_LABELS[item.channel] ?? item.channel}</span>
                      <span>•</span>
                      <span>Audience: {AUDIENCE_LABELS[item.audience] ?? item.audience}</span>
                      <span>•</span>
                      <span>Date: {dateDisplay}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isDraft ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditDraft(item)}
                          disabled={isSending || isDeleting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm border border-divider rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDraft(item._id)}
                          disabled={isSending || isDeleting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmSendItem(item)}
                          disabled={isSending || isDeleting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void refreshAnnouncement(item._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm border border-divider rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> View Delivery
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-divider">
            <Pagination
              total={pagination.total}
              page={page}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Confirm Send Modal */}
      {confirmSendItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isSending && setConfirmSendItem(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Send Announcement?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to send <strong>{confirmSendItem.title}</strong> to{" "}
              <strong>{AUDIENCE_LABELS[confirmSendItem.audience]}</strong> via{" "}
              <strong>{CHANNEL_LABELS[confirmSendItem.channel]}</strong>? Once sent, this draft
              cannot be edited.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSending}
                onClick={() => setConfirmSendItem(null)}
                className="px-3 py-1.5 text-sm border border-divider rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={() => sendAnnouncement(confirmSendItem._id)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
