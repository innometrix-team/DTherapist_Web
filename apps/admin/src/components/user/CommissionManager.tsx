import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Info, RotateCcw, Save } from "lucide-react";
import toast from "react-hot-toast";

import {
  getTherapistCommissionApi,
  updateTherapistCommissionApi,
  DEFAULT_COMMISSION,
  type ICommissionData,
} from "../../api/Commission.api";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

interface CommissionManagerProps {
  userId: string;
  userFullName?: string;
}

const PRESETS = [
  { label: "65 / 35 (Default)", therapist: 65, admin: 35 },
  { label: "70 / 30", therapist: 70, admin: 30 },
  { label: "80 / 20", therapist: 80, admin: 20 },
  { label: "50 / 50", therapist: 50, admin: 50 },
];

export const CommissionManager: React.FC<CommissionManagerProps> = ({
  userId,
  userFullName,
}) => {
  const queryClient = useQueryClient();

  const [therapistPercentage, setTherapistPercentage] = useState<number>(
    DEFAULT_COMMISSION.therapistPercentage
  );
  const [adminPercentage, setAdminPercentage] = useState<number>(
    DEFAULT_COMMISSION.adminPercentage
  );

  const {
    data: commissionResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.users.commission(userId),
    queryFn: () => getTherapistCommissionApi(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Sync state when data loads
  useEffect(() => {
    if (commissionResult?.data) {
      const data = commissionResult.data;
      setTherapistPercentage(data.therapistPercentage);
      setAdminPercentage(data.adminPercentage);
    }
  }, [commissionResult]);

  const { mutate: handleSave, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (therapistPercentage + adminPercentage !== 100) {
        throw new Error("Therapist and admin percentages must sum to 100%");
      }
      return updateTherapistCommissionApi(userId, {
        therapistPercentage,
        adminPercentage,
      });
    },
    onSuccess: (result) => {
      toast.success(
        result?.message || "Therapist fee split updated successfully"
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.users.commission(userId),
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to update fee split";
      toast.error(message);
    },
  });

  const handleTherapistChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      setTherapistPercentage(0);
      setAdminPercentage(100);
      return;
    }
    const clamped = Math.max(0, Math.min(100, val));
    setTherapistPercentage(clamped);
    setAdminPercentage(100 - clamped);
  };

  const handleAdminChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      setAdminPercentage(0);
      setTherapistPercentage(100);
      return;
    }
    const clamped = Math.max(0, Math.min(100, val));
    setAdminPercentage(clamped);
    setTherapistPercentage(100 - clamped);
  };

  const applyPreset = (preset: { therapist: number; admin: number }) => {
    setTherapistPercentage(preset.therapist);
    setAdminPercentage(preset.admin);
  };

  const resetToDefault = () => {
    setTherapistPercentage(DEFAULT_COMMISSION.therapistPercentage);
    setAdminPercentage(DEFAULT_COMMISSION.adminPercentage);
  };

  const hasChanges =
    commissionResult?.data &&
    (commissionResult.data.therapistPercentage !== therapistPercentage ||
      commissionResult.data.adminPercentage !== adminPercentage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-3 text-sm text-neutral">Loading commission details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
        <p className="text-sm">Failed to load commission data.</p>
      </div>
    );
  }

  const effectiveData: ICommissionData =
    commissionResult?.data || DEFAULT_COMMISSION;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-bold text-darkerb">
          Therapist Commission & Fee Split
        </h3>
        <p className="text-xs text-neutral mt-0.5">
          Configure the revenue split for bookings with{" "}
          <strong className="text-darkerb">{userFullName || "this therapist"}</strong>.
        </p>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold mb-0.5">Application & Therapist Notification Rule:</p>
          <p>
            Fee split modifications <strong>apply only to future bookings</strong>.
            Existing or already completed sessions will maintain their original split rates.
            Upon saving, the system will automatically notify the therapist of the updated split.
          </p>
        </div>
      </div>

      {/* Visual Split Bar */}
      <div className="p-5 bg-offwhite rounded-xl border border-divider space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-primary flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Therapist: {therapistPercentage}%
          </span>
          <span className="text-darkerb flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-darkerb" />
            Platform (Admin): {adminPercentage}%
          </span>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${therapistPercentage}%` }}
          />
          <div
            className="h-full bg-darkerb transition-all duration-300"
            style={{ width: `${adminPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral">
          <span>0%</span>
          <span>Total: 100%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-darkerb">
            Therapist Share (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={therapistPercentage}
              onChange={(e) => handleTherapistChange(e.target.value)}
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-white border border-divider rounded-lg text-sm text-darkerb font-semibold focus:outline-none focus:ring-2 focus:ring-primary pr-9"
            />
            <Percent className="w-4 h-4 text-neutral absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span className="text-[11px] text-neutral">
            Portion of session fee paid to therapist
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-darkerb">
            Platform Share (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={adminPercentage}
              onChange={(e) => handleAdminChange(e.target.value)}
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-white border border-divider rounded-lg text-sm text-darkerb font-semibold focus:outline-none focus:ring-2 focus:ring-primary pr-9"
            />
            <Percent className="w-4 h-4 text-neutral absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span className="text-[11px] text-neutral">
            Platform commission retained by DTherapist
          </span>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-neutral uppercase tracking-wider block">
          Quick Split Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const isSelected =
              therapistPercentage === p.therapist &&
              adminPercentage === p.admin;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                disabled={isSaving}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-darkerb border-divider hover:bg-offwhite"
                }`}
              >
                {p.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={resetToDefault}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral border border-dashed border-divider hover:text-darkerb hover:border-neutral transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset (65/35)</span>
          </button>
        </div>
      </div>

      {/* Save Action */}
      <div className="pt-4 border-t border-divider flex items-center justify-between">
        <div className="text-xs text-neutral">
          {effectiveData.updatedAt && (
            <span>
              Last updated: {new Date(effectiveData.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving || !hasChanges}
          className="px-5 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save Fee Split"}</span>
        </button>
      </div>
    </div>
  );
};

export default CommissionManager;

