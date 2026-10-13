import React, { useEffect, useRef } from "react";
import { LocalVideoTileProps, RemoteTileProps } from "../types";

export const LocalVideoTile: React.FC<LocalVideoTileProps> = ({
  track,
  isCamOn,
  isMicOn,
  isMain,
  onClick,
  isPinned,
  isSpeaking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    if (track && isCamOn) {
      const div = document.createElement("div");
      div.className = "w-full h-full";
      container.appendChild(div);
      track.play(div);
    }
  }, [track, isCamOn]);

  const avatarSize = isMain ? "w-24 h-24 text-3xl" : "w-10 h-10 text-sm";

  return (
    <div
      className={`relative w-full h-full bg-gray-900 overflow-hidden transition-all duration-200
        ${onClick ? "cursor-pointer" : ""}
        ${isPinned ? "ring-2 ring-blue-400 ring-inset" : ""}
        ${isSpeaking && !isPinned ? "ring-2 ring-green-400 ring-inset" : ""}
      `}
      onClick={onClick}
    >
      {isSpeaking && (
        <div className="absolute inset-0 ring-2 ring-green-400 ring-inset rounded-[inherit] animate-pulse pointer-events-none z-10" />
      )}
      <div ref={containerRef} className="absolute inset-0" />
      {!isCamOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div
            className={`rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold ${avatarSize}`}
          >
            👤
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        {!isMicOn && <span className="text-red-400 text-xs">🔇</span>}
        {isSpeaking && isMicOn && (
          <div className="flex items-end gap-[2px] h-3">
            <span
              className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]"
              style={{ height: "40%" }}
            />
            <span
              className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.15s_infinite]"
              style={{ height: "100%" }}
            />
            <span
              className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.3s_infinite]"
              style={{ height: "60%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const RemoteTile: React.FC<RemoteTileProps> = ({
  participant,
  isMain,
  onClick,
  isPinned,
  isSpeaking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    if (participant.hasVideo && participant.user.videoTrack) {
      const div = document.createElement("div");
      div.className = "w-full h-full";
      container.appendChild(div);
      participant.user.videoTrack.play(div);
    }
  }, [participant.hasVideo, participant.user.videoTrack]);

  const avatarSize = isMain ? "w-24 h-24 text-3xl" : "w-12 h-12 text-lg";

  return (
    <div
      className={`relative w-full h-full bg-gray-900 overflow-hidden transition-all duration-200
        ${onClick ? "cursor-pointer" : ""}
        ${isPinned ? "ring-2 ring-blue-400 ring-inset" : ""}
        ${isSpeaking && !isPinned ? "ring-2 ring-green-400 ring-inset" : ""}
      `}
      onClick={onClick}
    >
      {isSpeaking && (
        <div className="absolute inset-0 ring-2 ring-green-400 ring-inset rounded-[inherit] animate-pulse pointer-events-none z-10" />
      )}
      <div ref={containerRef} className="absolute inset-0" />
      {!participant.hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div
            className={`rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold ${avatarSize}`}
          >
            👤
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        {!participant.hasAudio && <span className="text-red-400 text-xs">🔇</span>}
        {isSpeaking && participant.hasAudio && (
          <div className="flex items-end gap-[2px] h-3">
            <span
              className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]"
              style={{ height: "40%" }}
            />
            <span
              className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.15s_infinite]"
              style={{ height: "100%" }}
            />
            <span
              className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.3s_infinite]"
              style={{ height: "60%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
