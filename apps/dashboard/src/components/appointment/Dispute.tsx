import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { submitDispute, Appointment } from "../../api/Appointments.api";

interface DisputeFormData {
  reason: string;
  description: string;
  attachments: string[];
}

const DISPUTE_REASONS = [
  "Therapist did not show up",
  "Inappropriate behavior",
  "Other",
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

  const [attachmentInput, setAttachmentInput] = useState("");
  const [errors, setErrors] = useState<Partial<DisputeFormData>>({});

  // Mutation for submitting dispute
  const disputeMutation = useMutation({
    mutationFn: (data: DisputeFormData) => {
      if (!bookingId) {
        throw new Error("Booking ID is required");
      }
      return submitDispute(bookingId, data);
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
    const newErrors: Partial<DisputeFormData> = {};

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

  const handleAddAttachment = () => {
    if (attachmentInput.trim() && isValidUrl(attachmentInput.trim())) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, attachmentInput.trim()],
      });
      setAttachmentInput("");
    } else {
      toast.error("Please enter a valid URL");
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    });
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={attachmentInput}
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  placeholder="Enter image URL (e.g., https://example.com/screenshot.png)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAttachment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Attachments List */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <span className="text-sm text-gray-600 truncate">
                          {url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="ml-2 text-red-500 hover:text-red-700 transition-colors"
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
                            d="M6 18L18 6M6 6l12 12"
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