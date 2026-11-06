import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const reportReasons = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "sexual_content", label: "Sexual Content" },
  { value: "self_harm", label: "Self Harm" },
  { value: "other", label: "Other" },
];

const reportSchema = z.object({
  reason: z.string().min(1, "Please select a reason"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportMessageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFormData) => void;
  isLoading?: boolean;
  messagePreview?: string;
}

export default function ReportMessageModal({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  messagePreview,
}: ReportMessageModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: "",
      description: "",
    },
  });

  const handleClose = useCallback(() => {
    if (!isLoading) {
      reset();
      onClose();
    }
  }, [isLoading, reset, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  const handleFormSubmit = (data: ReportFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 id="report-modal-title" className="text-xl font-semibold text-gray-900">
            Report Message
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close report dialog"
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(handleFormSubmit)(e);
          }}
          className="space-y-4 pt-4"
        >
          {/* Message Preview */}
          {messagePreview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                Reporting this message:
              </p>
              <p className="text-sm text-gray-700 line-clamp-3">
                {messagePreview}
              </p>
            </div>
          )}

          {/* Reason Select */}
          <div>
            <label
              htmlFor="report-reason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="report-reason"
              {...register("reason")}
              disabled={isLoading}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? "report-reason-error" : undefined}
              className={`w-full border rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.reason ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="" disabled>
                Select a reason
              </option>
              {reportReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p id="report-reason-error" className="text-xs text-red-500 mt-1">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Description Textarea */}
          <div>
            <label
              htmlFor="report-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="report-description"
              {...register("description")}
              rows={4}
              disabled={isLoading}
              placeholder="Please provide details about why you're reporting this message..."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "report-description-error" : undefined}
              className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p id="report-description-error" className="text-xs text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {isLoading ? "Reporting..." : "Report Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
