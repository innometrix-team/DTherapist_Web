import React, { JSX } from 'react';
import { MeetingPreference } from './schedule.types';
import { MeetingIcon, RescheduleIcon } from '../../assets/icons';

interface Props {
  value: MeetingPreference;
  onChange: (val: MeetingPreference) => void;
  onNext: () => void;
  onBack: () => void;
}

// Icon component for Team session
const GroupIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MeetingPreferenceStep: React.FC<Props> = ({ value, onChange, onNext, onBack }) => {
  const options: { label: MeetingPreference; icon: JSX.Element }[] = [
    { label: 'In-person', icon: <RescheduleIcon className='fill-current' /> },
    { label: 'Video Session', icon: <MeetingIcon className='fill-current'/> },
    { label: 'Team Session', icon: <GroupIcon className='fill-current'/> },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            How would you like to meet?
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Select your preferred meeting format. You can always change this later.
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {options.map(({ label, icon }) => {
            const isSelected = value === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange(label)}
                className={`flex flex-col items-center justify-center gap-4 p-8 rounded-lg border-2 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-600 shadow-lg' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                }`}
              >
                <span className={`text-5xl transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                  {React.cloneElement(icon, { 
                    className: 'w-12 h-12',
                    stroke: "currentColor", 
                    strokeWidth: 0.5
                  })}
                </span>
                <span className={`text-lg font-semibold transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!value}
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Continue
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingPreferenceStep;