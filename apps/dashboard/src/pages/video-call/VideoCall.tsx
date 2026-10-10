import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAgoraRtcToken } from "../../api/Agora.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import socketService from "../../services/SocketService";
import InCallChat from "../../components/VideoChat/inCallChat";
import PostCallReviewModal from "../../components/appointment/Postcallreviewmodal";
import { AgoraState, RemoteUserState } from "./types";
import { LocalVideoTile, RemoteTile } from "./components/VideoTiles";
import { ControlBar } from "./components/ControlBar";
import { SessionExpiredOverlay } from "./components/SessionExpiredOverlay";
import { useCallTimer } from "./hooks/useCallTimer";

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

// ─── Main Component ───────────────────────────────────────────────────────────

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const name = useAuthStore((s) => s.name);
  const role = useAuthStore((s) => s.role);
  const token = useAuthStore((s) => s.token);

  // Ensure websocket connection is available for chat
  useEffect(() => {
    if (token && !socketService.isSocketConnected()) {
      socketService
        .connect(token)
        .catch((err) => console.error("socket connect failed", err));
    }
  }, [token]);

  const { state } = useLocation() as { state?: AgoraState };
  const displayName = name || "You";
  const isMobile = useIsMobile();
  const isCounselor = role === "counselor";

  const [appId, setAppId] = useState<string | undefined>(state?.agora?.appId);
  const [channel, setChannel] = useState<string | undefined>(
    state?.agora?.channel,
  );
  const [uid, setUid] = useState<number>(state?.agora?.uid ?? 0);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinStep, setJoinStep] = useState<string>("Connecting…");

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const [remoteUsers, setRemoteUsers] = useState<RemoteUserState[]>([]);
  const [pinnedUid, setPinnedUid] = useState<number | string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [activeSpeakerUid, setActiveSpeakerUid] = useState<
    number | string | null
  >(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { remainingTime, formattedTime, sessionExpired, setSessionExpired } =
    useCallTimer(state?.appointment, isJoined);

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
    } finally {
      setIsLoadingToken(false);
    }
  }, [channel, uid]);

  // ── Agora event listeners ──────────────────────────────────────────────────

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }
    const client = clientRef.current;

    const handleUserPublished = (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video",
    ) => {
      void (async () => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio" && user.audioTrack)
          (user.audioTrack).play();

        setRemoteUsers((prev) => {
          const existing = prev.find((u) => u.user.uid === user.uid);
          if (existing) {
            return prev.map((u) =>
              u.user.uid === user.uid
                ? {
                    ...u,
                    user,
                    hasVideo: mediaType === "video" ? true : u.hasVideo,
                    hasAudio: mediaType === "audio" ? true : u.hasAudio,
                  }
                : u,
            );
          }
          // FIX: Always use a clean generic label — never append UID or resolve names from auth store
          return [
            ...prev,
            {
              user,
              hasVideo: mediaType === "video",
              hasAudio: mediaType === "audio",
              displayName: "Participant",
            },
          ];
        });
      })();
    };

    const handleUserUnpublished = (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video",
    ) => {
      setRemoteUsers((prev) =>
        prev.map((u) =>
          u.user.uid === user.uid
            ? {
                ...u,
                hasVideo: mediaType === "video" ? false : u.hasVideo,
                hasAudio: mediaType === "audio" ? false : u.hasAudio,
              }
            : u,
        ),
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
    const handleVolumeIndicator = (
      volumes: Array<{ uid: number | string; level: number }>,
    ) => {
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
  }, []);

  // ── Preview tracks ─────────────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
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
      } catch (e) {
        console.error("preview error", e);
      }
    })();
  }, []); // eslint-disable-line

  // ── Join ───────────────────────────────────────────────────────────────────

  const join = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !appId || !channel) {
      alert("Video is not ready yet. Missing Agora credentials.");
      return;
    }
    try {
      setIsJoining(true);
      setJoinStep("Fetching session token…");
      const tokenData = await getFreshRtcToken();
      if (!tokenData?.token) {
        alert("Failed to get token.");
        return;
      }

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
  }, [setSessionExpired]);

  useEffect(
    () => () => {
      void leave();
    },
    [leave],
  );

  const handleLeave = useCallback(async () => {
    await leave();
    void navigate(-1);
  }, [leave, navigate]);

  const handleLeaveAfterExpiry = useCallback(async () => {
    await leave();
    void navigate(-1);
  }, [leave, navigate]);

  const handleOpenReviewFromExpiry = useCallback(async () => {
    await leave();
    setReviewModalOpen(true);
  }, [leave]);

  const handleReviewModalClose = useCallback(() => {
    setReviewModalOpen(false);
    void navigate(-1);
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
                  <div
                    key="local"
                    className="h-full aspect-video rounded-lg overflow-hidden border border-gray-700 cursor-pointer hover:border-blue-400 transition-colors shrink-0"
                    onClick={() => setPinnedUid(null)}
                  >
                    <LocalVideoTile
                      track={localVideoTrack}
                      isCamOn={isCamOn}
                      isMicOn={isMicOn}
                      displayName={displayName}
                      isMain={false}
                      isSpeaking={activeSpeakerUid === uid}
                    />
                  </div>
                ) : (
                  <div
                    key={(item).user.uid}
                    className="h-full aspect-video rounded-lg overflow-hidden border border-gray-700 cursor-pointer hover:border-blue-400 transition-colors shrink-0"
                    onClick={() =>
                      setPinnedUid((item).user.uid)
                    }
                  >
                    <RemoteTile
                      participant={item}
                      isMain={false}
                      isSpeaking={
                        activeSpeakerUid === (item).user.uid
                      }
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      );
    }

    const cols = gridColumns(totalParticipants);
    const allTiles: Array<"local" | RemoteUserState> = [
      "local",
      ...remoteUsers,
    ];

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
              <LocalVideoTile
                track={localVideoTrack}
                isCamOn={isCamOn}
                isMicOn={isMicOn}
                displayName={displayName}
                isMain={totalParticipants === 1}
                onClick={
                  remoteUsers.length > 0 ? () => setPinnedUid(null) : undefined
                }
                isSpeaking={activeSpeakerUid === uid}
              />
            </div>
          ) : (
            <div
              key={(item).user.uid}
              className="relative rounded-xl overflow-hidden"
            >
              <RemoteTile
                participant={item}
                isMain={totalParticipants === 1}
                onClick={() => setPinnedUid((item).user.uid)}
                isSpeaking={
                  activeSpeakerUid === (item).user.uid
                }
              />
            </div>
          ),
        )}
      </div>
    );
  };

  // ── Mobile Layout ──────────────────────────────────────────────────────────

  const mobileLayout = () => {
    const allTiles: Array<"local" | RemoteUserState> = [
      "local",
      ...remoteUsers,
    ];
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
              <LocalVideoTile
                track={localVideoTrack}
                isCamOn={isCamOn}
                isMicOn={isMicOn}
                displayName={displayName}
                isMain={allTiles.length === 1}
                isSpeaking={activeSpeakerUid === uid}
              />
            </div>
          ) : (
            <div
              key={(item).user.uid}
              className="relative rounded-lg overflow-hidden"
            >
              <RemoteTile
                participant={item}
                isMain={allTiles.length === 1}
                isSpeaking={
                  activeSpeakerUid === (item).user.uid
                }
              />
            </div>
          ),
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
          onClick={() => { void navigate(-1); }}
          className="px-3 py-1.5 text-sm font-medium text-white hover:text-gray-200 transition-colors flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-white">
            Therapy Session
          </h1>
          {isJoined && (
            <div className="flex items-center gap-1 bg-gray-800/70 px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-gray-200 text-xs font-medium">
                {totalParticipants} participant
                {totalParticipants > 1 ? "s" : ""}
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
              <svg
                className="w-3 h-3"
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
              {formattedTime}
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
            onLeave={() => {
              void handleLeaveAfterExpiry();
            }}
            onOpenReview={() => {
              void handleOpenReviewFromExpiry();
            }}
          />
        )}

        {/* ── Participants sidebar panel ── */}
        {showParticipants && (
          <div className="absolute top-0 left-0 h-full w-56 bg-gray-900/95 backdrop-blur-md border-r border-gray-700 z-[105] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <span className="text-white font-semibold text-sm">
                Participants ({totalParticipants})
              </span>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Local user (you) */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {getInitials(displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {displayName}
                  </p>
                  <p className="text-gray-400 text-xs">You</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {!isMicOn && <span className="text-red-400 text-xs">🔇</span>}
                  {!isCamOn && (
                    <span className="text-gray-400 text-xs">📷</span>
                  )}
                </div>
              </div>

              {/* FIX: Remote users — always show "Participant" as label, never UID or resolved name */}
              {remoteUsers.map((ru) => {
                const participantLabel = ru.displayName || "Participant";
                return (
                  <div
                    key={ru.user.uid}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => {
                      setPinnedUid(ru.user.uid);
                      setShowParticipants(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(participantLabel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        {participantLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {!ru.hasAudio && (
                        <span className="text-red-400 text-xs">🔇</span>
                      )}
                      {!ru.hasVideo && (
                        <span className="text-gray-400 text-xs">📷</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Chat overlay ── */}
      {channel && (
        <InCallChat
          channel={channel}
          userId={String(uid)}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onUnreadCount={setChatUnread}
        />
      )}

      {/* ── Joining overlay ── */}
      {isJoining && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative flex items-center justify-center mb-8">
            <span
              className="absolute w-28 h-28 rounded-full border-2 border-blue-400/20 animate-ping"
              style={{ animationDuration: "1.6s" }}
            />
            <span
              className="absolute w-20 h-20 rounded-full border-2 border-blue-400/30 animate-ping"
              style={{ animationDuration: "1.2s", animationDelay: "0.2s" }}
            />
            <div className="relative w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center">
              <svg
                className="absolute inset-0 w-full h-full animate-spin"
                viewBox="0 0 64 64"
                fill="none"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="white"
                  strokeOpacity="0.08"
                  strokeWidth="3"
                />
                <path
                  d="M32 4 A28 28 0 0 1 60 32"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <svg
                className="w-7 h-7 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-white text-lg font-semibold tracking-wide mb-2">
            Joining Session
          </p>
          <p className="text-blue-300 text-sm font-medium animate-pulse">
            {joinStep}
          </p>
          <div className="flex gap-1.5 mt-6">
            {[
              "Fetching session token…",
              "Joining the channel…",
              "Setting up microphone…",
              "Setting up camera…",
              "Publishing your stream…",
            ].map((step, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === joinStep
                    ? "w-5 bg-blue-400"
                    : [
                          "Fetching session token…",
                          "Joining the channel…",
                          "Setting up microphone…",
                          "Setting up camera…",
                          "Publishing your stream…",
                        ].indexOf(joinStep) > i
                      ? "w-1.5 bg-blue-600"
                      : "w-1.5 bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom controls ── */}
      <ControlBar
        isJoined={isJoined}
        isLoadingToken={isLoadingToken}
        isJoining={isJoining}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        showParticipants={showParticipants}
        isChatOpen={isChatOpen}
        chatUnread={chatUnread}
        onJoin={() => {
          void join();
        }}
        onToggleMic={() => {
          void toggleMic();
        }}
        onToggleCam={() => {
          void toggleCam();
        }}
        onToggleParticipants={() => setShowParticipants((p) => !p)}
        onToggleChat={() => {
          setIsChatOpen((p) => !p);
          if (!isChatOpen) setChatUnread(0);
        }}
        onLeave={() => {
          void handleLeave();
        }}
      />

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
