import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllTherapistSchedulesApi } from "../../api/TherapistSchedule.api";
import { CreateScheduleApi, IScheduleRequestData } from "../../api/Schedule.api";
import { CancelIcon, CopyIcon, AddIcon } from "../../assets/icons";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

interface Props {
  therapistId?: string;
  onBack: () => void;
  onEdit?: () => void;
}

interface EditingSlot {
  startTime: string;
  endTime: string;
  meetingType: "video" | "in-person";
}

interface DayValidity {
  validFrom: string;
  validUntil: string;
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const formatDateInput = (isoOrDate?: string): string => {
  if (!isoOrDate) return "";
  return isoOrDate.split("T")[0];
};

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ViewEditSchedule: React.FC<Props> = ({ 
  therapistId, 
  onBack,
  onEdit
}) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedules, setEditedSchedules] = useState<{ [key: string]: EditingSlot[] }>({});
  const [editedValidity, setEditedValidity] = useState<{ [key: string]: DayValidity }>({});
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.therapists.schedules(therapistId || ''),
    queryFn: async () => {
      if (!therapistId) return null;
      try {
        const result = await getAllTherapistSchedulesApi(therapistId);
        if (result?.data?.schedules) {
          const activeSchedules = result.data.schedules.filter(
            (schedule) => schedule.isAvailable && schedule.slots.length > 0
          );

          // Deduplicate by day so each weekday has a single combined entry
          const mergedMap = new Map<string, typeof activeSchedules[number]>();
          activeSchedules.forEach((schedule) => {
            const existing = mergedMap.get(schedule.day);
            const fallbackType: "video" | "in-person" =
              schedule.meetingType === "in-person" ? "in-person" : "video";
            const normalizedSlots = schedule.slots.map((slot) => ({
              ...slot,
              meetingType:
                slot.meetingType && slot.meetingType !== "both"
                  ? slot.meetingType
                  : fallbackType,
            }));

            if (!existing) {
              mergedMap.set(schedule.day, {
                ...schedule,
                slots: normalizedSlots,
              });
            } else {
              existing.slots = [...existing.slots, ...normalizedSlots];
            }
          });

          const mergedSchedules = Array.from(mergedMap.values());

          // Initialize edited schedules and validity with current data
          const initial: { [key: string]: EditingSlot[] } = {};
          const initialValidity: { [key: string]: DayValidity } = {};
          mergedSchedules.forEach((schedule) => {
            const fallbackType: "video" | "in-person" =
              schedule.meetingType === "in-person" ? "in-person" : "video";
            initial[schedule.day] = schedule.slots.map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              meetingType:
                slot.meetingType && slot.meetingType !== "both"
                  ? slot.meetingType
                  : fallbackType,
            }));
            initialValidity[schedule.day] = {
              validFrom: formatDateInput(schedule.validFrom),
              validUntil: formatDateInput(schedule.validUntil),
            };
          });
          setEditedSchedules(initial);
          setEditedValidity(initialValidity);
          return mergedSchedules;
        }
        return [];
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
        return [];
      }
    },
    enabled: !!therapistId,
  });

  const { mutateAsync: handleScheduleUpdate, isPending } = useMutation({
    mutationFn: async (data: IScheduleRequestData[]) => {
      return CreateScheduleApi(data);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update schedule");
    },
  });

  const schedules = data || [];

  const handleSlotChange = (
    day: string,
    slotIndex: number,
    field: "startTime" | "endTime" | "meetingType",
    value: string
  ) => {
    setEditedSchedules(prev => ({
      ...prev,
      [day]: prev[day].map((slot, idx) => 
        idx === slotIndex ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleValidityChange = (day: string, field: keyof DayValidity, value: string) => {
    setEditedValidity((prev) => ({
      ...prev,
      [day]: {
        validFrom: prev[day]?.validFrom || "",
        validUntil: prev[day]?.validUntil || "",
        [field]: value,
      },
    }));
  };

  const addSlot = (day: string) => {
    setEditedSchedules(prev => {
      const current = prev[day] || [];
      let nextStart = "09:00";
      let nextEnd = "10:00";
      const defaultType: "video" | "in-person" =
        current[current.length - 1]?.meetingType || "video";
      if (current.length > 0) {
        const lastEnd = current[current.length - 1].endTime;
        const [h, m] = lastEnd.split(":").map(Number);
        if (Number.isFinite(h) && Number.isFinite(m) && h < 23) {
          nextStart = lastEnd;
          nextEnd = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }
      return {
        ...prev,
        [day]: [
          ...current,
          { startTime: nextStart, endTime: nextEnd, meetingType: defaultType }
        ],
      };
    });
  };

  const removeSlot = (day: string, slotIndex: number) => {
    setEditedSchedules(prev => ({
      ...prev,
      [day]: prev[day].filter((_, idx) => idx !== slotIndex),
    }));
  };

  const copySlot = (day: string, slotIndex: number) => {
    const slot = editedSchedules[day][slotIndex];
    const [h, m] = slot.endTime.split(":").map(Number);
    const nextStart = Number.isFinite(h) && h < 23 ? slot.endTime : slot.startTime;
    const nextEnd =
      Number.isFinite(h) && h < 23
        ? `${String(h + 1).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
        : slot.endTime;
    setEditedSchedules(prev => ({
      ...prev,
      [day]: [...prev[day], { ...slot, startTime: nextStart, endTime: nextEnd }],
    }));
  };

  const validateEditedSchedules = (): boolean => {
    for (const schedule of schedules) {
      const day = schedule.day;
      const daySlots = editedSchedules[day] || [];
      const validity = editedValidity[day];
      if (validity?.validFrom && validity?.validUntil && validity.validFrom > validity.validUntil) {
        toast.error(`${day}: Valid Until date must be on or after Valid From date.`);
        return false;
      }

      for (let i = 0; i < daySlots.length; i++) {
        const sA = daySlots[i];
        const aStart = toMinutes(sA.startTime);
        const aEnd = toMinutes(sA.endTime);
        if (aEnd <= aStart) {
          toast.error(`${day}: End time (${sA.endTime}) must be after start time (${sA.startTime}).`);
          return false;
        }
        for (let j = i + 1; j < daySlots.length; j++) {
          const sB = daySlots[j];
          const bStart = toMinutes(sB.startTime);
          const bEnd = toMinutes(sB.endTime);
          if (aStart < bEnd && bStart < aEnd) {
            toast.error(
              `Overlapping slots on ${day}: ${sA.startTime}–${sA.endTime} and ${sB.startTime}–${sB.endTime}.`
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateEditedSchedules()) {
      setShowSaveModal(false);
      return;
    }

    try {
      const updateData: IScheduleRequestData[] = schedules.map((schedule) => {
        const daySlots = editedSchedules[schedule.day] || [];
        const hasSlots = daySlots.length > 0;
        const hasInPerson = daySlots.some((s) => s.meetingType === "in-person");
        const hasVideo = daySlots.some((s) => s.meetingType === "video");
        const derivedMeetingType =
          hasInPerson && !hasVideo
            ? "in-person"
            : schedule.meetingType === "in-person" && !hasVideo
            ? "in-person"
            : "video";
        const validity = editedValidity[schedule.day];

        return {
          day: schedule.day,
          meetingType: derivedMeetingType,
          timezone: schedule.timezone,
          isAvailable: hasSlots,
          teamBooking: hasSlots ? Boolean(schedule.teamBooking || schedule.allowGroupBooking) : false,
          allowGroupBooking: hasSlots ? Boolean(schedule.allowGroupBooking || schedule.teamBooking) : false,
          validFrom: validity?.validFrom || undefined,
          validUntil: validity?.validUntil || undefined,
          slots: daySlots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            meetingType: slot.meetingType,
          })),
        };
      });

      await handleScheduleUpdate(updateData);
      if (therapistId) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.therapists.schedules(therapistId) });
      }
      toast.success("Schedule updated successfully!");
      setIsEditing(false);
      setShowSaveModal(false);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Schedule</h3>
            <p className="text-red-700 mb-6">We couldn't load your schedule. Please try again.</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Schedule Yet</h3>
            <p className="text-gray-600 mb-6">You haven't set up a schedule yet. Create one to get started!</p>
            <button
              onClick={onEdit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Schedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Schedule</h1>
            <p className="text-gray-600">
              {schedules[0]?.timezone}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {isEditing ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Editing
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Schedule
              </>
            )}
          </button>
        </div>

        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition mb-6 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules
            .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
            .map((schedule) => (
            <div key={schedule._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{schedule.day}</h3>
                  {schedule.isAvailable && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Available
                    </span>
                  )}
                </div>
                {(schedule.validFrom || schedule.validUntil) && !isEditing && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Valid: {formatDateInput(schedule.validFrom) || "Start"} – {formatDateInput(schedule.validUntil) || "Ongoing"}
                  </p>
                )}
              </div>

              <div className="p-6">
                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-100">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Valid From</label>
                        <input
                          type="date"
                          value={editedValidity[schedule.day]?.validFrom || ""}
                          onChange={(e) => handleValidityChange(schedule.day, "validFrom", e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Valid Until</label>
                        <input
                          type="date"
                          value={editedValidity[schedule.day]?.validUntil || ""}
                          min={editedValidity[schedule.day]?.validFrom || undefined}
                          onChange={(e) => handleValidityChange(schedule.day, "validUntil", e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {editedSchedules[schedule.day]?.map((slot, idx) => (
                      <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(schedule.day, idx, "startTime", e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-24 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <span className="text-gray-400">−</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(schedule.day, idx, "endTime", e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-24 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={slot.meetingType}
                            onChange={(e) =>
                              handleSlotChange(
                                schedule.day,
                                idx,
                                "meetingType",
                                e.target.value as "video" | "in-person"
                              )
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="video">Video</option>
                            <option value="in-person">In-Person</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copySlot(schedule.day, idx)}
                              className="p-1 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition"
                              title="Duplicate slot"
                            >
                              <CopyIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeSlot(schedule.day, idx)}
                              className="p-1 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition"
                              title="Remove slot"
                            >
                              <CancelIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addSlot(schedule.day)}
                      className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded transition text-sm font-medium flex items-center justify-center gap-1 border border-blue-200"
                    >
                      <AddIcon className="w-4 h-4" />
                      Add Slot
                    </button>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-3">
                    {schedule.slots.length > 0 ? (
                      schedule.slots.map((slot, idx) => {
                        const slotType =
                          slot.meetingType && slot.meetingType !== "both"
                            ? slot.meetingType
                            : schedule.meetingType === "in-person"
                            ? "in-person"
                            : "video";
                        return (
                          <div key={idx} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {slot.startTime} − {slot.endTime}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {Math.max(1, parseInt(slot.endTime) - parseInt(slot.startTime))} hour session
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block px-3 py-1 bg-white border border-blue-200 text-blue-700 text-xs font-medium rounded">
                                {slotType === "video" ? "Video" : "In-Person"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-600 text-sm">No time slots</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button (when editing) */}
        {isEditing && (
          <div className="flex justify-end gap-4 mt-12">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (validateEditedSchedules()) {
                  setShowSaveModal(true);
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </button>
          </div>
        )}

        {/* Confirmation Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Save Changes?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to update your schedule? This will replace your current availability.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  disabled={isPending}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void handleSaveChanges();
                  }}
                  disabled={isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="animate-spin">○</span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewEditSchedule;
