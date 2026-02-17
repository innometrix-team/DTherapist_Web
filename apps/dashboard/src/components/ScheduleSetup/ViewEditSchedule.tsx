import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllTherapistSchedulesApi } from "../../api/TherapistSchedule.api";
import { CreateScheduleApi, IScheduleRequestData } from "../../api/Schedule.api";
import { CancelIcon, CopyIcon, AddIcon } from "../../assets/icons";

interface Props {
  therapistId?: string;
  onBack: () => void;
  onEdit?: () => void;
}

interface EditingSlot {
  startTime: string;
  endTime: string;
}

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ViewEditSchedule: React.FC<Props> = ({ 
  therapistId, 
  onBack,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedules, setEditedSchedules] = useState<{ [key: string]: EditingSlot[] }>({});
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["therapistSchedules", therapistId],
    queryFn: async () => {
      if (!therapistId) return null;
      try {
        const result = await getAllTherapistSchedulesApi(therapistId);
        if (result?.data?.schedules) {
          // Initialize edited schedules with current data
          const initial: { [key: string]: EditingSlot[] } = {};
          result.data.schedules.forEach((schedule) => {
            initial[schedule.day] = schedule.slots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            }));
          });
          setEditedSchedules(initial);
          return result.data.schedules;
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

  const handleSlotChange = (day: string, slotIndex: number, field: "startTime" | "endTime", value: string) => {
    setEditedSchedules(prev => ({
      ...prev,
      [day]: prev[day].map((slot, idx) => 
        idx === slotIndex ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const addSlot = (day: string) => {
    setEditedSchedules(prev => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        { startTime: "09:00", endTime: "10:00" }
      ],
    }));
  };

  const removeSlot = (day: string, slotIndex: number) => {
    setEditedSchedules(prev => ({
      ...prev,
      [day]: prev[day].filter((_, idx) => idx !== slotIndex),
    }));
  };

  const copySlot = (day: string, slotIndex: number) => {
    const slot = editedSchedules[day][slotIndex];
    setEditedSchedules(prev => ({
      ...prev,
      [day]: [...prev[day], { ...slot }],
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const updateData: IScheduleRequestData[] = schedules
        .filter(schedule => editedSchedules[schedule.day]?.length > 0)
        .map(schedule => ({
          day: schedule.day,
          meetingType: schedule.meetingType,
          timezone: schedule.timezone,
          isAvailable: true,
          slots: editedSchedules[schedule.day].map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        }));

      await handleScheduleUpdate(updateData);
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
              </div>

              <div className="p-6">
                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-3">
                    {editedSchedules[schedule.day]?.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(schedule.day, idx, "startTime", e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-400">−</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(schedule.day, idx, "endTime", e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => copySlot(schedule.day, idx)}
                          className="p-1 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSlot(schedule.day, idx)}
                          className="p-1 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition"
                        >
                          <CancelIcon className="w-4 h-4" />
                        </button>
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
                      schedule.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {slot.startTime} − {slot.endTime}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {parseInt(slot.endTime) - parseInt(slot.startTime)} hour session
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-white border border-blue-200 text-blue-700 text-xs font-medium rounded">
                              {schedule.meetingType === "video" ? "Video" : "In-Person"}
                            </span>
                          </div>
                        </div>
                      ))
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
              onClick={() => setShowSaveModal(true)}
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
                  onClick={handleSaveChanges}
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
