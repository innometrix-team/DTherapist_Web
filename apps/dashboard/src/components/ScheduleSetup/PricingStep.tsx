import React from 'react';

interface Props {
  pricing: {
    inPerson: number;
    video: number;
  };
  onChange: (pricing: { inPerson: number; video: number }) => void;
  onNext: () => void;
  onBack: () => void;
}

const PricingStep: React.FC<Props> = ({ pricing, onChange, onNext, onBack }) => {
  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Pricing</h2>
      <div className="mb-4">
        <label className="block mb-2 font-medium">In-person Session</label>
        <input
          type="number"
          value={pricing.inPerson}
          onChange={(e) => onChange({ ...pricing, inPerson: parseFloat(e.target.value) })}
          className="w-full p-3 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Video Session</label>
        <input
          type="number"
          value={pricing.video}
          onChange={(e) => onChange({ ...pricing, video: parseFloat(e.target.value) })}
          className="w-full p-3 border rounded"
        />
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="text-Dblue font-medium">Back</button>
        <button
          onClick={onNext}
          disabled={pricing.inPerson <= 0 || pricing.video <= 0}
          className="bg-Dblue text-white px-6 py-2 rounded disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PricingStep;