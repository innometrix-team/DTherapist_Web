import React, { JSX } from 'react';
import { MeetingPreference } from './schedule.types';
import { ScheduleIcon1, ScheduleIcon2, ScheduleIcon3 } from '../../assets/icons';

interface Props {
  value: MeetingPreference;
  onChange: (val: MeetingPreference) => void;
  onNext: () => void;
}

const MeetingPreferenceStep: React.FC<Props> = ({ value, onChange, onNext }) => {
  const options: { label: MeetingPreference; icon: JSX.Element }[] = [
    { label: 'In-person', icon: <ScheduleIcon3 className='fill-current' /> },
    { label: 'Video Session', icon: <ScheduleIcon2 className='fill-current'/> },
    { label: 'Both', icon: <ScheduleIcon1 className='fill-current'/> },
  ];

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl">
      <h2 className="text-2xl font-semibold mb-2">How would you like to meet people?</h2>
      <p className="text-gray-600 mb-6">
        Set a meeting location for your clients — you can always change it later.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map(({ label, icon }) => {
          const isSelected = value === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(label)}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-300
                ${isSelected ? 'bg-primary text-white border-Dblue' : 'bg-gray-50 text-gray-700 border-gray-300'}`}
            >
              <span className={`text-2xl  ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                {React.cloneElement(icon, { className: 'w-6 h-6 current-fill ',  stroke:"currentColor", strokeWidth:0.5})}
              </span>
              <span className="text-base font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={onNext}
          disabled={!value}
          className="bg-primary text-white px-6 py-2 rounded disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MeetingPreferenceStep;
