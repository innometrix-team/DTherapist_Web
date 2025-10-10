import React, { useState } from "react";
import { CancelIcon, CopyIcon, AddIcon } from "../../assets/icons";
import { MeetingPreference } from "./schedule.types";


const dayLabels = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

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
  onNext: () => void;
  onBack: () => void;
}

const DateTimeStep: React.FC<Props> = ({ 
  value, 
  onChange, 
  meetingPreference,
  selectedTimeZone,
  onTimeZoneChange,
  onNext, 
  onBack 
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
                         meetingPreference === 'Video Session' ? 'video' : 'in-person';
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
                       meetingPreference === 'Video Session' ? 'video' : 'in-person';
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

  const handleNext = () => {
    // Validate that at least one day has at least one time slot
    const hasAvailability = availability.some(daySlots => daySlots.length > 0);
    if (!hasAvailability) {
      alert("Please set availability for at least one day with a time slot.");
      return;
    }

    // Additional validation: check that all selected time slots have valid times
    const hasValidTimes = availability.every(daySlots => 
      daySlots.every(slot => {
        if (!slot.startTime || !slot.endTime) return false;
        // End time is automatically set to 1 hour after start, so just check they exist
        return true;
      })
    );

    if (!hasValidTimes) {
      alert("Please ensure all time slots have valid start and end times.");
      return;
    }

    onNext();
  };

  // Check if at least one day has availability
  const hasAvailability = availability.some(daySlots => daySlots.length > 0);

  // Get available modes based on meeting preference
  const getAvailableModes = () => {
    switch (meetingPreference) {
      case 'In-person':
        return [{ value: 'in-person', label: 'In-Person' }];
      case 'Video Session':
        return [{ value: 'video', label: 'Video' }];
      case 'Both':
        return [
          { value: 'in-person', label: 'In-Person' },
          { value: 'video', label: 'Video' },
          { value: 'both', label: 'Both' }
        ];
      default:
        return [
          { value: 'in-person', label: 'In-Person' },
          { value: 'video', label: 'Video' },
          { value: 'both', label: 'Both' }
        ];
    }
  };

  const availableModes = getAvailableModes();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        When are you available to meet with people?
      </h1>
      <p className="text-sm text-gray-600 mb-8">
        Select the days and times when you're available to meet with clients. You need to set availability for at least one day.
      </p>

      <div className="mb-6 flex items-center">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <select
            value={selectedTimeZone}
            onChange={(e) => onTimeZoneChange(e.target.value)}
            className="border-none bg-transparent focus:outline-none text-gray-700 pr-8"
          >
            {timeZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {dayLabels.map((dayLabel, index) => (
          <div key={index} className="flex items-start">
            <button
              onClick={() => toggleDay(index)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 transition ${
                availability[index].length
                  ? "bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {dayLabel}
            </button>

            {availability[index].length === 0 ? (
              <div className="flex items-center">
                <span className="text-gray-500 font-medium">Unavailable</span>
                <button className="ml-2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                {availability[index].map((slot, slotIdx) => (
                  <div key={slotIdx} className="flex items-center gap-4">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, slotIdx, "startTime", e.target.value)}
                      className="border rounded px-3 py-2 w-24"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, slotIdx, "endTime", e.target.value)}
                      className="border rounded px-3 py-2 w-24 bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                    {availableModes.length > 1 && (
                      <select
                        value={slot.mode}
                        onChange={(e) => updateSlot(index, slotIdx, "mode", e.target.value)}
                        className="border rounded px-3 py-2"
                      >
                        {availableModes.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => removeSlot(index, slotIdx)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove slot"
                      >
                        <CancelIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => copySlot(index, slotIdx)}
                        className="text-gray-600 hover:text-black"
                        title="Copy slot"
                      >
                        <CopyIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => addSlot(index)}
                  className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  <AddIcon className="w-4 h-4" />
                  Add Time
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-10">
        <button
          onClick={onBack}
          className="flex items-center text-blue-700 font-medium"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!hasAvailability}
          className="bg-blue-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default DateTimeStep;