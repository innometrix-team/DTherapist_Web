import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { submitDispute, Appointment } from "../../api/Appointments.api";

interface DisputeFormData {
  reason: string;
  description: string;
  attachments: File[];
}

const DISPUTE_REASONS = [
  "Therapist did not show up",
  "Inappropriate behavior",
  "Other",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/pdf",
];

const DisputePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams<{ bookingId: string }>();
  
  // Get appointment data from route state
  const appointment = location.state?.appointment as Appointment | undefined;

  const [formData, setFormData] = useState<DisputeFormData>({
    reason: "",
    description: "",
    attachments: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DisputeFormData, string>>>({});

  // Mutation for submitting dispute
  const disputeMutation = useMutation({
    mutationFn: async (data: DisputeFormData) => {
      if (!bookingId) {
        throw new Error("Booking ID is required");
      }
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("reason", data.reason);
      formDataToSend.append("description", data.description);
      
      // Append each file
      data.attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });
      
      return submitDispute(bookingId, formDataToSend);
    },
    onSuccess: () => {
      toast.success("Dispute submitted successfully");
      navigate("/appointments");
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to submit dispute";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        const maybeErr = error as { message?: unknown };
        if (maybeErr?.message && typeof maybeErr.message === "string") {
          errorMessage = maybeErr.message;
        }
      }
      toast.error(errorMessage);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DisputeFormData, string>> = {};

    if (!formData.reason) {
      newErrors.reason = "Please select a reason";
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    disputeMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} (unsupported file type)`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (exceeds 5MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(", ")}`);
    }

    if (validFiles.length > 0) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...validFiles],
      });
      toast.success(`${validFiles.length} file(s) added`);
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    });
    toast.success("File removed");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return (
        <svg
          className="w-5 h-5 text-blue-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5 text-red-500 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Invalid Request
          </h2>
          <p className="text-gray-600 mb-6">Booking ID is missing</p>
          <button
            onClick={() => navigate("/appointments")}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Submit Dispute
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Appointment Info */}
          {appointment && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={appointment.profilePicture}
                alt={appointment.fullName}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-avatar.png";
                }}
              />
              <div>
                <h3 className="font-medium text-gray-900">
                  {appointment.fullName}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(appointment.date + "T00:00:00").toLocaleDateString()}{" "}
                  at {appointment.time}
                </p>
                <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mt-1">
                  {appointment.type}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dispute Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason Selection */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Reason for Dispute <span className="text-red-500">*</span>
              </label>
              <select
                id="reason"
                value={formData.reason}
                onChange={(e) => {
                  setFormData({ ...formData, reason: e.target.value });
                  setErrors({ ...errors, reason: undefined });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.reason ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a reason</option>
                {DISPUTE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setErrors({ ...errors, description: undefined });
                }}
                placeholder="Please provide detailed information about your dispute..."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Minimum 10 characters
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {formData.description.length} characters
                </p>
              </div>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload images or PDF files (max 5MB per file). Supported formats: JPG, PNG, GIF, PDF
              </p>
              
              {/* File Input */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-1 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF or PDF (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Attachments List */}
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Attached Files ({formData.attachments.length})
                  </p>
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate font-medium">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove file"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={disputeMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disputeMutation.isPending}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                What happens next?
              </h4>
              <p className="text-sm text-blue-700">
                Our support team will review your dispute within 24-48 hours.
                You'll receive an email notification once we've made a decision.
                Please ensure all information provided is accurate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputePage;