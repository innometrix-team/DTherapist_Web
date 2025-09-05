import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CreatePricingApi, CreateScheduleApi, IPricingRequestData, IScheduleRequestData } from "../../api/Schedule.api";

interface Props {
  pricing: {
    inPerson: number;
    video: number;
  };
  onChange: (pricing: { inPerson: number; video: number }) => void;
  scheduleData: IScheduleRequestData[];
  onBack: () => void;
  onSuccess: () => void;
  onReset: () => void; // New prop to reset the entire schedule
}

const PricingStep: React.FC<Props> = ({ 
  pricing, 
  onChange, 
  scheduleData, 
  onBack, 
  onSuccess,
  onReset
}) => {
  const [showModal, setShowModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { mutateAsync: handlePricingSubmit, isPending: isPricingPending } = useMutation({
    mutationFn: (data: IPricingRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return CreatePricingApi(data, { signal: controller.signal });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutateAsync: handleScheduleSubmit, isPending: isSchedulePending } = useMutation({
    mutationFn: (data: IScheduleRequestData[]) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return CreateScheduleApi(data, { signal: controller.signal });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpdateClick = () => {
    if (pricing.inPerson <= 0 || pricing.video <= 0) {
      toast.error("Please enter valid pricing for both video and in-person sessions");
      return;
    }
    setShowModal(true);
  };

  const handleConfirm = async () => {
    try {
      // Submit schedule first
      await handleScheduleSubmit(scheduleData);
      
      // Then submit pricing
      await handlePricingSubmit({
        videoPrice: pricing.video,
        inPersonPrice: pricing.inPerson,
      });

      toast.success("Schedule and pricing saved successfully!");
      setShowModal(false);
      
      // Reset the entire schedule flow
      onReset();
      
      // Call success callback
      onSuccess();
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Failed to save schedule and pricing:", error);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const isPending = isPricingPending || isSchedulePending;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="w-full px-4 py-8 sm:px-8 md:px-12 lg:px-24">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-2">How much are you charging?</h2>
        <p className="text-sm text-gray-600 mb-6">
          Your clients will only be charged with this cost on an hourly basis.
        </p>

        <div className="rounded-md p-6 mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-32 font-medium">Video Call</label>
              <div className="relative w-full max-w-sm">
                <input
                  type="number"
                  value={pricing.video}
                  onChange={(e) =>
                    onChange({ ...pricing, video: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-4 pr-16 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  ₦/hr
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-32 font-medium">In-Person</label>
              <div className="relative w-full max-w-sm">
                <input
                  type="number"
                  value={pricing.inPerson}
                  onChange={(e) =>
                    onChange({ ...pricing, inPerson: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-4 pr-16 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  ₦/hr
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isPending}
            className="text-sm text-blue-700 font-medium flex items-center disabled:opacity-50"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            onClick={handleUpdateClick}
            disabled={pricing.inPerson <= 0 || pricing.video <= 0 || isPending}
            className="bg-primary text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Schedule Setup</h3>
            <p className="mb-6">
              Are you sure you want to save your schedule and pricing settings?
            </p>
            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Video Session:</strong> ₦{pricing.video}/hr</p>
              <p><strong>In-Person:</strong> ₦{pricing.inPerson}/hr</p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
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