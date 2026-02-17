import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Flag,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  ShieldAlert,
  Mail,
  StickyNote,
  Stethoscope,
} from "lucide-react";
import {
  GetAdminFlagsApi,
  ReviewFlagApi,
  IAdminFlag,
  IReviewFlagPayload,
} from "../../api/AdminReviews.api";


interface ReviewDialogState {
  flagId: string;
  clientEmail: string;
}

const AdminFlags: React.FC = () => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  
  const {
    data: flagsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-flags"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return GetAdminFlagsApi({ signal: controller.signal });
    },
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });


  const { mutate: reviewFlag, isPending: reviewing } = useMutation({
    mutationFn: (payload: IReviewFlagPayload) => ReviewFlagApi(payload),
    onSuccess: () => {
      toast.success("Flag reviewed successfully");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["admin-flags"] });
    },
    onError: (e: Error) =>
      toast.error(e?.message || "Failed to review flag"),
  });

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (error) toast.error("Failed to load flags. Please try again.");
  }, [error]);


  const flags: IAdminFlag[] = (flagsData?.data as unknown as IAdminFlag[]) ?? [];

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

  const formatTime = (timeStr?: string) => timeStr ?? "N/A";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "reviewed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "dismissed":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const openReviewDialog = (flag: IAdminFlag) => {
    setReviewDialog({ flagId: flag._id, clientEmail: flag.clientId?.email ?? "" });
    setAdminNote(flag.adminNote ?? "");
    setSendEmail(true);
  };

  const closeDialog = () => {
    setReviewDialog(null);
    setAdminNote("");
    setSendEmail(true);
  };

  const handleReviewSubmit = () => {
    if (!reviewDialog) return;
    if (!adminNote.trim()) {
      toast.error("Please enter an admin note before submitting.");
      return;
    }
    reviewFlag({
      flagId: reviewDialog.flagId,
      sendEmail,
      adminNote: adminNote.trim(),
    });
  };

 
  return (
    <div className="bg-white space-y-4 sm:space-y-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Flag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Review Flags</h2>
            <p className="text-xs text-gray-500 mt-0.5">Review flagged sessions and take action</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">Total Flags:</span>
            <span className="font-semibold text-gray-900">{flags.length.toLocaleString()}</span>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            <span className="ml-2 text-gray-600 text-sm">Loading flags…</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-red-600 mb-4">Failed to load flags</p>
            <button
              onClick={() => refetch()}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        ) : flags.length === 0 ? (
          <div className="text-center py-16">
            <Flag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No flags found</p>
            <p className="text-gray-400 text-sm mt-1">There are no flagged sessions to review.</p>
          </div>
        ) : (
          <>
            {/* ── Mobile Card View ──────────────────────────────────────── */}
            <div className="block sm:hidden space-y-4">
              {flags.map((flag) => (
                <div
                  key={flag._id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  {/* Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusBadge(flag.status)}`}>
                      {flag.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(flag.createdAt)}
                    </div>
                  </div>

                  {/* People */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <p className="text-sm font-medium text-gray-800">{flag.clientId?.fullName || "N/A"}</p>
                        <p className="text-xs text-gray-400">{flag.clientId?.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Therapist</p>
                        <p className="text-sm font-medium text-gray-800">{flag.therapistId?.fullName || "N/A"}</p>
                        <p className="text-xs text-gray-400">{flag.therapistId?.email || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking */}
                  <div className="flex items-start gap-2 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Session</p>
                      <p className="text-sm text-gray-700">
                        {formatDate(flag.bookingId?.date)} &nbsp;·&nbsp;
                        {formatTime(flag.bookingId?.startTime)} – {formatTime(flag.bookingId?.endTime)}
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="flex items-start gap-2 mb-3">
                    <StickyNote className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700 break-words">{flag.note || "N/A"}</p>
                  </div>

                  {/* Admin note */}
                  {flag.adminNote && (
                    <div className="bg-blue-50 border border-blue-100 rounded px-3 py-2 mb-3">
                      <p className="text-xs text-blue-500 font-medium mb-0.5">Admin Note</p>
                      <p className="text-xs text-blue-700">{flag.adminNote}</p>
                    </div>
                  )}

                  {flag.status === "pending" && (
                    <button
                      onClick={() => openReviewDialog(flag)}
                      className="w-full mt-1 px-3 py-2 text-xs border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 inline-flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Review Flag
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* ── Desktop Table View ─────────────────────────────────────── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged At</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((flag) => (
                    <tr key={flag._id} className="border-b border-gray-100 hover:bg-gray-50">

                      {/* Client */}
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {flag.clientId?.fullName || "N/A"}
                            </div>
                            <div className="text-xs text-gray-400">{flag.clientId?.email || "N/A"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Therapist */}
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-3.5 h-3.5 text-violet-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {flag.therapistId?.fullName || "N/A"}
                            </div>
                            <div className="text-xs text-gray-400">{flag.therapistId?.email || "N/A"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Session / Booking */}
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-start gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-sm text-gray-700">{formatDate(flag.bookingId?.date)}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatTime(flag.bookingId?.startTime)} – {formatTime(flag.bookingId?.endTime)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-4 px-6 align-top max-w-[200px]">
                        <p className="text-sm text-gray-700 line-clamp-2 break-words">
                          {flag.note || "N/A"}
                        </p>
                        {flag.adminNote && (
                          <div className="mt-1.5 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                            <p className="text-xs text-blue-500 font-medium">Admin Note</p>
                            <p className="text-xs text-blue-700 line-clamp-2">{flag.adminNote}</p>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 align-top">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusBadge(flag.status)}`}>
                          {flag.status}
                        </span>
                      </td>

                      {/* Flagged At */}
                      <td className="py-4 px-6 align-top">
                        <div className="text-sm text-gray-600">{formatDate(flag.createdAt)}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 align-top">
                        {flag.status === "pending" ? (
                          <button
                            onClick={() => openReviewDialog(flag)}
                            title="Review this flag"
                            className="px-3 py-1.5 text-xs border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Review
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Review Flag Dialog ────────────────────────────────────────────────── */}
      {reviewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDialog} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-5 mx-4">

            {/* Dialog Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">Review Flag</h3>
              </div>
              <button onClick={closeDialog} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Note */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Admin Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add your review note here…"
                rows={4}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>

            {/* Send Email Toggle */}
            <div className="flex items-start gap-3 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mt-0.5">
                <Mail className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Notify client by email</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Send the admin note to <span className="font-medium text-gray-600">{reviewDialog.clientEmail}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendEmail((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  sendEmail ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    sendEmail ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDialog}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={reviewing}
                className="px-4 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {reviewing ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFlags;