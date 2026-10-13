import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Minus, Sparkles, Bot, RotateCcw } from "lucide-react";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { sendChatbotMessage } from "../../api/ChatBot.api";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Need a Counselor",
    prompt: "I need help finding the right counselor for my needs.",
    icon: "👩‍⚕️",
  },
  {
    label: "Mental Health Advice",
    prompt: "Can you give me practical advice for managing stress and anxiety?",
    icon: "💡",
  },
  {
    label: "How to Book a Session",
    prompt: "How does booking and scheduling a therapy session work?",
    icon: "📅",
  },
  {
    label: "Dealing with Anxiety",
    prompt: "I am feeling overwhelmed right now. Can you guide me through a calming exercise?",
    icon: "🧘",
  },
  {
    label: "Talk with Felicia",
    prompt: "Hello Felicia, how can you help me today?",
    icon: "💬",
  },
];

const FeliciaChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickPopup, setShowQuickPopup] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I am Felicia, your Dtherapist AI care assistant. How are you feeling today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.email);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  // Clean up ongoing requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Send message implementation
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputMessage).trim();
      if (!text || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        content: text,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputMessage("");
      setIsLoading(true);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await sendChatbotMessage(
          {
            message: text,
            role: role || "client",
          },
          { signal: controller.signal }
        );

        if (result && result.data) {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            content: result.data || "I am here to support you. How else can I help?",
            sender: "bot",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMsg]);
        } else {
          throw new Error("No response from Felicia");
        }
      } catch (err: unknown) {
        if (err && typeof err === "object" && "name" in err && err.name === "AbortError") {
          return;
        }
        let errorText = "I'm sorry, I encountered a temporary connection issue. Please try again.";
        if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
          errorText = err.message;
        }
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: errorText,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [inputMessage, isLoading, role]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  // Launch from quick actions
  const handleTriggerQuickAction = (prompt: string) => {
    setShowQuickPopup(false);
    setIsOpen(true);
    setIsMinimized(false);
    void handleSendMessage(prompt);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Chat restarted. Hello again! How can I assist you right now?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (ts: Date) => {
    return ts.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      {/* 1. Fixed Bottom-Right Bot Launcher Container */}
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end pointer-events-auto">
        {/* Quick Action Popup when user lands or logs in */}
        {showQuickPopup && !isOpen && (
          <div className="mb-3 w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-divider p-3.5 space-y-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-divider/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-darkerb leading-tight">Felicia AI</h4>
                    <p className="text-[10px] text-neutral">Online & ready to support you</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickPopup(false)}
                  className="p-1 text-neutral hover:text-darkerb rounded-md hover:bg-offwhite transition-colors cursor-pointer"
                  title="Dismiss"
                  aria-label="Dismiss quick actions"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-darkerb font-medium leading-relaxed">
                Welcome to Dtherapist! How can I assist your mental wellness journey right now?
              </p>

              {/* Quick Action Buttons */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleTriggerQuickAction(action.prompt)}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl bg-offwhite hover:bg-primary text-darkerb hover:text-white transition-all duration-150 flex items-center justify-between text-xs font-medium cursor-pointer border border-divider/40 group shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm shrink-0">{action.icon}</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">{action.label}</span>
                    </div>
                    <span className="text-[10px] text-neutral group-hover:text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ask →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Launcher Circle Button (Fixed bottom-right, standard click) */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowQuickPopup(false);
          }}
          className="w-14 h-14 rounded-full bg-linear-to-tr from-primary to-blue-600 hover:shadow-primary/40 text-white shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer border-2 border-white relative group"
          aria-label="Toggle Felicia AI Chat"
          title="Click to chat with Felicia"
        >
          <div className="relative flex items-center justify-center">
            <img
              src="/AI-Logo.png"
              alt="Felicia AI"
              className="w-7 h-7 object-contain pointer-events-none drop-shadow-xs"
            />
            {/* Online Green Pulsing Indicator */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-white animate-pulse" />
          </div>
        </button>
      </div>

      {/* 2. Fixed Open Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-9999 w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px] ${
            isMinimized ? "h-auto" : "h-[510px]"
          } bg-white rounded-2xl shadow-2xl border border-divider flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200`}
        >
          {/* Chat Header */}
          <div className="bg-primary text-white p-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                <img src="/AI-Logo.png" alt="Felicia" className="w-5 h-5 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight leading-tight truncate">Felicia AI</h3>
                  <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                </div>
                <p className="text-[11px] text-blue-100/90 truncate">
                  {isLoading ? "Thinking..." : "Always here to guide & support"}
                </p>
              </div>
            </div>

            {/* Actions: Restart, Minimize, Close */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1.5 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-offwhite/50 select-text">
                {messages.map((message) => {
                  const isBot = message.sender === "bot";
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2.5 items-end ${isBot ? "justify-start" : "justify-end"}`}
                    >
                      {isBot && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mb-1">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                          isBot
                            ? "bg-white text-darkerb border border-divider rounded-bl-xs"
                            : "bg-primary text-white rounded-br-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 font-medium ${
                            isBot ? "text-neutral" : "text-blue-100/80"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>

                      {!isBot && (
                        <div className="w-7 h-7 rounded-full bg-darkerb text-white font-bold text-xs flex items-center justify-center shrink-0 mb-1 border border-darkerb/20">
                          {email?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Animated Typing Indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 items-end justify-start">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-white border border-divider text-darkerb rounded-2xl rounded-bl-xs px-3.5 py-3 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* In-Chat Quick Prompt Chips */}
              <div className="px-3 py-2 bg-white border-t border-divider/60 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                {QUICK_ACTIONS.slice(0, 3).map((act) => (
                  <button
                    key={act.label}
                    type="button"
                    onClick={() => void handleSendMessage(act.prompt)}
                    disabled={isLoading}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full bg-offwhite hover:bg-primary hover:text-white text-darkerb border border-divider/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {act.icon} {act.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-white border-t border-divider shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask Felicia anything..."
                    className="flex-1 px-3.5 py-2 text-xs bg-offwhite border border-divider rounded-xl text-darkerb placeholder:text-neutral focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 rounded-xl bg-primary hover:bg-darkerb text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Clinical Disclaimer */}
                <p className="text-[10px] text-neutral text-center mt-2 leading-tight">
                  Felicia is an AI companion for emotional support, not clinical emergency care.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FeliciaChatbot;