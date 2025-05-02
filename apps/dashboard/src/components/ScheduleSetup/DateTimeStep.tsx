import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const DateTimeStep: React.FC<Props> = ({ value, onChange, onNext, onBack }) => {
  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Date & Time Availability</h2>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />
      <div className="flex justify-between">
        <button onClick={onBack} className="text-Dblue font-medium">Back</button>
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

export default DateTimeStep;