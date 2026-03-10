import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { flagClient } from "../../api/FlagClient.api";
import { Appointment } from "../../api/Appointments.api";

// ─── Types ─────────────────────────────────────────────────────────────────

interface PostCallReviewModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_NOTE_LENGTH = 1000;

// ─── Icons ──────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MedicalIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-3-3v6m-7 3h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Component ──────────────────────────────────────────────────────────────

const PostCallReviewModal: React.FC<PostCallReviewModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onSubmitted,
}) => {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setNote("");
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen, appointment?.bookingId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!appointment) return;

    if (!note.trim()) {
      toast.error("Please add your notes before submitting.");
      return;
    }

    const clientId = appointment.userId ?? "";
    if (!clientId) {
      toast.error("Client information is missing. Cannot submit notes.");
      return;
    }

    try {
      setIsSubmitting(true);
      await flagClient({
        clientId,
        bookingId: appointment.bookingId,
        note: note.trim(),
      });
      setIsSubmitted(true);
      toast.success("Session notes submitted successfully.");
      onSubmitted?.();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? "Failed to submit notes.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const firstName = appointment.fullName?.split(" ")[0] ?? "the client";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <MedicalIcon />
            </div>
            <div>
              <h2 id="review-modal-title" className="text-base font-semibold text-gray-900">
                Post-Session Notes
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Session with {appointment.fullName} has ended
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isSubmitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckIcon />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Notes Submitted</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Your post-session notes have been recorded and will be reviewed by the platform team.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Session info chip */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <img
                  src={appointment.profilePicture || "https://placehold.net/avatar-4.png"}
                  alt={appointment.fullName}
                  className="w-9 h-9 rounded-full shrink-0 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.net/avatar-4.png";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{appointment.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(appointment.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {appointment.time}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  {appointment.type}
                </span>
              </div>

              {/* Context callout */}
              <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                </svg>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Based on this session, please note whether{" "}
                  <span className="font-semibold">{firstName}</span> may require further
                  professional attention — such as a referral to a psychologist, psychiatrist,
                  or another medical specialist.
                </p>
              </div>

              {/* Notes textarea */}
              <div>
                <label htmlFor="review-note" className="block text-sm font-medium text-gray-700 mb-2">
                  Clinical Notes &amp; Referral Recommendations
                </label>
                <textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
                  placeholder={`e.g. "${firstName} displayed signs of severe anxiety and may benefit from a formal assessment by a licensed psychologist. Recommend referral to a mental health specialist for further evaluation."`}
                  rows={6}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400 transition-shadow"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs text-gray-400">
                    These notes are confidential and only visible to platform administrators.
                  </p>
                  <span className={`text-xs font-mono ${note.length >= MAX_NOTE_LENGTH ? "text-red-500" : "text-gray-400"}`}>
                    {note.length}/{MAX_NOTE_LENGTH}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!isSubmitted && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !note.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon />
                  Submitting…
                </>
              ) : (
                <>
                  <MedicalIcon />
                  Submit Notes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCallReviewModal;