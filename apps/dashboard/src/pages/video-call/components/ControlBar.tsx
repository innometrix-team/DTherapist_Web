import React from "react";

export const MicIcon = ({ muted }: { muted: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {muted ? (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
        />
      </>
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    )}
  </svg>
);

export const VideoIcon = ({ disabled }: { disabled: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {disabled ? (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3l18 18"
        />
      </>
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    )}
  </svg>
);

export const PhoneOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 16.5v2.25A2.25 2.25 0 005.25 21h2.25m-7.5-4.5h7.5m-7.5 0V9.25A2.25 2.25 0 015.25 7h2.25m12 9.75h-7.5m7.5 0V9.25A2.25 2.25 0 0118.75 7h-2.25"
    />
  </svg>
);

export const ChatIcon = ({ hasUnread }: { hasUnread: boolean }) => (
  <div className="relative">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
    {hasUnread && (
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-gray-900" />
    )}
  </div>
);

export const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export interface ControlBarProps {
  isJoined: boolean;
  isLoadingToken: boolean;
  isJoining: boolean;
  isMicOn: boolean;
  isCamOn: boolean;
  showParticipants: boolean;
  isChatOpen: boolean;
  chatUnread: number;
  onJoin: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isJoined,
  isLoadingToken,
  isJoining,
  isMicOn,
  isCamOn,
  showParticipants,
  isChatOpen,
  chatUnread,
  onJoin,
  onToggleMic,
  onToggleCam,
  onToggleParticipants,
  onToggleChat,
  onLeave,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent z-[110]">
      <div className="flex items-center justify-center gap-2">
        {!isJoined ? (
          <button
            onClick={onJoin}
            disabled={isLoadingToken || isJoining}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors flex items-center gap-2"
          >
            {isJoining || isLoadingToken ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Connecting…
              </>
            ) : (
              "Join Call"
            )}
          </button>
        ) : (
          <>
            <button
              onClick={onToggleMic}
              title={isMicOn ? "Mute" : "Unmute"}
              className={`p-3 rounded-full transition-all duration-200 group relative ${isMicOn ? "bg-gray-800/80 hover:bg-gray-700/80 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
            >
              <MicIcon muted={!isMicOn} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {isMicOn ? "Mute" : "Unmute"}
              </span>
            </button>

            <button
              onClick={onToggleCam}
              title={isCamOn ? "Turn off camera" : "Turn on camera"}
              className={`p-3 rounded-full transition-all duration-200 group relative ${isCamOn ? "bg-gray-800/80 hover:bg-gray-700/80 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
            >
              <VideoIcon disabled={!isCamOn} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {isCamOn ? "Turn off camera" : "Turn on camera"}
              </span>
            </button>

            <button
              onClick={onToggleParticipants}
              title="Participants"
              className={`p-3 rounded-full transition-all duration-200 group relative ${showParticipants ? "bg-blue-600 text-white" : "bg-gray-800/80 hover:bg-gray-700/80 text-white"}`}
            >
              <UsersIcon />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                Participants
              </span>
            </button>

            <button
              onClick={onToggleChat}
              title="Chat"
              className={`p-3 rounded-full transition-all duration-200 group relative ${isChatOpen ? "bg-blue-600 text-white" : "bg-gray-800/80 hover:bg-gray-700/80 text-white"}`}
            >
              <ChatIcon hasUnread={!isChatOpen && chatUnread > 0} />
              {!isChatOpen && chatUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {isChatOpen ? "Close chat" : "Open chat"}
              </span>
            </button>

            <button
              onClick={onLeave}
              title="Leave call"
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 group relative"
            >
              <PhoneOffIcon />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                Leave call
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
