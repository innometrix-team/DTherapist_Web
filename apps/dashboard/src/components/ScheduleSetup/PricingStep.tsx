import React, { useState } from 'react';

interface Props {
  pricing: {
    inPerson: number;
    video: number;
  };
  onChange: (pricing: { inPerson: number; video: number }) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const PricingStep: React.FC<Props> = ({ pricing, onChange, onSubmit, onBack }) => {
  const [showModal, setShowModal] = useState(false);

  const handleUpdateClick = () => {
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    onSubmit(); // this will call the backend
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto relative">
      <h2 className="text-xl font-semibold mb-6">Pricing</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="w-40 font-medium">In-person Session</label>
          <input
            type="number"
            value={pricing.inPerson}
            onChange={(e) =>
              onChange({ ...pricing, inPerson: parseFloat(e.target.value) })
            }
            className="flex-1 p-3 border rounded"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="w-40 font-medium">Video Session</label>
          <input
            type="number"
            value={pricing.video}
            onChange={(e) =>
              onChange({ ...pricing, video: parseFloat(e.target.value) })
            }
            className="flex-1 p-3 border rounded"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="text-Dblue font-medium">
          Back
        </button>
        <button
          onClick={handleUpdateClick}
          disabled={pricing.inPerson <= 0 || pricing.video <= 0}
          className="bg-Dblue text-white px-6 py-2 rounded disabled:opacity-50"
        >
          Update
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Update</h3>
            <p className="mb-6">Are you sure you want to update your pricing?</p>
            <div className="flex flex-row justify-end gap-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-Dblue text-white rounded"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingStep;
