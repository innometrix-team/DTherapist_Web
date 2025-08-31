import React from "react";
import { X } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  userName?: string;
  userRole?: string;
}

const CounselorWelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  userName,
  userRole,
}) => {
  if (!isOpen) return null;

  const isTherapist = userRole === "therapist";
  const isClient = userRole === "client";

  // Content based on user role
  const getContent = () => {
    if (isTherapist) {
      return {
        title: "Welcome to DTherapist!",
        subtitle: `Thank you for joining us, ${userName}`,
        mainMessage: "Thank you for joining DTherapist as a counselor.",
        secondaryMessage: "The next step is to complete your profile and credentials details for you to be verified as a counselor.",
        nextSteps: {
          title: "Next Steps:",
          items: [
            "Complete your professional profile",
            "Upload your credentials and certifications", 
            "Verify your professional information",
            "Start helping clients once approved"
          ]
        },
        continueButtonText: "Continue to Profile Setup",
        laterButtonText: "I'll do this later"
      };
    } else if (isClient) {
      return {
        title: "Welcome to DTherapist!",
        subtitle: `Welcome, ${userName}`,
        mainMessage: "Thank you for joining DTherapist.",
        secondaryMessage: "To enjoy all the functions and get the best experience on DTherapist, please complete your profile setup.",
        nextSteps: {
          title: "Complete Your Profile To:",
          items: [
            "Get personalized therapy recommendations",
            "Book sessions with verified counselors",
            "Access your therapy history and progress",
            "Receive tailored mental health resources"
          ]
        },
        continueButtonText: "Complete Profile Setup",
        laterButtonText: "I'll do this later"
      };
    } else {
      // Fallback for unknown role
      return {
        title: "Welcome to DTherapist!",
        subtitle: userName ? `Welcome, ${userName}` : "Welcome!",
        mainMessage: "Thank you for joining DTherapist.",
        secondaryMessage: "Please complete your profile setup to get the most out of your DTherapist experience.",
        nextSteps: {
          title: "Next Steps:",
          items: [
            "Complete your profile information",
            "Set your preferences",
            "Explore available features",
            "Start your journey with DTherapist"
          ]
        },
        continueButtonText: "Continue Setup",
        laterButtonText: "I'll do this later"
      };
    }
  };

  const content = getContent();

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
            {content.title}
          </h2>

          {/* Subtitle with name if available */}
          {userName && (
            <p className="text-center text-gray-600 mb-4">
              {content.subtitle}
            </p>
          )}

          {/* Main message */}
          <div className="text-center space-y-3 mb-6">
            <p className="text-gray-700">
              {content.mainMessage}
            </p>
            <p className="text-gray-700">
              {content.secondaryMessage}
            </p>
          </div>

          {/* Next steps info */}
          <div className={`${isClient ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-6`}>
            <h3 className="font-semibold text-primary mb-2">{content.nextSteps.title}</h3>
            <ul className="text-sm text-primary space-y-1">
              {content.nextSteps.items.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onContinue}
              className="flex-1 bg-primary text-white py-2 px-4 rounded font-medium hover:bg-primary/90 transition-colors"
            >
              {content.continueButtonText}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-300 transition-colors"
            >
              {content.laterButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorWelcomeModal;