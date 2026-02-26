import AgoraRTM from "agora-rtm-sdk";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchAgoraRtmToken } from "../../api/Agora.api";

type RTMClientV2 = InstanceType<typeof AgoraRTM.RTM>;

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isLocal: boolean;
}

interface InCallChatProps {
  appId: string;
  channel: string;
  uid: string;
  displayName: string;
  isOpen: boolean;
  onClose: () => void;
  onUnreadCount?: (count: number) => void;
}

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DragIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

const getDefaultPosition = () => ({
  x: window.innerWidth - 336,
  y: window.innerHeight - 596,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const clampPosition = (x: number, y: number, panelW: number, panelH: number) => ({
  x: clamp(x, 0, window.innerWidth - panelW),
  y: clamp(y, 0, window.innerHeight - panelH),
});

const InCallChat: React.FC<InCallChatProps> = ({
  appId,
  channel,
  uid,
  displayName,
  isOpen,
  onClose,
  onUnreadCount,
}) => {
  const rtmClientRef = useRef<RTMClientV2 | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingUnreadRef = useRef(0);

  const isConnectedRef = useRef(false);
  const isInitialisingRef = useRef(false);
  const isDestroyingRef = useRef(false);

  const numericUidRef = useRef<number>(parseInt(uid, 10) || 0);
  const stringUidRef = useRef<string>(
    uid && uid !== "0" ? uid : String(numericUidRef.current)
  );

  // ── Drag ─────────────────────────────────────────────────────────────────

  const [position, setPosition] = useState(getDefaultPosition);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) setPosition(getDefaultPosition());
  }, [isOpen]);

  useEffect(() => {
    const onResize = () => {
      const panelW = panelRef.current?.offsetWidth ?? 320;
      const panelH = panelRef.current?.offsetHeight ?? 500;
      setPosition((p) => clampPosition(p.x, p.y, panelW, panelH));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const panelW = panelRef.current?.offsetWidth ?? 320;
    const panelH = panelRef.current?.offsetHeight ?? 500;
    setPosition(
      clampPosition(dragRef.current.origX + dx, dragRef.current.origY + dy, panelW, panelH)
    );
  };

  const onPointerUp = () => { dragRef.current = null; };

  // ── UID sync ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isConnectedRef.current && uid && uid !== "0") {
      const n = parseInt(uid, 10);
      if (!isNaN(n)) {
        numericUidRef.current = n;
        stringUidRef.current = uid;
      }
    }
  }, [uid]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addSystemMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        text,
        senderId: "system",
        senderName: "System",
        timestamp: new Date(),
        isLocal: false,
      },
    ]);
  }, []);

  const addRemoteMessage = useCallback(
    (text: string, senderId: string, senderName: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          text,
          senderId,
          senderName,
          timestamp: new Date(),
          isLocal: false,
        },
      ]);
      if (!isOpen) {
        pendingUnreadRef.current += 1;
        onUnreadCount?.(pendingUnreadRef.current);
      }
    },
    [isOpen, onUnreadCount]
  );

  // ── Token ─────────────────────────────────────────────────────────────────

  const getRtmToken = useCallback(async (): Promise<string | null> => {
    try {
      const result = await fetchAgoraRtmToken(channel, numericUidRef.current);
      return result?.data?.token ?? null;
    } catch {
      return null;
    }
  }, [channel]);

  // ── RTM destroy ───────────────────────────────────────────────────────────

  const destroyRtm = useCallback(async () => {
    if (!rtmClientRef.current) return;
    isDestroyingRef.current = true;
    try {
      await rtmClientRef.current.unsubscribe(channel);
      await rtmClientRef.current.logout();
    } catch {
      /* ignore */
    } finally {
      rtmClientRef.current = null;
      isConnectedRef.current = false;
      isDestroyingRef.current = false;
      setIsConnected(false);
    }
  }, [channel]);

  // ── RTM init ──────────────────────────────────────────────────────────────

  const initRtm = useCallback(async () => {
    if (isInitialisingRef.current || isConnectedRef.current) return;

    if (isDestroyingRef.current) {
      await new Promise<void>((resolve) => {
        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += 50;
          if (!isDestroyingRef.current || elapsed >= 3000) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    }

    if (isInitialisingRef.current || isConnectedRef.current) return;

    isInitialisingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      const token = await getRtmToken();
      if (!token) {
        setError("Failed to get chat token. Please try again.");
        return;
      }

      const userId = stringUidRef.current;
      const client = new AgoraRTM.RTM(appId, userId, { logLevel: "warn" });
      rtmClientRef.current = client;

      client.addEventListener(
        "message",
        (event: {
          channelName: string;
          publisher: string;
          message: string | Uint8Array;
          channelType: string;
        }) => {
          if (event.channelName !== channel || event.publisher === userId) return;
          if (typeof event.message !== "string") return;
          try {
            const parsed = JSON.parse(event.message);
            addRemoteMessage(parsed.text, event.publisher, parsed.senderName || event.publisher);
          } catch {
            addRemoteMessage(event.message, event.publisher, event.publisher);
          }
        }
      );

      client.addEventListener(
        "presence",
        (event: { eventType: string; publisher: string; channelName: string }) => {
          if (event.publisher === userId || event.channelName !== channel) return;
          if (event.eventType === "remoteJoin") {
            addSystemMessage(`${event.publisher} joined the chat`);
          } else if (event.eventType === "remoteLeave" || event.eventType === "remoteTimeout") {
            addSystemMessage(`${event.publisher} left the chat`);
          }
        }
      );

      await client.login({ token });

      /**
       * FIX: explicitly set withMessage: true.
       * In RTM v2.2.x withMessage can default to false depending on build,
       * which means the message event listener above never fires — messages
       * are sent but never delivered to the subscriber.
       */
      await client.subscribe(channel, {
        withMessage: true,
        withPresence: true,
      });

      isConnectedRef.current = true;
      setIsConnected(true);
      addSystemMessage("You joined the chat");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("-10005") || message.toLowerCase().includes("invalid token")) {
        setError("Chat authentication failed. Please refresh the page and try again.");
      } else if (message.toLowerCase().includes("kicked")) {
        setError("Chat session conflict. Please wait a moment and retry.");
      } else {
        setError("Could not connect to chat. Please try again.");
      }
      if (rtmClientRef.current) {
        try { await rtmClientRef.current.logout(); } catch { /* ignore */ }
        rtmClientRef.current = null;
      }
    } finally {
      isInitialisingRef.current = false;
      setIsConnecting(false);
    }
  }, [appId, channel, getRtmToken, addRemoteMessage, addSystemMessage]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && !isConnectedRef.current && !isInitialisingRef.current) initRtm();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen) {
      pendingUnreadRef.current = 0;
      onUnreadCount?.(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, onUnreadCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { destroyRtm(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !isConnectedRef.current || !rtmClientRef.current) return;
    try {
      const payload = JSON.stringify({ text, senderName: displayName });
      await rtmClientRef.current.publish(channel, payload, { channelType: "MESSAGE" });
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          text,
          senderId: stringUidRef.current,
          senderName: displayName,
          timestamp: new Date(),
          isLocal: true,
        },
      ]);
      setInputText("");
    } catch { /* ignore */ }
  }, [inputText, displayName, channel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className="fixed z-[200] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: "min(320px, calc(100vw - 32px))",
        height: "min(500px, calc(100svh - 120px))",
      }}
    >
      {/* Header — drag handle */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex items-center gap-2">
          <DragIcon />
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-green-400"
                : isConnecting
                ? "bg-yellow-400 animate-pulse"
                : "bg-red-400"
            }`}
          />
          <span className="text-white text-sm font-semibold">Session Chat</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-700"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {isConnecting && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-xs">Connecting to chat...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
            <p className="text-red-400 text-xs">{error}</p>
            <button onClick={initRtm} className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
              Retry
            </button>
          </div>
        )}

        {!isConnecting &&
          messages.map((msg) => {
            if (msg.senderName === "System") {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.isLocal ? "items-end" : "items-start"}`}
              >
                {!msg.isLocal && (
                  <span className="text-xs text-gray-400 px-1">{msg.senderName}</span>
                )}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    msg.isLocal
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-700 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-gray-500 px-1">{formatTime(msg.timestamp)}</span>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type a message... (Enter to send)" : "Connecting..."}
            disabled={!isConnected}
            rows={1}
            className="flex-1 bg-gray-700 text-white text-sm placeholder-gray-400 rounded-xl px-3 py-2 resize-none outline-none border border-gray-600 focus:border-blue-500 transition-colors disabled:opacity-50 max-h-24"
            style={{ minHeight: "38px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputText.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InCallChat;