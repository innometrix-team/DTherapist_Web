import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeSession } from "../../api/Appointments.api";

interface SessionCompletionModalProps {
  bookingId: string;
  isOpen: boolean;
  userType: "client" | "therapist";
  onError?: (error: string) => void;
}

const CheckIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-8 w-8"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  bookingId,
  isOpen,
  userType,
  onError,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [completionState, setCompletionState] = useState<
    "pending" | "waiting" | "completed"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleComplete = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await completeSession(bookingId);

      if (!result || !result.data) {
        throw new Error("Failed to complete session");
      }

      const booking = result.data.booking;

      // Check if both parties have confirmed
      if (booking.clientCompleted && booking.therapistCompleted) {
        setCompletionState("completed");
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 3000);
      } else {
        // Waiting for other party
        setCompletionState("waiting");
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error 
          ? error.message 
          : "Failed to complete session. Please try again.";
      setErrorMessage(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirect = () => {
    if (completionState === "completed") {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
        {completionState === "pending" && (
          <>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Complete Session
              </h2>
              <p className="text-gray-600">
                Please confirm that this therapy session has been completed.
                Both you and the{" "}
                {userType === "client" ? "therapist" : "client"} need to
                confirm before the session is marked as complete.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Confirming...</span>
                  </>
                ) : (
                  "Confirm Completion"
                )}
              </button>
            </div>
          </>
        )}

        {completionState === "waiting" && (
          <>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Confirmation Received
              </h2>
              <p className="text-gray-600">
                Thank you for confirming! Waiting for the{" "}
                {userType === "client" ? "therapist" : "client"} to confirm
                completion.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  You can safely close this window. You'll be notified once both
                  parties have confirmed.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </>
        )}

        {completionState === "completed" && (
          <>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckIcon />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Session Completed!
              </h2>
              <p className="text-gray-600">
                Both parties have confirmed completion. 
                {userType === "therapist" && " Your payout has been released to your wallet."}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm font-medium">
                  ✓ Session marked as complete
                </p>
                {userType === "therapist" && (
                  <p className="text-green-800 text-sm">
                    ✓ Payment released to wallet
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleRedirect}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </button>

            <p className="text-center text-sm text-gray-500">
              Redirecting in 3 seconds...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionCompletionModal;