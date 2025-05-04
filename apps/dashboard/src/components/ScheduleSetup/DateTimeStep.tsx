import React, { useState } from "react";
import { FaChevronLeft, FaPlus, FaTrash } from "react-icons/fa";


const days = ["Sun", "Mon", "Tues", "Wed", "Thr", "Fri", "Sat"];

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const DateTimeStep: React.FC<Props> = ({ onNext, onBack })=> {
  const [availability, setAvailability] = useState(
    Array(7).fill([])
  );
  

  const toggleAvailability = (index: number) => {
    const updated = [...availability];
    if (updated[index].length === 0) {
      updated[index] = [
        { startTime: "", endTime: "", mode: "in-person" }
      ];
    } else {
      updated[index] = [];
    }
    setAvailability(updated);
  };

  const updateTime = (dayIndex: number, slotIndex: number, field: "startTime" | "endTime" | "mode", value: string) => {
    const updated = [...availability];
    updated[dayIndex][slotIndex][field] = value;
    setAvailability(updated);
  };

  const addSlot = (dayIndex: number) => {
    const updated = [...availability];
    updated[dayIndex].push({ startTime: "", endTime: "", mode: "in-person" });
    setAvailability(updated);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const updated = [...availability];
    updated[dayIndex].splice(slotIndex, 1);
    setAvailability(updated);
  };

  return (
    <div className="p-6 space-y-6">
      

      <h2 className="text-2xl font-semibold">Select Date & Time</h2>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div
            key={index}
            className={`rounded-full w-12 h-12 flex items-center justify-center text-white font-semibold cursor-pointer ${
              availability[index].length ? "bg-blue-600" : "bg-gray-400"
            }`}
            onClick={() => toggleAvailability(index)}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {availability.map((slots, dayIndex) => (
          slots.length > 0 && (
            <div key={dayIndex} className="space-y-2">
              {slots.map((slot: { startTime: string; endTime: string; mode: string }, slotIndex: number) => (
                <div key={slotIndex} className="flex flex-wrap items-center gap-4">
                  <label className="w-24 font-medium">Day {dayIndex + 1}</label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTime(dayIndex, slotIndex, "startTime", e.target.value)}
                    className="border px-3 py-1 rounded"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTime(dayIndex, slotIndex, "endTime", e.target.value)}
                    className="border px-3 py-1 rounded"
                  />
                  <select
                    value={slot.mode}
                    onChange={(e) => updateTime(dayIndex, slotIndex, "mode", e.target.value)}
                    className="border px-3 py-1 rounded"
                  >
                    <option value="in-person">In-person</option>
                    <option value="online">Online</option>
                    <option value="both">Both</option>
                  </select>
                  <button
                    onClick={() => removeSlot(dayIndex, slotIndex)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addSlot(dayIndex)}
                className="text-green-600 flex items-center gap-1 hover:text-green-800"
              >
                <FaPlus /> Add Time
              </button>
            </div>
          )
        ))}
      </div>

      <button
        onClick={onNext}
        disabled = {availability.length == 0}
        className="bg-Dblue hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Continue
      </button>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 font-medium"
      >
        <FaChevronLeft /> Back
      </button>
    </div>
  );
};

export default DateTimeStep