import React from "react";
import { X } from "lucide-react";

interface CounselorWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  counselorName?: string;
}

const CounselorWelcomeModal: React.FC<CounselorWelcomeModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  counselorName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal content */}
        <div className="p-6 pt-8">
          {/* Success icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Welcome to DTherapist!
          </h2>

          {/* Subtitle with name if available */}
          {counselorName && (
            <p className="text-center text-gray-600 mb-4">
              Thank you for joining us, <span className="font-semibold">{counselorName}</span>
            </p>
          )}

          {/* Main message */}
          <div className="text-center space-y-3 mb-6">
            <p className="text-gray-700">
              Thank you for joining DTherapist as a counselor. 
            </p>
            <p className="text-gray-700">
              The next step is to complete your profile and credentials details 
              for you to be verified as a counselor.
            </p>
          </div>

          {/* Next steps info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-primary mb-2">Next Steps:</h3>
            <ul className="text-sm text-primary space-y-1">
              <li>• Complete your professional profile</li>
              <li>• Upload your credentials and certifications</li>
              <li>• Verify your professional information</li>
              <li>• Start helping clients once approved</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onContinue}
              className="flex-1 bg-primary text-white py-2 px-4 rounded font-medium hover:bg-primary/90 transition-colors"
            >
              Continue to Profile Setup
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-300 transition-colors"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorWelcomeModal;