import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Appointment } from "../../api/Appointments.api";
import { fetchAgoraRtcToken } from "../../api/Agora.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import InCallChat from "../../components/VideoChat/inCallChat";
import PostCallReviewModal from "../../components/appointment/Postcallreviewmodal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgoraState {
  agora?: {
    appId: string;
    channel: string;
    token?: string;
    uid?: number;
  };
  appointment?: Appointment;
  sessionDuration?: number;
}

interface RemoteUserState {
  user: IAgoraRTCRemoteUser;
  hasVideo: boolean;
  hasAudio: boolean;
  displayName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const gridColumns = (total: number): number => {
  if (total <= 1) return 1;
  if (total <= 2) return 2;
  if (total === 3) return 3;
  if (total <= 4) return 2;
  if (total <= 6) return 3;
  return 4;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const MicIcon = ({ muted }: { muted: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {muted ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    )}
  </svg>
);

const VideoIcon = ({ disabled }: { disabled: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {disabled ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    )}
  </svg>
);

const PhoneOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 16.5v2.25A2.25 2.25 0 005.25 21h2.25m-7.5-4.5h7.5m-7.5 0V9.25A2.25 2.25 0 015.25 7h2.25m12 9.75h-7.5m7.5 0V9.25A2.25 2.25 0 0118.75 7h-2.25" />
  </svg>
);

const ChatIcon = ({ hasUnread }: { hasUnread: boolean }) => (
  <div className="relative">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    {hasUnread && (
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-gray-900" />
    )}
  </div>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─── Local Video Tile ─────────────────────────────────────────────────────────

interface LocalVideoTileProps {
  track: ICameraVideoTrack | null;
  isCamOn: boolean;
  isMicOn: boolean;
  displayName: string;
  isMain: boolean;
  onClick?: () => void;
  isPinned?: boolean;
  isSpeaking?: boolean;
}

const LocalVideoTile: React.FC<LocalVideoTileProps> = ({
  track, isCamOn, isMicOn, displayName, isMain, onClick, isPinned, isSpeaking,
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
          <div className={`rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold ${avatarSize}`}>
            {getInitials(displayName)}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <div className={`px-2 py-0.5 backdrop-blur-sm rounded text-white text-xs font-medium transition-colors duration-200 ${isSpeaking ? "bg-green-500/70" : "bg-black/60"}`}>
          {displayName} (You)
        </div>
        {!isMicOn && <span className="text-red-400 text-xs">🔇</span>}
        {isSpeaking && isMicOn && (
          <div className="flex items-end gap-[2px] h-3">
            <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]" style={{ height: "40%" }} />
            <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.15s_infinite]" style={{ height: "100%" }} />
            <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.3s_infinite]" style={{ height: "60%" }} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Remote Tile ──────────────────────────────────────────────────────────────

interface RemoteTileProps {
  participant: RemoteUserState;
  isMain: boolean;
  onClick?: () => void;
  isPinned?: boolean;
  isSpeaking?: boolean;
}

const RemoteTile: React.FC<RemoteTileProps> = ({ participant, isMain, onClick, isPinned, isSpeaking }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    if (participant.hasVideo && participant.user.videoTrack) {
      const div = document.createElement("div");
      div.className = "w-full h-full";
      container.appendChild(div);
      (participant.user.videoTrack as IRemoteVideoTrack).play(div);
    }
  }, [participant.hasVideo, participant.user.videoTrack]);

  const avatarSize = isMain ? "w-24 h-24 text-3xl" : "w-12 h-12 text-lg";

  return (
    <div
      className={`relative bg-gray-900 overflow-hidden w-full h-full transition-all duration-200
        ${!isMain ? "rounded-xl border border-gray-700" : ""}
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
          <div className={`rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold ${avatarSize}`}>
            {getInitials(participant.displayName)}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <div className={`px-2 py-0.5 backdrop-blur-sm rounded text-white text-xs font-medium transition-colors duration-200 ${isSpeaking ? "bg-green-500/70" : "bg-black/60"}`}>
          {participant.displayName || `User ${participant.user.uid}`}
        </div>
        {!participant.hasAudio && (
          <div className="w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">🔇</span>
          </div>
        )}
        {isSpeaking && participant.hasAudio && (
          <div className="flex items-end gap-[2px] h-3">
            <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]" style={{ height: "40%" }} />
            <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.15s_infinite]" style={{ height: "100%" }} />
            <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.6s_ease-in-out_0.3s_infinite]" style={{ height: "60%" }} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Session Expired Overlay ──────────────────────────────────────────────────

interface SessionExpiredOverlayProps {
  isCounselor: boolean;
  onLeave: () => void;
  onOpenReview: () => void;
}

const SessionExpiredOverlay: React.FC<SessionExpiredOverlayProps> = ({
  isCounselor,
  onLeave,
  onOpenReview,
}) => (
  <div className="absolute inset-0 z-[115] flex items-center justify-center bg-black/75 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-5 text-center px-6 max-w-sm">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 21V4m0 0l4-1 4 1 4-1 4 1v13l-4-1-4 1-4-1-4 1V4z" />
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

// ─── Main Component ───────────────────────────────────────────────────────────

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { name, role } = useAuthStore();
  const { state } = useLocation() as { state?: AgoraState };
  const displayName = name || "You";
  const isMobile = useIsMobile();
  const isCounselor = role === "counselor";

  const [appId, setAppId] = useState<string | undefined>(state?.agora?.appId);
  const [channel, setChannel] = useState<string | undefined>(state?.agora?.channel);
  const [uid, setUid] = useState<number>(state?.agora?.uid ?? 0);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinStep, setJoinStep] = useState<string>("Connecting…");

  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  // Tracks whether the timer has already fired the expiry modal so it only opens once
  const sessionExpiredFiredRef = useRef(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const [remoteUsers, setRemoteUsers] = useState<RemoteUserState[]>([]);
  const [pinnedUid, setPinnedUid] = useState<number | string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [activeSpeakerUid, setActiveSpeakerUid] = useState<number | string | null>(null);

  // ── Session-expired state ──────────────────────────────────────────────────
  const [sessionExpired, setSessionExpired] = useState(false);
  // Review modal — opens after expiry (counselor) or manually via leave flow
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // ── Timer ──────────────────────────────────────────────────────────────────

  const parseTimeToTimestamp = (dateStr: string, timeStr: string): number | null => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return null;
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      if (period === "PM" && hours !== 12) hours += 12;
      else if (period === "AM" && hours === 12) hours = 0;
      return Math.floor(new Date(year, month - 1, day, hours, minutes).getTime() / 1000);
    } catch { return null; }
  };

  useEffect(() => {
    if (!state?.appointment) return;
    const apt = state.appointment;
    const timeParts = apt.time?.split(" - ");
    if (timeParts?.length === 2) {
      const end = parseTimeToTimestamp(apt.date, timeParts[1]);
      if (end) { const rem = end - Math.floor(Date.now() / 1000); setRemainingTime(rem > 0 ? rem : 0); return; }
    }
    const expiresAt = apt.action?.agoraToken?.expiresAt;
    if (expiresAt) { const rem = parseInt(expiresAt) - Math.floor(Date.now() / 1000); setRemainingTime(rem > 0 ? rem : 0); }
  }, [state]);

  useEffect(() => {
    if (remainingTime === null) return;

    // Already at zero on mount (e.g. stale link)
    if (remainingTime === 0 && !sessionExpiredFiredRef.current) {
      sessionExpiredFiredRef.current = true;
      if (isJoined) setSessionExpired(true);
      return;
    }

    if (remainingTime <= 0) return;

    timerIntervalRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          // Fire session-expired overlay only once and only when already in the call
          if (!sessionExpiredFiredRef.current) {
            sessionExpiredFiredRef.current = true;
            // Use a timeout so state updates don't collide
            setTimeout(() => setSessionExpired(true), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [remainingTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!appId) setAppId(import.meta.env.VITE_AGORA_APP_ID);
    if (!channel) setChannel(state?.agora?.channel);
    if (!uid) setUid(state?.agora?.uid ?? 0);
  }, []); // eslint-disable-line

  // ── Token ──────────────────────────────────────────────────────────────────

  const getFreshRtcToken = useCallback(async () => {
    if (!channel) return null;
    try {
      setIsLoadingToken(true);
      const result = await fetchAgoraRtcToken(channel, uid);
      return result?.data ?? null;
    } catch (err) {
      console.error("RTC token fetch failed:", err);
      throw err;
    } finally { setIsLoadingToken(false); }
  }, [channel, uid]);

  // ── Agora event listeners ──────────────────────────────────────────────────

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }
    const client = clientRef.current;

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      await client.subscribe(user, mediaType);
      if (mediaType === "audio" && user.audioTrack) (user.audioTrack as IRemoteAudioTrack).play();
      setRemoteUsers((prev) => {
        const existing = prev.find((u) => u.user.uid === user.uid);
        if (existing) {
          return prev.map((u) =>
            u.user.uid === user.uid
              ? { ...u, user, hasVideo: mediaType === "video" ? true : u.hasVideo, hasAudio: mediaType === "audio" ? true : u.hasAudio }
              : u
          );
        }
        return [...prev, {
          user,
          hasVideo: mediaType === "video",
          hasAudio: mediaType === "audio",
          displayName: state?.appointment?.fullName || `Participant ${user.uid}`,
        }];
      });
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      setRemoteUsers((prev) =>
        prev.map((u) =>
          u.user.uid === user.uid
            ? { ...u, hasVideo: mediaType === "video" ? false : u.hasVideo, hasAudio: mediaType === "audio" ? false : u.hasAudio }
            : u
        )
      );
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers((prev) => prev.filter((u) => u.user.uid !== user.uid));
      setPinnedUid((prev) => (prev === user.uid ? null : prev));
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    client.enableAudioVolumeIndicator();
    const handleVolumeIndicator = (volumes: Array<{ uid: number | string; level: number }>) => {
      const THRESHOLD = 5;
      const loudest = volumes.find((v) => v.level >= THRESHOLD);
      setActiveSpeakerUid(loudest ? loudest.uid : null);
    };
    client.on("volume-indicator", handleVolumeIndicator);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
      client.off("volume-indicator", handleVolumeIndicator);
    };
  }, []); // eslint-disable-line

  // ── Preview tracks ─────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        if (!localAudioRef.current) {
          localAudioRef.current = await AgoraRTC.createMicrophoneAudioTrack();
          await localAudioRef.current.setEnabled(isMicOn);
        }
        if (!localVideoTrackRef.current) {
          const track = await AgoraRTC.createCameraVideoTrack();
          await track.setEnabled(isCamOn);
          localVideoTrackRef.current = track;
          setLocalVideoTrack(track);
        }
      } catch (e) { console.error("preview error", e); }
    })();
  }, []); // eslint-disable-line

  // ── Join ───────────────────────────────────────────────────────────────────

  const join = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !appId || !channel) { alert("Video is not ready yet. Missing Agora credentials."); return; }
    try {
      setIsJoining(true);
      setJoinStep("Fetching session token…");
      const tokenData = await getFreshRtcToken();
      if (!tokenData?.token) { alert("Failed to get token."); return; }

      setJoinStep("Joining the channel…");
      await client.join(appId, channel, tokenData.token, tokenData.uid);
      setUid(tokenData.uid);

      setJoinStep("Setting up microphone…");
      if (!localAudioRef.current) {
        localAudioRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        await localAudioRef.current.setEnabled(isMicOn);
      }

      setJoinStep("Setting up camera…");
      if (!localVideoTrackRef.current) {
        const track = await AgoraRTC.createCameraVideoTrack();
        await track.setEnabled(isCamOn);
        localVideoTrackRef.current = track;
        setLocalVideoTrack(track);
      }

      setJoinStep("Publishing your stream…");
      await client.publish([
        ...(localAudioRef.current ? [localAudioRef.current] : []),
        ...(localVideoTrackRef.current ? [localVideoTrackRef.current] : []),
      ]);

      setIsJoined(true);
    } catch {
      alert("Failed to join. Please check your connection and try again.");
    } finally {
      setIsJoining(false);
    }
  }, [appId, channel, isMicOn, isCamOn, getFreshRtcToken]);

  // ── Leave ──────────────────────────────────────────────────────────────────

  const leave = useCallback(async () => {
    try {
      localAudioRef.current?.close();
      localVideoTrackRef.current?.close();
      localAudioRef.current = null;
      localVideoTrackRef.current = null;
      setLocalVideoTrack(null);
      await clientRef.current?.leave();
    } finally {
      setIsJoined(false);
      setRemoteUsers([]);
      setPinnedUid(null);
      setSessionExpired(false);
    }
  }, []);

  useEffect(() => () => { leave(); }, [leave]);

  // ── Leave (manual — no review modal) ──────────────────────────────────────

  const handleLeave = useCallback(async () => {
    await leave();
    navigate(-1);
  }, [leave, navigate]);

  // Called from the expired overlay "Leave Call" button
  const handleLeaveAfterExpiry = useCallback(async () => {
    await leave();
    navigate(-1);
  }, [leave, navigate]);

  const handleOpenReviewFromExpiry = useCallback(async () => {
    // Close video infrastructure but stay on page for the modal
    await leave();
    setReviewModalOpen(true);
  }, [leave]);

  // After the review modal closes post-expiry, navigate away
  const handleReviewModalClose = useCallback(() => {
    setReviewModalOpen(false);
    navigate(-1);
  }, [navigate]);

  // ── Controls ───────────────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (localAudioRef.current) await localAudioRef.current.setEnabled(next);
  }, [isMicOn]);

  const toggleCam = useCallback(async () => {
    const next = !isCamOn;
    setIsCamOn(next);
    if (!localVideoTrackRef.current) {
      const track = await AgoraRTC.createCameraVideoTrack();
      localVideoTrackRef.current = track;
      setLocalVideoTrack(track);
    }
    await localVideoTrackRef.current.setEnabled(next);
  }, [isCamOn]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const totalParticipants = 1 + remoteUsers.length;

  // ── Desktop Layout ─────────────────────────────────────────────────────────

  const desktopLayout = () => {
    if (pinnedUid) {
      const pinnedRemote = remoteUsers.find((u) => u.user.uid === pinnedUid);
      const stripItems: Array<"local" | RemoteUserState> = [
        "local",
        ...remoteUsers.filter((u) => u.user.uid !== pinnedUid),
      ];

      return (
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            {pinnedRemote ? (
              <RemoteTile
                participant={pinnedRemote}
                isMain={true}
                onClick={() => setPinnedUid(null)}
                isPinned
                isSpeaking={activeSpeakerUid === pinnedRemote.user.uid}
              />
            ) : (
              <LocalVideoTile
                track={localVideoTrack}
                isCamOn={isCamOn}
                isMicOn={isMicOn}
                displayName={displayName}
                isMain={true}
                onClick={() => setPinnedUid(null)}
                isPinned
                isSpeaking={activeSpeakerUid === uid}
              />
            )}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs pointer-events-none select-none">
              Click to exit spotlight
            </div>
          </div>
          {stripItems.length > 0 && (
            <div className="h-28 flex flex-row gap-1 px-1 pb-1 overflow-x-auto shrink-0 bg-black/30 backdrop-blur-sm">
              {stripItems.map((item) =>
                item === "local" ? (
                  <div key="local" className="h-full aspect-video rounded-lg overflow-hidden border border-gray-700 cursor-pointer hover:border-blue-400 transition-colors shrink-0"
                    onClick={() => setPinnedUid(null)}>
                    <LocalVideoTile track={localVideoTrack} isCamOn={isCamOn} isMicOn={isMicOn} displayName={displayName} isMain={false} isSpeaking={activeSpeakerUid === uid} />
                  </div>
                ) : (
                  <div key={(item as RemoteUserState).user.uid} className="h-full aspect-video rounded-lg overflow-hidden border border-gray-700 cursor-pointer hover:border-blue-400 transition-colors shrink-0"
                    onClick={() => setPinnedUid((item as RemoteUserState).user.uid)}>
                    <RemoteTile participant={item as RemoteUserState} isMain={false} isSpeaking={activeSpeakerUid === (item as RemoteUserState).user.uid} />
                  </div>
                )
              )}
            </div>
          )}
        </div>
      );
    }

    const cols = gridColumns(totalParticipants);
    const allTiles: Array<"local" | RemoteUserState> = ["local", ...remoteUsers];

    return (
      <div
        className="absolute inset-0 p-1 gap-1"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: `calc((100% - ${(Math.ceil(allTiles.length / cols) - 1) * 4}px) / ${Math.ceil(allTiles.length / cols)})`,
        }}
      >
        {allTiles.map((item) =>
          item === "local" ? (
            <div key="local" className="relative rounded-xl overflow-hidden">
              <LocalVideoTile track={localVideoTrack} isCamOn={isCamOn} isMicOn={isMicOn} displayName={displayName} isMain={totalParticipants === 1} onClick={remoteUsers.length > 0 ? () => setPinnedUid(null) : undefined} isSpeaking={activeSpeakerUid === uid} />
            </div>
          ) : (
            <div key={(item as RemoteUserState).user.uid} className="relative rounded-xl overflow-hidden">
              <RemoteTile participant={item as RemoteUserState} isMain={totalParticipants === 1} onClick={() => setPinnedUid((item as RemoteUserState).user.uid)} isSpeaking={activeSpeakerUid === (item as RemoteUserState).user.uid} />
            </div>
          )
        )}
      </div>
    );
  };

  // ── Mobile Layout ──────────────────────────────────────────────────────────

  const mobileLayout = () => {
    const allTiles: Array<"local" | RemoteUserState> = ["local", ...remoteUsers];
    const cols = 1;
    const rows = allTiles.length;

    return (
      <div
        className="absolute inset-0 p-0.5 gap-0.5"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: `calc((100% - ${(rows - 1) * 2}px) / ${rows})`,
        }}
      >
        {allTiles.map((item) =>
          item === "local" ? (
            <div key="local" className="relative rounded-lg overflow-hidden">
              <LocalVideoTile track={localVideoTrack} isCamOn={isCamOn} isMicOn={isMicOn} displayName={displayName} isMain={allTiles.length === 1} isSpeaking={activeSpeakerUid === uid} />
            </div>
          ) : (
            <div key={(item as RemoteUserState).user.uid} className="relative rounded-lg overflow-hidden">
              <RemoteTile participant={item as RemoteUserState} isMain={allTiles.length === 1} isSpeaking={activeSpeakerUid === (item as RemoteUserState).user.uid} />
            </div>
          )
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <style>{`
        @keyframes soundbar {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1);   }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-[110]">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 text-sm font-medium text-white hover:text-gray-200 transition-colors flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-white">Therapy Session</h1>
          {isJoined && (
            <div className="flex items-center gap-1 bg-gray-800/70 px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-gray-200 text-xs font-medium">
                {totalParticipants} participant{totalParticipants > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {remainingTime !== null && remainingTime > 0 && (
            <div
              className={`px-3 py-1 rounded-full font-mono text-xs font-semibold flex items-center gap-1 ${
                remainingTime <= 300
                  ? "bg-red-500/90 text-white animate-pulse"
                  : remainingTime <= 600
                  ? "bg-yellow-500/90 text-white"
                  : "bg-gray-800/80 text-white"
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(remainingTime)}
            </div>
          )}
          {remainingTime === 0 && (
            <div className="px-3 py-1 bg-red-500 rounded-full text-white text-xs font-semibold">
              Time's Up
            </div>
          )}
        </div>
      </div>

      {/* ── Video area ── */}
      <div className="absolute inset-0">
        {isMobile ? mobileLayout() : desktopLayout()}

        {/* ── Session expired overlay ── */}
        {sessionExpired && isJoined && (
          <SessionExpiredOverlay
            isCounselor={isCounselor}
            onLeave={handleLeaveAfterExpiry}
            onOpenReview={handleOpenReviewFromExpiry}
          />
        )}

        {/* ── Participants sidebar panel ── */}
        {showParticipants && (
          <div className="absolute top-0 left-0 h-full w-56 bg-gray-900/95 backdrop-blur-md border-r border-gray-700 z-[105] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <span className="text-white font-semibold text-sm">Participants ({totalParticipants})</span>
              <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {getInitials(displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{displayName}</p>
                  <p className="text-gray-400 text-xs">You</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {!isMicOn && <span className="text-red-400 text-xs">🔇</span>}
                  {!isCamOn && <span className="text-gray-400 text-xs">📷</span>}
                </div>
              </div>
              {remoteUsers.map((ru) => (
                <div key={ru.user.uid} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => { setPinnedUid(ru.user.uid); setShowParticipants(false); }}>
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(ru.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{ru.displayName || `User ${ru.user.uid}`}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {!ru.hasAudio && <span className="text-red-400 text-xs">🔇</span>}
                    {!ru.hasVideo && <span className="text-gray-400 text-xs">📷</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Chat overlay ── */}
      {appId && channel && (
        <InCallChat
          appId={appId}
          channel={channel}
          uid={String(uid)}
          displayName={displayName}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onUnreadCount={setChatUnread}
        />
      )}

      {/* ── Joining overlay ── */}
      {isJoining && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative flex items-center justify-center mb-8">
            <span className="absolute w-28 h-28 rounded-full border-2 border-blue-400/20 animate-ping" style={{ animationDuration: "1.6s" }} />
            <span className="absolute w-20 h-20 rounded-full border-2 border-blue-400/30 animate-ping" style={{ animationDuration: "1.2s", animationDelay: "0.2s" }} />
            <div className="relative w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="white" strokeOpacity="0.08" strokeWidth="3" />
                <path d="M32 4 A28 28 0 0 1 60 32" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-white text-lg font-semibold tracking-wide mb-2">Joining Session</p>
          <p className="text-blue-300 text-sm font-medium animate-pulse">{joinStep}</p>
          <div className="flex gap-1.5 mt-6">
            {["Fetching session token…", "Joining the channel…", "Setting up microphone…", "Setting up camera…", "Publishing your stream…"].map((step, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                step === joinStep ? "w-5 bg-blue-400"
                  : ["Fetching session token…", "Joining the channel…", "Setting up microphone…", "Setting up camera…", "Publishing your stream…"].indexOf(joinStep) > i
                  ? "w-1.5 bg-blue-600" : "w-1.5 bg-gray-600"
              }`} />
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom controls ── */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent z-[110]">
        <div className="flex items-center justify-center gap-2">
          {!isJoined ? (
            <button
              onClick={join}
              disabled={isLoadingToken || isJoining}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors flex items-center gap-2"
            >
              {isJoining || isLoadingToken ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Connecting…
                </>
              ) : "Join Call"}
            </button>
          ) : (
            <>
              <button onClick={toggleMic} title={isMicOn ? "Mute" : "Unmute"}
                className={`p-3 rounded-full transition-all duration-200 group relative ${isMicOn ? "bg-gray-800/80 hover:bg-gray-700/80 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
                <MicIcon muted={!isMicOn} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                  {isMicOn ? "Mute" : "Unmute"}
                </span>
              </button>

              <button onClick={toggleCam} title={isCamOn ? "Turn off camera" : "Turn on camera"}
                className={`p-3 rounded-full transition-all duration-200 group relative ${isCamOn ? "bg-gray-800/80 hover:bg-gray-700/80 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
                <VideoIcon disabled={!isCamOn} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                  {isCamOn ? "Turn off camera" : "Turn on camera"}
                </span>
              </button>

              <button onClick={() => setShowParticipants((p) => !p)} title="Participants"
                className={`p-3 rounded-full transition-all duration-200 group relative ${showParticipants ? "bg-blue-600 text-white" : "bg-gray-800/80 hover:bg-gray-700/80 text-white"}`}>
                <UsersIcon />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                  Participants
                </span>
              </button>

              <button
                onClick={() => { setIsChatOpen((p) => !p); if (!isChatOpen) setChatUnread(0); }}
                title="Chat"
                className={`p-3 rounded-full transition-all duration-200 group relative ${isChatOpen ? "bg-blue-600 text-white" : "bg-gray-800/80 hover:bg-gray-700/80 text-white"}`}>
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

              <button onClick={handleLeave} title="Leave call"
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 group relative">
                <PhoneOffIcon />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                  Leave call
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Post-call review modal (counselors only) ── */}
      <PostCallReviewModal
        isOpen={reviewModalOpen}
        appointment={state?.appointment ?? null}
        onClose={handleReviewModalClose}
        onSubmitted={handleReviewModalClose}
      />
    </div>
  );
};

export default VideoCallPage;