import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogTitle, TextField, MenuItem } from "@mui/material";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
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
    control,
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

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  const handleFormSubmit = (data: ReportFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: "16px",
          padding: "8px",
        },
      }}
    >
      <DialogTitle>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Report Message</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  variant="outlined"
                  placeholder="Select a reason"
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                  disabled={isLoading}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="" disabled>
                    Select a reason
                  </MenuItem>
                  {reportReasons.map((reason) => (
                    <MenuItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  placeholder="Please provide details about why you're reporting this message..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isLoading}
                />
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Reporting..." : "Report Message"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}