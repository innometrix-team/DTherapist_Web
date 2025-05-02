import React, { useState } from 'react';
import { availabilityDays } from '../../constants/schedule.constants';
import { FaArrowLeft, FaCheck, FaPlus } from 'react-icons/fa';

interface Props {
  selectedDays: string[];
  onChange: (day: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const AvailabilityStep: React.FC<Props> = ({ selectedDays, onChange, onNext, onBack }) => {
  const [timezone, setTimezone] = useState('GMT+1');

  const toggleDay = (day: string) => {
    onChange(day);
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Availability</h2>

      {/* Timezone Select */}
      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="GMT+1">GMT+1 (West Africa Time)</option>
          <option value="GMT">GMT</option>
          <option value="EST">EST</option>
          <option value="PST">PST</option>
        </select>
      </div>

      {/* Days Grid */}
      <div className="grid  gap-2 justify-between items-center text-center">
        {availabilityDays.map((day) => {
          const abbrev = day.charAt(0);
          const isSelected = selectedDays.includes(day);
          return (
            <div key={day} className="flex flex-row gap-3 justify-between items-center space-y-1">
              <button
                onClick={() => toggleDay(day)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border text-sm font-bold ${
                  isSelected ? 'bg-Dblue text-white border-Dblue' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {abbrev}
              </button>
              <div className="text-xs flex items-center space-x-1">
                <span>{isSelected ? 'Available' : 'Unavailable'}</span>
                {isSelected ? <FaCheck className="text-green-500 text-sm" /> : <FaPlus className="text-gray-500 text-sm" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-Dblue font-medium flex items-center space-x-1">
          <FaArrowLeft />
          <span>Back</span>
        </button>
        <button
          onClick={onNext}
          disabled={selectedDays.length === 0}
          className="bg-Dblue text-white px-6 py-2 rounded disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AvailabilityStep;