import React, { useCallback, useEffect, useRef, useState } from "react";
import socketService from "../../Services/SocketService";

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
  isLocal: boolean;
}

interface InCallChatProps {
  channel: string;
  userId: string;
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
  channel,
  userId,
  isOpen,
  onClose,
  onUnreadCount,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Refs to avoid stale closures inside socket handler without triggering re-subscriptions
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const onUnreadCountRef = useRef(onUnreadCount);
  useEffect(() => { onUnreadCountRef.current = onUnreadCount; }, [onUnreadCount]);

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

  // ── Messages & connection ─────────────────────────────────────────────────

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const connected = socketService.isSocketConnected();

  // ── Socket subscription — only depends on stable values ──────────────────

  useEffect(() => {
    if (!channel) return;

    let cleanupFn: () => void = () => {};
    let cancelled = false;
    let subscribed = false;

    const setup = () => {
      if (cancelled || subscribed) return;
      if (socketService.isSocketConnected()) {
        socketService.joinCallChat(channel);
        subscribed = true;
        cleanupFn = socketService.onReceiveCallMessage((msg) => {
          setMessages((prev) => {
            // Use refs so we never need isOpen/onUnreadCount in the dep array
            if (!isOpenRef.current) {
              onUnreadCountRef.current?.(prev.length + 1);
            }

            // Skip adding if it's from ourselves, since we optimistically added it locally
            if (msg.senderId === userId) {
              return prev;
            }

            return [
              ...prev,
              {
                id: msg.id,
                text: msg.message,
                senderId: msg.senderId,
                timestamp: new Date(),
                isLocal: false, // incoming messages are not local
              },
            ];
          });
        });
      } else {
        setTimeout(setup, 300);
      }
    };

    setup();

    return () => {
      cancelled = true;
      cleanupFn();
      socketService.leaveCallChat(channel);
    };
  }, [channel, userId]); // ← stable deps only; isOpen/onUnreadCount accessed via refs

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      onUnreadCount?.(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, onUnreadCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || !socketService.isSocketConnected()) return;

    socketService.sendCallMessage({
      channel,
      senderId: userId,
      message: text,
    });

    // Optimistically add the message locally since server may not echo back to sender
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-${Math.random()}`, // unique ID to avoid conflicts
        text,
        senderId: userId,
        timestamp: new Date(),
        isLocal: true,
      },
    ]);
    setInputText("");
  }, [inputText, channel, userId]);

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
              connected ? "bg-green-400" : "bg-red-400"
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
        {messages.map((msg) => {
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
            placeholder={connected ? "Type a message... (Enter to send)" : "Connecting..."}
            disabled={!connected}
            rows={1}
            className="flex-1 bg-gray-700 text-white text-sm placeholder-gray-400 rounded-xl px-3 py-2 resize-none outline-none border border-gray-600 focus:border-blue-500 transition-colors disabled:opacity-50 max-h-24"
            style={{ minHeight: "38px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !inputText.trim()}
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