import React from "react";
import { PhoneOffIcon } from "./ControlBar";

interface SessionExpiredOverlayProps {
  isCounselor: boolean;
  onLeave: () => void;
  onOpenReview: () => void;
}

export const SessionExpiredOverlay: React.FC<SessionExpiredOverlayProps> = ({
  isCounselor,
  onLeave,
  onOpenReview,
}) => (
  <div className="absolute inset-0 z-[115] flex items-center justify-center bg-black/75 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-5 text-center px-6 max-w-sm">
      <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-white text-lg font-semibold">Session Time Ended</h2>
        <p className="text-gray-400 text-sm mt-1">
          {isCounselor
            ? "Your session has ended. You can leave a session review before exiting."
            : "Your session has ended. You may now leave the call."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {isCounselor && (
          <button
            onClick={onOpenReview}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21V4m0 0l4-1 4 1 4-1 4 1v13l-4-1-4 1-4-1-4 1V4z"
              />
            </svg>
            Session Review
          </button>
        )}
        <button
          onClick={onLeave}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors"
        >
          <PhoneOffIcon />
          Leave Call
        </button>
      </div>
    </div>
  </div>
);
