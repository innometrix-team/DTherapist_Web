import React from 'react';
import { MeetingPreference } from '../../types/schedule.types';
import { FaUser, FaVideo, FaExchangeAlt } from 'react-icons/fa';

interface Props {
  value: MeetingPreference;
  onChange: (val: MeetingPreference) => void;
  onNext: () => void;
}

const MeetingPreferenceStep: React.FC<Props> = ({ value, onChange, onNext }) => {
  const options: { label: MeetingPreference; icon: JSX.Element }[] = [
    { label: 'In-person', icon: <FaUser className="text-xl" /> },
    { label: 'Video Session', icon: <FaVideo className="text-xl" /> },
    { label: 'Both', icon: <FaExchangeAlt className="text-xl" /> },
  ];

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Meeting Preference</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(({ label, icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`flex flex-col items-center border p-4 rounded-lg text-center font-medium transition-all duration-300 space-y-2 ${
              value === label ? 'bg-Dblue text-white border-Dblue' : 'bg-gray-50 text-gray-700'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 text-right">
        <button
          onClick={onNext}
          disabled={!value}
          className="bg-Dblue text-white px-6 py-2 rounded disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MeetingPreferenceStep;