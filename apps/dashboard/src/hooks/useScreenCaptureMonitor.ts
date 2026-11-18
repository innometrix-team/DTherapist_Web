import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import socketService from "../services/SocketService";

/**
 * Monitors the active Socket.IO room (`chat:<chatId>`, `group:<groupId>`, or `call:<agoraChannel>`)
 * for screen capture or screen recording events:
 * 1. Emits `screenCaptured` to the room when browser screenshot shortcut keys are detected.
 * 2. Listens for incoming `screenCaptured` broadcasts and displays an ephemeral privacy notice
 *    without identifying any specific participant.
 */
export function useScreenCaptureMonitor(room: string | null | undefined): void {
  const lastEmitTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!room) return;

    const unsubscribe = socketService.onScreenCaptured(({ kind }) => {
      const label =
        kind === "recording"
          ? "Screen recording was detected in this session."
          : "A screenshot was taken in this session.";
      toast(label, {
        id: `screen-captured-${room}-${kind}`,
        duration: 4500,
      });
    });

    const emitCapture = (kind: "screenshot" | "recording") => {
      const now = Date.now();
      if (now - lastEmitTimeRef.current < 2500) {
        return;
      }
      lastEmitTimeRef.current = now;
      socketService.emitScreenCaptured(room, kind);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        emitCapture("screenshot");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // macOS / Windows snipping shortcuts (Cmd+Shift+3/4/5 or Win+Shift+S)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === "3" || e.key === "4" || e.key === "5" || e.key.toLowerCase() === "s")
      ) {
        emitCapture("screenshot");
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [room]);
}

