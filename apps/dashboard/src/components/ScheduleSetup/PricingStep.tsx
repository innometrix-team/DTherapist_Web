import React from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CreatePricingApi, IPricingRequestData } from "../../api/Schedule.api";
import { MeetingPreference } from "./schedule.types";

interface PricingStepProps {
  pricing: {
    inPerson: number;
    video: number;
    group: number;
  };
  onPricingChange: (pricing: { inPerson: number; video: number; group: number }) => void;
  meetingPreference: MeetingPreference;
  onBack: () => void;
  onSuccess?: () => void;
}

const PricingStep: React.FC<PricingStepProps> = ({
  pricing,
  onPricingChange,
  meetingPreference,
  onBack,
  onSuccess,
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const { mutateAsync: handlePricingSubmit, isPending } = useMutation({
    mutationFn: (data: IPricingRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return CreatePricingApi(data, { signal: controller.signal });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const isComplete =
    pricing.video > 0 && pricing.inPerson > 0 && pricing.group > 0;

  const handleSaveClick = () => {
    if (!isComplete) {
      toast.error(
        "Please enter valid pricing for all session types."
      );
      return;
    }
    setShowModal(true);
  };

  const handleConfirm = async () => {
    try {
      await handlePricingSubmit({
        videoPrice: pricing.video,
        inPersonPrice: pricing.inPerson,
        groupVideoPrice: pricing.group,
        allowGroupVideo: meetingPreference === "Team Session",
      });
      toast.success("Pricing saved successfully!");
      setShowModal(false);
      if (onSuccess) onSuccess();
    } catch {
      // error handled in onError
    }
  };

  const PriceField = ({
    label,
    field,
    placeholder,
    hint,
  }: {
    label: string;
    field: keyof typeof pricing;
    placeholder: string;
    hint?: string;
  }) => {
    const val = pricing[field];
    const isSet = val > 0;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700">{label}</label>
          {isSet && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Set
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            value={val || ""}
            onChange={(e) =>
              onPricingChange({
                ...pricing,
                [field]: parseFloat(e.target.value) || 0,
              })
            }
            placeholder={placeholder}
            min="0"
            step="100"
            className={`w-full pl-4 pr-16 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-medium transition ${
              isSet
                ? "border-green-300 focus:ring-green-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            ₦/hr
          </span>
        </div>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Session Pricing</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Set your hourly rates for each session type. These will be visible to clients
            when they book with you.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-linear-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Hourly Rates</h2>
                <p className="text-sm text-gray-500">All prices in Nigerian Naira (₦)</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <PriceField
              label="Video Call"
              field="video"
              placeholder="e.g. 5000"
            />
            <div className="border-t border-gray-100" />
            <PriceField
              label="In-Person Session"
              field="inPerson"
              placeholder="e.g. 7500"
            />
            <div className="border-t border-gray-100" />
            <PriceField
              label="Team Session"
              field="group"
              placeholder="e.g. 3000"
              hint="Per person pricing for Team sessions"
            />
          </div>

          {/* Checklist footer */}
          <div className="px-6 pb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Pricing Requirements:
              </p>
              <ul className="space-y-2">
                {[
                  { label: "Video call pricing set", done: pricing.video > 0 },
                  { label: "In-person pricing set", done: pricing.inPerson > 0 },
                  { label: "Team session pricing set", done: pricing.group > 0 },
                ].map(({ label, done }) => (
                  <li key={label} className="flex items-center gap-2 text-sm">
                    <svg
                      className={`w-5 h-5 ${done ? "text-green-500" : "text-gray-300"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className={done ? "text-gray-900 font-medium" : "text-gray-500"}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4 mt-10">
          <button
            onClick={onBack}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!isComplete || isPending}
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isPending ? "Saving..." : "Save Pricing"}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Pricing</h3>
            <p className="text-gray-500 mb-6">
              Review your session rates before saving.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 border border-gray-100">
              {[
                { label: "Video Sessions", value: pricing.video },
                { label: "In-Person Sessions", value: pricing.inPerson },
                { label: "Team Sessions", value: pricing.group },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold text-gray-900">
                    ₦{value.toLocaleString()}/hr
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="px-6 py-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingStep;