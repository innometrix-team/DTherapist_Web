import React, { useState } from "react";
import { CancelIcon, CopyIcon, AddIcon } from "../../assets/icons";
import { MeetingPreference } from "./schedule.types";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CreatePricingApi, CreateScheduleApi, IPricingRequestData, IScheduleRequestData } from "../../api/Schedule.api";

const dayLabels = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  meetingPreference: MeetingPreference;
  selectedTimeZone: string;
  onTimeZoneChange: (timezone: string) => void;
  pricing: {
    inPerson: number;
    video: number;
    group: number;
  };
  onPricingChange: (pricing: { inPerson: number; video: number; group: number }) => void;
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
  pricing,
  onPricingChange,
  scheduleData,
  onNext, 
  onBack,
  onSuccess,
  onReset
}) => {
  // Initialize from props.value if available
  const [availability, setAvailability] = useState<Slot[][]>(() => {
    try {
      return value ? JSON.parse(value) : Array(7).fill([]);
    } catch {
      return Array(7).fill([]);
    }
  });

  const toggleDay = (index: number) => {
    const updated = [...availability];
    if (updated[index].length) {
      updated[index] = [];
    } else {
      // Set default mode based on meeting preference
      const defaultMode = meetingPreference === 'Both' ? 'both' : 
                         meetingPreference === 'Video Session' ? 'video' : 
                         meetingPreference === 'Team Session' ? 'group' : 'in-person';
      updated[index] = [{ startTime: "09:00", endTime: "10:00", mode: defaultMode }];
    }
    setAvailability(updated);
    
    // Update the parent component state
    const availabilityString = JSON.stringify(updated);
    onChange(availabilityString);
  };

  const updateSlot = (
    dayIndex: number,
    slotIndex: number,
    field: keyof Slot,
    value: string
  ) => {
    const updated = [...availability];
    updated[dayIndex][slotIndex][field] = value;
    
    // If updating start time, automatically set end time to 1 hour later
    if (field === "startTime") {
      const [hours, minutes] = value.split(':').map(Number);
      const endHours = (hours + 1).toString().padStart(2, '0');
      updated[dayIndex][slotIndex]["endTime"] = `${endHours}:${minutes.toString().padStart(2, '0')}`;
    }
    
    setAvailability(updated);
    
    // Update the parent component state
    const availabilityString = JSON.stringify(updated);
    onChange(availabilityString);
  };

  const addSlot = (dayIndex: number) => {
    const updated = [...availability];
    // Set default mode based on meeting preference
    const defaultMode = meetingPreference === 'Both' ? 'both' : 
                       meetingPreference === 'Video Session' ? 'video' : 
                       meetingPreference === 'Team Session' ? 'group' : 'in-person';
    updated[dayIndex].push({ startTime: "09:00", endTime: "10:00", mode: defaultMode });
    setAvailability(updated);
    
    // Update the parent component state
    const availabilityString = JSON.stringify(updated);
    onChange(availabilityString);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const updated = [...availability];
    updated[dayIndex].splice(slotIndex, 1);
    setAvailability(updated);
    
    // Update the parent component state
    const availabilityString = JSON.stringify(updated);
    onChange(availabilityString);
  };

  const copySlot = (dayIndex: number, slotIndex: number) => {
    const slotToCopy = availability[dayIndex][slotIndex];
    const updated = [...availability];
    updated[dayIndex].push({ ...slotToCopy });
    setAvailability(updated);
    
    // Update the parent component state
    const availabilityString = JSON.stringify(updated);
    onChange(availabilityString);
  };

  // Get available modes based on meeting preference
  const getAvailableModes = () => {
    switch (meetingPreference) {
      case 'In-person':
        return [{ value: 'in-person', label: 'In-Person' }];
      case 'Video Session':
        return [{ value: 'video', label: 'Video' }];
      case 'Team Session':
        return [{ value: 'group', label: 'Group' }];
      case 'Both':
        return [
          { value: 'in-person', label: 'In-Person' },
          { value: 'video', label: 'Video' },
          { value: 'group', label: 'Group' },
          { value: 'both', label: 'All Types' }
        ];
      default:
        return [
          { value: 'in-person', label: 'In-Person' },
          { value: 'video', label: 'Video' },
          { value: 'group', label: 'Team Session' },
          { value: 'both', label: 'All Types' }
        ];
    }
  };

  const availableModes = getAvailableModes();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

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

  const handleSaveClick = () => {
    // Validate availability
    const hasAvail = availability.some(daySlots => daySlots.length > 0);
    if (!hasAvail) {
      toast.error("Please set availability for at least one day with a time slot.");
      return;
    }

    // Validate pricing
    if (pricing.inPerson <= 0 || pricing.video <= 0 || pricing.group <= 0) {
      toast.error("Please enter valid pricing for all session types (video, in-person, and group)");
      return;
    }

    setShowModal(true);
  };

  const handleConfirm = async () => {
    try {
      // Submit schedule first
      if (scheduleData) {
        await handleScheduleSubmit(scheduleData);
      }
      
      // Then submit pricing
      await handlePricingSubmit({
        videoPrice: pricing.video,
        inPersonPrice: pricing.inPerson,
        groupVideoPrice: pricing.group,
        allowGroupVideo: meetingPreference === 'Team Session' 
      });

      toast.success("Schedule and pricing saved successfully!");
      setShowModal(false);
      
      if (onReset) onReset();
      if (onSuccess) onSuccess();
      if (onNext) onNext();
    } catch (error) {
      console.error("Failed to save schedule and pricing:", error);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const isPending = isPricingPending || isSchedulePending;

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const selectedDaySlots = selectedDayIdx !== null ? availability[selectedDayIdx] : [];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Set Your Schedule & Pricing
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Configure your availability and set your session rates for clients.
          </p>
        </div>

        {/* Timezone Card */}
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
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Days List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-lg">Available Days</h3>
                <p className="text-sm text-gray-600 mt-1">Click a day to manage</p>
              </div>
              <div className="divide-y divide-gray-200">
                {dayLabels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (availability[index].length === 0) {
                        // Auto-add default slot if day is empty
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
                        <p className="font-medium text-gray-900">{dayNames[index]}</p>
                        <p className="text-sm text-gray-500">
                          {availability[index].length > 0 
                            ? `${availability[index].length} slot${availability[index].length !== 1 ? 's' : ''}`
                            : 'Click to add'
                          }
                        </p>
                      </div>
                      {availability[index].length > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
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
                  <span className="text-gray-600 font-medium">
                    {availability.filter(slots => slots.length > 0).length} of 7 days
                  </span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(availability.filter(slots => slots.length > 0).length / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Time Slots Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Time Slots Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {selectedDayIdx !== null ? (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {dayNames[selectedDayIdx]}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedDaySlots.length} time slot{selectedDaySlots.length !== 1 ? 's' : ''}</p>
                      </div>
                      <button
                        onClick={() => toggleDay(selectedDayIdx)}
                        className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-medium text-sm"
                      >
                        Remove Day
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    {selectedDaySlots.map((slot, slotIdx) => (
                      <div key={slotIdx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(selectedDayIdx, slotIdx, "startTime", e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700 bg-white"
                          />
                          <span className="text-gray-400 font-semibold">−</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(selectedDayIdx, slotIdx, "endTime", e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-28 bg-gray-200 text-gray-700 font-medium cursor-not-allowed"
                            disabled
                            title="End time is automatically set to 1 hour after start time"
                          />
                          {availableModes.length > 1 && (
                            <select
                              value={slot.mode}
                              onChange={(e) => updateSlot(selectedDayIdx, slotIdx, "mode", e.target.value)}
                              className="border border-gray-300 rounded-lg px-3 py-2 ml-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white font-medium"
                            >
                              {availableModes.map((mode) => (
                                <option key={mode.value} value={mode.value}>
                                  {mode.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => copySlot(selectedDayIdx, slotIdx)}
                            className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                            title="Duplicate this time slot"
                          >
                            <CopyIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => removeSlot(selectedDayIdx, slotIdx)}
                            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                            title="Delete this time slot"
                          >
                            <CancelIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => addSlot(selectedDayIdx)}
                      className="w-full mt-4 py-2 px-4 text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold flex items-center justify-center gap-2 border border-blue-200 hover:border-blue-300"
                    >
                      <AddIcon className="w-4 h-4" />
                      Add Another Time Slot
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-gray-600 font-medium">Select a day to edit time slots</p>
                </div>
              )}
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-lg">Session Pricing</h3>
                <p className="text-sm text-gray-600 mt-1">Set hourly rates for your sessions</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-700">Video Call</label>
                    {pricing.video > 0 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Set</span>}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={pricing.video || ''}
                      onChange={(e) =>
                        onPricingChange({ ...pricing, video: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter amount (e.g., 5000)"
                      min="0"
                      step="100"
                      className={`w-full pl-4 pr-16 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-medium transition ${
                        pricing.video > 0
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      ₦/hr
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-700">In-Person Session</label>
                    {pricing.inPerson > 0 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Set</span>}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={pricing.inPerson || ''}
                      onChange={(e) =>
                        onPricingChange({ ...pricing, inPerson: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter amount (e.g., 7500)"
                      min="0"
                      step="100"
                      className={`w-full pl-4 pr-16 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-medium transition ${
                        pricing.inPerson > 0
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      ₦/hr
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-700">Team session</label>
                    {pricing.group > 0 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Set</span>}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={pricing.group || ''}
                      onChange={(e) =>
                        onPricingChange({ ...pricing, group: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter amount (e.g., 3000)"
                      min="0"
                      step="100"
                      className={`w-full pl-4 pr-16 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-medium transition ${
                        pricing.group > 0
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      ₦/hr
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Per person pricing for Team sessions</p>
                </div>

                {/* Completion Checklist */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Setup Requirements:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <svg className={`w-5 h-5 ${availability.some(slots => slots.length > 0) ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={availability.some(slots => slots.length > 0) ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                        At least one day with availability
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <svg className={`w-5 h-5 ${pricing.video > 0 ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={pricing.video > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                        Video call pricing set
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <svg className={`w-5 h-5 ${pricing.inPerson > 0 ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={pricing.inPerson > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                        In-person pricing set
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <svg className={`w-5 h-5 ${pricing.group > 0 ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={pricing.group > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                        Team session pricing set
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation & Actions */}
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
          <button
            onClick={handleSaveClick}
            disabled={!availability.some(daySlots => daySlots.length > 0) || pricing.inPerson <= 0 || pricing.video <= 0 || pricing.group <= 0 || isPending}
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isPending ? "Saving..." : "Complete Setup"}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Setup</h3>
            <p className="text-gray-600 mb-6">
              Review your schedule and pricing before confirming.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Video Sessions:</span>
                <span className="font-bold text-gray-900">₦{pricing.video}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">In-Person Sessions:</span>
                <span className="font-bold text-gray-900">₦{pricing.inPerson}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Team sessions:</span>
                <span className="font-bold text-gray-900">₦{pricing.group}/hr </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-gray-700 font-medium">Days Available:</span>
                <span className="font-bold text-gray-900">
                  {availability.filter(slots => slots.length > 0).length}/7
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancel}
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