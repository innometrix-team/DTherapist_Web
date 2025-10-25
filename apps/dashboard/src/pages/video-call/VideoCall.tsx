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
import { Appointment, completeSession } from "../../api/Appointments.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import Api from "../../api/Api";
import SessionCompleteModal from "../../components/appointment/SessionCompleteModal";

// Token refresh API response interface
interface TokenRefreshResponse {
  uid: number;
  token: string;
  sessionName: string;
  expiresAt: number;
}

const getInitials = (name?: string) => {
  if (!name) return "You";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

const MicIcon = ({ muted }: { muted: boolean }) => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
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

const VideoIcon = ({ disabled }: { disabled: boolean }) => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
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

const PhoneIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 16.5v2.25A2.25 2.25 0 005.25 21h2.25m-7.5-4.5h7.5m-7.5 0V9.25A2.25 2.25 0 015.25 7h2.25m12 9.75h-7.5m7.5 0V9.25A2.25 2.25 0 0118.75 7h-2.25"
    />
  </svg>
);

const SwapIcon = () => (
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
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

// Types for the location.state payload we navigate with from SessionTable
interface AgoraState {
  agora?: {
    appId: string;
    channel: string;
    token?: string;
    uid?: number;
  };
  appointment?: Appointment;
  sessionDuration?: number; // Duration in minutes
}

interface RemoteUserState {
  user: IAgoraRTCRemoteUser;
  hasVideo: boolean;
  hasAudio: boolean;
  displayName?: string;
}

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { name, role } = useAuthStore();
  const { state } = useLocation() as { state?: AgoraState };
  const displayName = name || "You";
  const isClient = role === "user";

  const [appId, setAppId] = useState<string | undefined>(state?.agora?.appId);
  const [channel, setChannel] = useState<string | undefined>(
    state?.agora?.channel
  );
  const [uid, setUid] = useState<number>(state?.agora?.uid ?? 0);

  const [isLoadingToken, setIsLoadingToken] = useState(false);

  // Session timer states
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Agora client & tracks
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [remoteUser, setRemoteUser] = useState<RemoteUserState | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);

  // Fixed containers - these never swap
  const mainVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const pipVideoContainerRef = useRef<HTMLDivElement | null>(null);

  // Calculate session duration from appointment time
  useEffect(() => {
    if (state?.appointment) {
      const appointment = state.appointment;
      
      // Parse the session end time from the appointment time field
      // Format: "5:20 PM - 6:20 PM"
      const timeParts = appointment.time?.split(" - ");
      
      if (timeParts && timeParts.length === 2) {
        const endTimeStr = timeParts[1]; // e.g., "6:20 PM"
        const dateStr = appointment.date; // e.g., "2025-10-25"
        
        // Parse the end time
        const endDateTime = parseTimeToTimestamp(dateStr, endTimeStr);
        
        if (endDateTime) {
          const currentTimestamp = Math.floor(Date.now() / 1000);
          const remainingSeconds = endDateTime - currentTimestamp;
          
          if (remainingSeconds > 0) {
            setRemainingTime(remainingSeconds);
          } else {
            setRemainingTime(0);
            // Show modal immediately if already expired
            if (isClient) {
              setShowCompleteModal(true);
            }
          }
        }
      } else if (state?.appointment?.action?.agoraToken?.expiresAt) {
        // Fallback to expiresAt if time parsing fails
        const expiresAtTimestamp = parseInt(state.appointment.action.agoraToken.expiresAt);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const remainingSeconds = expiresAtTimestamp - currentTimestamp;
        
        if (remainingSeconds > 0) {
          setRemainingTime(remainingSeconds);
        } else {
          setRemainingTime(0);
          if (isClient) {
            setShowCompleteModal(true);
          }
        }
      }
    }
  }, [state, isClient]);

  // Helper function to parse time string to Unix timestamp
  const parseTimeToTimestamp = (dateStr: string, timeStr: string): number | null => {
    try {
      // Parse date (YYYY-MM-DD)
      const [year, month, day] = dateStr.split('-').map(Number);
      
      // Parse time (e.g., "6:20 PM")
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return null;
      
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Create date object (assumes local timezone - WAT in your case)
      const date = new Date(year, month - 1, day, hours, minutes, 0);
      
      // Return Unix timestamp in seconds
      return Math.floor(date.getTime() / 1000);
    } catch (e) {
      console.error('Error parsing time:', e);
      return null;
    }
  };

  // Timer countdown effect - starts immediately when remainingTime is set
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) {
      // Show modal if time is up
      if (remainingTime === 0 && isClient && !showCompleteModal) {
        setShowCompleteModal(true);
      }
      return;
    }

    timerIntervalRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          // Show modal only for clients
          if (isClient) {
            setShowCompleteModal(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [remainingTime, isClient, showCompleteModal]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle session completion
  const handleCompleteSession = async () => {
    if (!state?.appointment?.bookingId) {
      console.error("No booking ID found");
      return;
    }

    try {
      setIsCompletingSession(true);
      await completeSession(state.appointment.bookingId);
      
      // Leave the call first
      await leave();
      
      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to complete session:", error);
      alert("Failed to complete session. Please try again.");
      setIsCompletingSession(false);
    }
  };

  useEffect(() => {
    function fetchIfNeeded() {
      if (appId && channel) return;
      try {
        setAppId(import.meta.env.VITE_AGORA_APP_ID);
        setChannel(state?.agora?.channel);
        setUid(state?.agora?.uid ?? 0);
      } catch (e) {
        console.error(e);
      }
    }
    fetchIfNeeded();
  }, [appId, channel, state]);

  // Function to fetch fresh token from the API
  const fetchFreshToken =
    useCallback(async (): Promise<TokenRefreshResponse | null> => {
      if (!channel || uid === undefined) {
        console.error("Missing channel or uid for token refresh");
        return null;
      }

      try {
        setIsLoadingToken(true);
        const response = await Api.get<TokenRefreshResponse>(
          "/api/agora/refresh-token",
          {
            params: {
              sessionName: channel,
              uid: uid,
            },
          }
        );

        return response.data || null;
      } catch (error: unknown) {
        console.error(
          "Failed to fetch fresh token:",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw new Error("Failed to refresh Agora token");
      } finally {
        setIsLoadingToken(false);
      }
    }, [channel, uid]);

  const renderVideoInContainer = useCallback(
    (
      track: ICameraVideoTrack | IRemoteVideoTrack | null,
      container: HTMLDivElement,
      isEnabled: boolean
    ) => {
      container.innerHTML = "";
      if (track && isEnabled) {
        const videoDiv = document.createElement("div");
        videoDiv.className = "w-full h-full";
        container.appendChild(videoDiv);
        track.play(videoDiv);
      }
    },
    []
  );

  // Effect to handle video rendering based on swap state
  useEffect(() => {
    if (!isJoined) return;

    const mainContainer = mainVideoContainerRef.current;
    const pipContainer = pipVideoContainerRef.current;

    if (!mainContainer || !pipContainer) return;

    if (isSwapped) {
      if (remoteUser?.hasVideo && remoteUser.user.videoTrack) {
        renderVideoInContainer(
          remoteUser.user.videoTrack as IRemoteVideoTrack,
          mainContainer,
          true
        );
      } else {
        mainContainer.innerHTML = "";
      }

      if (localVideoRef.current) {
        renderVideoInContainer(localVideoRef.current, pipContainer, isCamOn);
      }
    } else {
      if (localVideoRef.current) {
        renderVideoInContainer(localVideoRef.current, mainContainer, isCamOn);
      }

      if (remoteUser?.hasVideo && remoteUser.user.videoTrack) {
        renderVideoInContainer(
          remoteUser.user.videoTrack as IRemoteVideoTrack,
          pipContainer,
          true
        );
      } else if (pipContainer) {
        pipContainer.innerHTML = "";
      }
    }
  }, [isSwapped, remoteUser, isCamOn, isJoined, renderVideoInContainer]);

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }

    const client = clientRef.current;
    if (!client) return;

    // User-published: subscribe and play
    const handleUserPublished = async (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video"
    ) => {
      try {
        await client.subscribe(user, mediaType);

        if (mediaType === "audio" && user.audioTrack) {
          (user.audioTrack as IRemoteAudioTrack).play();
        }

        setRemoteUser((prev) => ({
          user,
          hasVideo: prev?.hasVideo || mediaType === "video",
          hasAudio: prev?.hasAudio || mediaType === "audio",
          displayName:
            state?.appointment?.fullName || `Participant ${user.uid}`,
        }));
      } catch (err) {
        console.error("subscribe error", err);
      }
    };

    const handleUserUnpublished = (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video"
    ) => {
      setRemoteUser((prev) => {
        if (!prev || prev.user.uid !== user.uid) return prev;
        return {
          ...prev,
          hasVideo: mediaType === "video" ? false : prev.hasVideo,
          hasAudio: mediaType === "audio" ? false : prev.hasAudio,
        };
      });
    };

    const handleUserLeft = () => {
      if (mainVideoContainerRef.current) {
        mainVideoContainerRef.current.innerHTML = "";
      }
      if (pipVideoContainerRef.current) {
        pipVideoContainerRef.current.innerHTML = "";
      }
      setRemoteUser(null);
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPreviewTracks = useCallback(async () => {
    try {
      if (!localAudioRef.current) {
        localAudioRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        await localAudioRef.current.setEnabled(isMicOn);
      }
      if (!localVideoRef.current) {
        localVideoRef.current = await AgoraRTC.createCameraVideoTrack();
      }
      if (localVideoRef.current) {
        await localVideoRef.current.setEnabled(isCamOn);
        if (!isJoined && mainVideoContainerRef.current) {
          renderVideoInContainer(
            localVideoRef.current,
            mainVideoContainerRef.current,
            isCamOn
          );
        }
      }
    } catch (e) {
      console.error("preview error", e);
    }
  }, [isMicOn, isCamOn, isJoined, renderVideoInContainer]);

  useEffect(() => {
    createPreviewTracks();
  }, [createPreviewTracks]);

  const join = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    if (!appId || !channel) {
      alert("Video is not ready yet. Missing Agora credentials.");
      return;
    }

    try {
      // Fetch fresh token before joining
      const tokenData = await fetchFreshToken();
      if (!tokenData || !tokenData.token) {
        alert("Failed to get video call token. Please try again.");
        return;
      }

      await client.join(appId, channel, tokenData.token, tokenData.uid);

      // Update uid in case it changed from the server
      setUid(tokenData.uid);

      if (!localAudioRef.current) {
        localAudioRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        await localAudioRef.current.setEnabled(isMicOn);
      }
      if (!localVideoRef.current) {
        localVideoRef.current = await AgoraRTC.createCameraVideoTrack();
        await localVideoRef.current.setEnabled(isCamOn);
      }
      const toPublish = [
        ...(localAudioRef.current ? [localAudioRef.current] : []),
        ...(localVideoRef.current ? [localVideoRef.current] : []),
      ];
      await client.publish(toPublish);

      setIsJoined(true);
    } catch (err) {
      console.error("join error", err);
      alert(
        "Failed to join the call. Please check your connection and try again."
      );
    }
  }, [appId, channel, isMicOn, isCamOn, fetchFreshToken]);

  const leave = useCallback(async () => {
    const client = clientRef.current;
    try {
      // Close local tracks
      localAudioRef.current?.close();
      localVideoRef.current?.close();
      localAudioRef.current = null;
      localVideoRef.current = null;

      // Remove container content
      if (mainVideoContainerRef.current)
        mainVideoContainerRef.current.innerHTML = "";
      if (pipVideoContainerRef.current)
        pipVideoContainerRef.current.innerHTML = "";

      await client?.leave();
    } catch (err) {
      console.error("leave error", err);
    } finally {
      setIsJoined(false);
      setRemoteUser(null);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      leave();
    };
  }, [leave]);

  const toggleMic = useCallback(async () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (localAudioRef.current) {
      await localAudioRef.current.setEnabled(next);
    } else {
      if (next) {
        localAudioRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      }
    }
  }, [isMicOn]);

  const toggleCam = useCallback(async () => {
    const next = !isCamOn;
    setIsCamOn(next);
    if (!localVideoRef.current) {
      localVideoRef.current = await AgoraRTC.createCameraVideoTrack();
    }
    await localVideoRef.current.setEnabled(next);
  }, [isCamOn]);

  const swapViews = useCallback(() => {
    if (!remoteUser) return;
    setIsSwapped(!isSwapped);
  }, [isSwapped, remoteUser]);

  // Determine display information based on swap state
  const mainDisplayName = isSwapped
    ? remoteUser?.displayName || state?.appointment?.fullName
    : displayName;
  const pipDisplayName = isSwapped
    ? displayName
    : remoteUser?.displayName || state?.appointment?.fullName;
  const mainIsMuted = isSwapped ? !remoteUser?.hasAudio : !isMicOn;
  const mainCameraOff = isSwapped ? !remoteUser?.hasVideo : !isCamOn;
  const pipCameraOff = isSwapped ? !isCamOn : !remoteUser?.hasVideo;

  return (
    <div className="fixed inset-0 bg-black z-[100]">
      {/* Session Complete Modal - Only shown for clients */}
      {isClient && (
        <SessionCompleteModal
          isOpen={showCompleteModal}
          onConfirm={handleCompleteSession}
          isLoading={isCompletingSession}
        />
      )}

      {/* Main container - fills entire screen */}
      <div className="relative w-full h-full">
        {/* Main Stage - fullscreen */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 transition-all duration-500 ease-in-out"
            ref={mainVideoContainerRef}
          />

          {mainCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 transition-opacity duration-300">
              <div className="w-32 h-32 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-semibold">
                {getInitials(mainDisplayName)}
              </div>
            </div>
          )}

          {/* Top bar with back button, title, and timer */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between z-[101]">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-white hover:text-gray-200 transition-colors flex items-center gap-2 group relative"
              title="Go back"
            >
              ← Back
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Go back
              </span>
            </button>
            <h1 className="text-xl font-semibold text-white">
              Therapy Session
            </h1>
            {/* Timer Display */}
            <div className="flex items-center gap-2">
              {remainingTime !== null && remainingTime > 0 && (
                <div
                  className={`px-4 py-2 rounded-full font-mono text-sm font-semibold group relative ${
                    remainingTime <= 300
                      ? "bg-red-500/90 text-white animate-pulse"
                      : remainingTime <= 600
                      ? "bg-yellow-500/90 text-white"
                      : "bg-gray-800/80 text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatTime(remainingTime)}
                  </span>
                  <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Time remaining in session
                  </span>
                </div>
              )}
              {remainingTime === 0 && (
                <div className="px-4 py-2 bg-red-500 rounded-full text-white text-sm font-semibold group relative">
                  Time's Up
                  <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Session has ended
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name label */}
          <div className="absolute bottom-20 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium z-[101]">
            {mainDisplayName}
            {mainIsMuted && <span className="ml-2 text-red-500">🔇</span>}
          </div>

          {/* PIP Video */}
          {isJoined && (
            <div className="absolute top-20 right-4 group z-[101]">
              <div
                className="relative w-48 h-36 bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105"
                onClick={swapViews}
                title="Click to swap views"
              >
                {/* Add swap icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                    <SwapIcon />
                  </div>
                </div>

                <div className="relative w-full h-full">
                  <div
                    className="absolute inset-0 transition-all duration-500 ease-in-out"
                    ref={pipVideoContainerRef}
                  />

                  {remoteUser && pipCameraOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-semibold">
                        {getInitials(pipDisplayName)}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs">
                      {remoteUser ? pipDisplayName : "Waiting..."}
                    </div>
                  </div>
                </div>

                {/* Tooltip */}
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Click to swap views
                </span>
              </div>
            </div>
          )}

          {/* Controls - centered at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent z-[101]">
            <div className="flex items-center justify-center gap-4">
              {!isJoined ? (
                <button
                  onClick={join}
                  disabled={isLoadingToken}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors flex items-center gap-2 group relative"
                  title="Join the video call"
                >
                  {isLoadingToken ? "Getting Ready..." : "Join Call"}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    {isLoadingToken ? "Preparing connection..." : "Join the video call"}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all duration-200 group relative ${
                      isMicOn
                        ? "bg-gray-800/80 hover:bg-gray-700/80 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                    title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                  >
                    <MicIcon muted={!isMicOn} />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {isMicOn ? "Mute microphone" : "Unmute microphone"}
                    </span>
                  </button>

                  <button
                    onClick={toggleCam}
                    className={`p-4 rounded-full transition-all duration-200 group relative ${
                      isCamOn
                        ? "bg-gray-800/80 hover:bg-gray-700/80 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                    title={isCamOn ? "Turn off camera" : "Turn on camera"}
                  >
                    <VideoIcon disabled={!isCamOn} />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {isCamOn ? "Turn off camera" : "Turn on camera"}
                    </span>
                  </button>

                  <button
                    onClick={leave}
                    className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 group relative"
                    title="Leave call"
                  >
                    <PhoneIcon />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      Leave call
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage