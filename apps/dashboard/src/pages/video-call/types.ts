import {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
} from "agora-rtc-sdk-ng";
import { Appointment } from "../../api/Appointments.api";

export interface AgoraState {
  agora?: {
    appId: string;
    channel: string;
    token?: string;
    uid?: number;
  };
  appointment?: Appointment;
  sessionDuration?: number;
}

export interface RemoteUserState {
  user: IAgoraRTCRemoteUser;
  hasVideo: boolean;
  hasAudio: boolean;
  displayName?: string;
}

export interface LocalVideoTileProps {
  track: ICameraVideoTrack | null;
  isCamOn: boolean;
  isMicOn: boolean;
  displayName: string;
  isMain: boolean;
  onClick?: () => void;
  isPinned?: boolean;
  isSpeaking?: boolean;
}

export interface RemoteTileProps {
  participant: RemoteUserState;
  isMain: boolean;
  onClick?: () => void;
  isPinned?: boolean;
  isSpeaking?: boolean;
}
