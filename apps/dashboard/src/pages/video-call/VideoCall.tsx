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
import { useAuthStore } from "../../store/auth/useAuthStore";

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
          d="M5.586 15H4a1 1 0 01-1-1v-3a1 1 0 011-1h1m0 0V7a3 3 0 116 0v3m0 0a3 3 0 01-3 3m0 0h2l3 7h0a2 2 0 01-2 2H9a2 2 0 01-2-2v0l3-7z"
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
    token: string;
    uid?: number;
  };
  appointment?: Appointment;
}

interface RemoteUserState {
  user: IAgoraRTCRemoteUser;
  hasVideo: boolean;
  hasAudio: boolean;
  displayName?: string;
}

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const { state } = useLocation() as { state?: AgoraState };
  const displayName = name || "You";

  const [appId, setAppId] = useState<string | undefined>(state?.agora?.appId);
  const [channel, setChannel] = useState<string | undefined>(
    state?.agora?.channel
  );
  const [token, setToken] = useState<string | undefined>(state?.agora?.token);
  const [uid, setUid] = useState<number>(state?.agora?.uid ?? 0);

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

  useEffect(() => {
    function fetchIfNeeded() {
      if (appId && channel && token) return;
      try {
        setAppId(import.meta.env.VITE_AGORA_APP_ID);
        setChannel(state?.agora?.channel);
        setToken(state?.agora?.token);
        setUid(state?.agora?.uid ?? 0);
      } catch (e) {
        console.error(e);
      }
    }
    fetchIfNeeded();
  }, [appId, channel, token, state]);

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
    if (!appId || !channel || !token) {
      alert("Video is not ready yet. Missing Agora credentials.");
      return;
    }

    try {
      await client.join(appId, channel, token, uid);
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
      alert("Failed to join the call.");
    }
  }, [appId, channel, token, uid, isMicOn, isCamOn]);

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
  const pipIsMuted = isSwapped ? !isMicOn : !remoteUser?.hasAudio;
  const mainCameraOff = isSwapped ? !remoteUser?.hasVideo : !isCamOn;
  const pipCameraOff = isSwapped ? !isCamOn : !remoteUser?.hasVideo;

  return (
    <div className="h-full w-full bg-gray-50">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between p-6 ">
          <h1 className="text-xl font-semibold text-gray-900">
            Therapy Session
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="flex-1 relative p-6">
          {/* Main Stage */}
          <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <div
              className="absolute inset-0 transition-all duration-500 ease-in-out"
              ref={mainVideoContainerRef}
            />

            {mainCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 transition-opacity duration-300">
                <div className="w-32 h-32 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-semibold">
                  {getInitials(mainDisplayName)}
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-800 text-sm font-medium shadow-sm">
              {mainDisplayName}
              {mainIsMuted && <span className="ml-2 text-red-500">🔇</span>}
            </div>

            {isJoined && (
              <div className="absolute top-4 right-4 group">
                <div
                  className="w-48 h-36 bg-gray-200 rounded-xl overflow-hidden border-2 border-gray-300 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  onClick={swapViews}
                >
                  <div className="relative w-full h-full">
                    <div
                      className="absolute inset-0 transition-all duration-500 ease-in-out"
                      ref={pipVideoContainerRef}
                    />

                    {remoteUser
                      ? pipCameraOff && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 transition-opacity duration-300">
                            <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-semibold">
                              {getInitials(pipDisplayName)}
                            </div>
                          </div>
                        )
                      : null}

                    <div className="absolute bottom-2 left-2 right-2">
                      {remoteUser ? (
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-gray-800 text-xs font-medium truncate shadow-sm">
                            {pipDisplayName}
                          </span>
                          {pipIsMuted && (
                            <span className="px-1.5 py-1 bg-red-500/90 backdrop-blur-sm rounded text-white text-xs">
                              🔇
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-gray-600 text-xs text-center shadow-sm">
                          {isJoined ? "Waiting for other user..." : "Just you"}
                        </div>
                      )}
                    </div>

                    <div className="absolute rounded inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-sm">
                      <div className="bg-white/90 rounded-full p-2 shadow-lg">
                        <SwapIcon />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center gap-3">
            {!isJoined ? (
              <button
                onClick={join}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors flex items-center gap-2 shadow-lg"
              >
                Join Call
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
                    isMicOn
                      ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                >
                  <MicIcon muted={!isMicOn} />
                </button>

                <button
                  onClick={toggleCam}
                  className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
                    isCamOn
                      ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title={isCamOn ? "Turn off camera" : "Turn on camera"}
                >
                  <VideoIcon disabled={!isCamOn} />
                </button>

                <button
                  onClick={leave}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg"
                  title="End call"
                >
                  <PhoneIcon />
                </button>
              </>
            )}
          </div>

          {/* Pre-join controls */}
          {!isJoined && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={toggleMic}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm ${
                  isMicOn
                    ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                    : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                }`}
              >
                <MicIcon muted={!isMicOn} />
                {isMicOn ? "Mic On" : "Mic Off"}
              </button>

              <button
                onClick={toggleCam}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm ${
                  isCamOn
                    ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                    : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                }`}
              >
                <VideoIcon disabled={!isCamOn} />
                {isCamOn ? "Camera On" : "Camera Off"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
