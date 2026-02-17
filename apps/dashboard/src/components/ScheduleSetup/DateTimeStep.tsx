import React, { useState } from "react";
import { CancelIcon, CopyIcon, AddIcon } from "../../assets/icons";
import { MeetingPreference } from "./schedule.types";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CreateScheduleApi, IScheduleRequestData } from "../../api/Schedule.api";

const dayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const timeZones = [
  "West African Time (WAT)",
  "Greenwich Mean Time (GMT)",
  "Central European Time (CET)",
  "Eastern Time (ET)",
  "Pacific Time (PT)",
];

interface Slot {
  startTime: string;
  endTime: string;
  mode: string;
  allowGroupBooking: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  meetingPreference: MeetingPreference;
  selectedTimeZone: string;
  onTimeZoneChange: (timezone: string) => void;
  scheduleData?: IScheduleRequestData[];
  onNext: () => void;
  onBack: () => void;
  onSuccess?: () => void;
  onReset?: () => void;
}

const DateTimeStep: React.FC<Props> = ({
  value,
  onChange,
  meetingPreference,
  selectedTimeZone,
  onTimeZoneChange,
  onNext,
  onBack,
  onSuccess,
  onReset,
}) => {
  const [availability, setAvailability] = useState<Slot[][]>(() => {
    try {
      return value ? JSON.parse(value) : Array(7).fill([]);
    } catch {
      return Array(7).fill([]);
    }
  });

  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const getDefaultMode = (): string => {
    switch (meetingPreference) {
      case "Both": return "both";
      case "Video Session": return "video";
      case "Team Session": return "group";
      default: return "in-person";
    }
  };

  const getAvailableModes = () => {
    switch (meetingPreference) {
      case "In-person":
        return [{ value: "in-person", label: "In-Person" }];
      case "Video Session":
        return [{ value: "video", label: "Video" }];
      case "Team Session":
        return [{ value: "group", label: "Group" }];
      case "Both":
        return [
          { value: "in-person", label: "In-Person" },
          { value: "video", label: "Video" },
          { value: "group", label: "Group" },
          { value: "both", label: "All Types" },
        ];
      default:
        return [
          { value: "in-person", label: "In-Person" },
          { value: "video", label: "Video" },
          { value: "group", label: "Team Session" },
          { value: "both", label: "All Types" },
        ];
    }
  };

  const sync = (updated: Slot[][]) => {
    setAvailability(updated);
    onChange(JSON.stringify(updated));
  };

  // ── slot operations ───────────────────────────────────────────────────────

  const toggleDay = (index: number) => {
    const updated = [...availability];
    updated[index] =
      updated[index].length > 0
        ? []
        : [{ startTime: "09:00", endTime: "10:00", mode: getDefaultMode(), allowGroupBooking: false }];
    sync(updated);
  };

  const addSlot = (dayIndex: number) => {
    const updated = [...availability];
    updated[dayIndex] = [
      ...updated[dayIndex],
      { startTime: "09:00", endTime: "10:00", mode: getDefaultMode(), allowGroupBooking: false },
    ];
    sync(updated);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const updated = availability.map((d, i) =>
      i === dayIndex ? d.filter((_, si) => si !== slotIndex) : d
    );
    sync(updated);
  };

  const copySlot = (dayIndex: number, slotIndex: number) => {
    const updated = [...availability];
    updated[dayIndex] = [...updated[dayIndex], { ...updated[dayIndex][slotIndex] }];
    sync(updated);
  };

  const updateSlot = (
    dayIndex: number,
    slotIndex: number,
    field: keyof Slot,
    val: string | boolean
  ) => {
    const updated = availability.map((d, di) =>
      di !== dayIndex
        ? d
        : d.map((s, si) => {
            if (si !== slotIndex) return s;
            const next = { ...s, [field]: val };
            if (field === "startTime" && typeof val === "string") {
              const [h, m] = val.split(":").map(Number);
              next.endTime = `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            }
            return next;
          })
    );
    sync(updated);
  };

  // ── mutation ──────────────────────────────────────────────────────────────

  const { mutateAsync: handleScheduleSubmit, isPending } = useMutation({
    mutationFn: (data: IScheduleRequestData[]) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return CreateScheduleApi(data, { signal: controller.signal });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  React.useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  // ── build API payload ────────────────────────────────────────────────────

  const buildScheduleData = (): IScheduleRequestData[] =>
    availability.flatMap((daySlots, index) => {
      if (daySlots.length === 0) return [];
      const firstMode = daySlots[0].mode;
      let meetingType = "video";
      if (firstMode === "in-person") meetingType = "in-person";
      else if (firstMode === "group") meetingType = "group";
      else if (firstMode === "video") meetingType = "video";

      return [
        {
          day: dayNames[index],
          meetingType,
          timezone: selectedTimeZone,
          isAvailable: true,
          allowGroupBooking: daySlots.some((s) => s.allowGroupBooking),
          slots: daySlots.map(({ startTime, endTime }) => ({ startTime, endTime })),
        },
      ];
    });

  // ── save flow ────────────────────────────────────────────────────────────

  const handleSaveClick = () => {
    setShowModal(true);
  };

  const handleConfirm = async () => {
    try {
      if (activeDaysCount > 0) {
        await handleScheduleSubmit(buildScheduleData());
        toast.success("Schedule saved successfully!");
      }
      setShowModal(false);
      if (onReset) onReset();
      if (onSuccess) onSuccess();
    } catch {
      // handled in onError
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const availableModes = getAvailableModes();
  const selectedDaySlots = selectedDayIdx !== null ? availability[selectedDayIdx] : [];
  const activeDaysCount = availability.filter((d) => d.length > 0).length;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Set Your Schedule</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Configure your availability for clients. You can set pricing in the next step.
          </p>
        </div>

        {/* Timezone */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8 shadow-sm hover:shadow-md transition-shadow">
          <label className="flex items-center gap-3 cursor-pointer">
            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-gray-700">Time Zone</span>
            <select
              value={selectedTimeZone}
              onChange={(e) => onTimeZoneChange(e.target.value)}
              className="ml-auto border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 px-4 py-2 hover:border-gray-400 transition"
            >
              {timeZones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Days list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-lg">Available Days</h3>
                <p className="text-sm text-gray-600 mt-1">Click a day to manage</p>
              </div>
              <div className="divide-y divide-gray-200">
                {dayNames.map((name, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (availability[index].length === 0) {
                        toggleDay(index);
                        setTimeout(() => setSelectedDayIdx(index), 0);
                      } else {
                        setSelectedDayIdx(index);
                      }
                    }}
                    className={`w-full text-left px-4 py-4 transition-colors ${
                      selectedDayIdx === index
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-gray-500">
                          {availability[index].length > 0
                            ? `${availability[index].length} slot${availability[index].length !== 1 ? "s" : ""}`
                            : "Click to add"}
                        </p>
                      </div>
                      {availability[index].length > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">{activeDaysCount} of 7 days</span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(activeDaysCount / 7) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slots editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {selectedDayIdx !== null ? (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {dayNames[selectedDayIdx]}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedDaySlots.length} time slot{selectedDaySlots.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          toggleDay(selectedDayIdx);
                          setSelectedDayIdx(null);
                        }}
                        className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-medium text-sm"
                      >
                        Remove Day
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {selectedDaySlots.map((slot, slotIdx) => (
                      <div
                        key={slotIdx}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3"
                      >
                        {/* Time + mode row */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateSlot(selectedDayIdx, slotIdx, "startTime", e.target.value)
                            }
                            className="border border-gray-300 rounded-lg px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700 bg-white"
                          />
                          <span className="text-gray-400 font-semibold">−</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            disabled
                            title="End time is automatically 1 hour after start"
                            className="border border-gray-300 rounded-lg px-3 py-2 w-28 bg-gray-200 text-gray-700 font-medium cursor-not-allowed"
                          />

                          {availableModes.length > 1 && (
                            <select
                              value={slot.mode}
                              onChange={(e) =>
                                updateSlot(selectedDayIdx, slotIdx, "mode", e.target.value)
                              }
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white font-medium"
                            >
                              {availableModes.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                          )}

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => copySlot(selectedDayIdx, slotIdx)}
                              className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                              title="Duplicate slot"
                            >
                              <CopyIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => removeSlot(selectedDayIdx, slotIdx)}
                              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                              title="Delete slot"
                            >
                              <CancelIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Group booking toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Allow Group Booking
                            </p>
                            <p className="text-xs text-gray-500">
                              Let multiple clients book this slot simultaneously
                            </p>
                          </div>
                          <button
                            role="switch"
                            aria-checked={slot.allowGroupBooking}
                            onClick={() =>
                              updateSlot(
                                selectedDayIdx,
                                slotIdx,
                                "allowGroupBooking",
                                !slot.allowGroupBooking
                              )
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              slot.allowGroupBooking ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                slot.allowGroupBooking ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => addSlot(selectedDayIdx)}
                      className="w-full mt-2 py-2 px-4 text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold flex items-center justify-center gap-2 border border-blue-200 hover:border-blue-300"
                    >
                      <AddIcon className="w-4 h-4" />
                      Add Another Time Slot
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 font-medium">Select a day from the left to edit time slots</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Or click any day to automatically add a default slot
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4 mt-12">
          <button
            onClick={onBack}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveClick}
              disabled={activeDaysCount === 0 || isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Schedule
                </>
              )}
            </button>
            <button
              onClick={onNext}
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue to Pricing
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Schedule</h3>
            <p className="text-gray-500 mb-6">Review your availability before saving.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100 space-y-2">
              {activeDaysCount === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">
                  No availability set — you can add it later from the schedule manager.
                </p>
              ) : (
                <>
                  {availability.map((slots, i) =>
                    slots.length === 0 ? null : (
                      <div key={i} className="flex items-start justify-between text-sm">
                        <span className="font-medium text-gray-700 w-24">{dayNames[i]}</span>
                        <div className="flex flex-col items-end gap-1">
                          {slots.map((s, si) => (
                            <span key={si} className="text-gray-600">
                              {s.startTime} – {s.endTime}
                              {s.allowGroupBooking && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  Group
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-gray-600 font-medium">Days Available</span>
                    <span className="font-bold text-gray-900">{activeDaysCount}/7</span>
                  </div>
                </>
              )}
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

export default DateTimeStep;