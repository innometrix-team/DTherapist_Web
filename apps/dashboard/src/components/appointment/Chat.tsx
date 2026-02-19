import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Input } from "@mui/material";

// Import your existing APIs and types
import { Appointment } from "../../api/Appointments.api";
import {
  getChatHistory,
  sendChatMessage,
  transformChatMessage,
  ChatMessage,
} from "../../api/Chat.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import socketService from "../../Services/SocketService";
import { formatMessageTime, groupMessagesByDate } from "../../utils/Date.utils";

// Types - Updated to match IMessage interface from DAnonymousChat
interface Message {
  _id: string; // Changed from id to _id to match IMessage
  id: string; // Keep both for backward compatibility
  content: string;
  timestamp: Date;
  senderId: string;
  isOwn: boolean;
  createdAt: string;
  userId: string;
  groupId: string; // Required string, not optional
}

interface Recipient {
  id: string;
  name: string;
  avatar: string;
  occupation: string;
}

// Extended appointment interface to handle additional properties
interface ExtendedAppointment extends Appointment {
  userId?: string;
  counselorId?: string;
  clientId?: string;
  counselorName?: string;
  therapistName?: string;
  counselorAvatar?: string;
}

// Updated interface to match the props being passed
interface ChatComponentProps {
  appointmentId?: string; // Make optional since it's not used
  recipientDetails: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  appointment: Appointment;
  onBack?: () => void;
}

// Date separator component matching DAnonymousChat
const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex justify-center items-center mb-4">
    <div className="bg-white rounded-full shadow-[inset_0px_0px_30px_0px_#FFFFFF33] backdrop-blur-[25px] px-4 py-1">
      <p className="text-gray-500 text-xs">{date}</p>
    </div>
  </div>
);

const ChatComponent: React.FC<ChatComponentProps> = ({
  recipientDetails,
  appointment,
  onBack,
}) => {
  // Navigation hook
  const navigate = useNavigate();

  // Auth and user info
  const { id, role, token } = useAuthStore();
  const isCounselor = role === "counselor";

  // Get user ID safely
  const currentUserId = id;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isConnectedToSocket, setIsConnectedToSocket] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set()); // Track pending messages

  // Helper function to extract client ID from appointment - memoized
  const getClientIdFromAppointment = useCallback(
    (appointment: Appointment): string => {
      const extendedAppointment = appointment as ExtendedAppointment;
      const userId = extendedAppointment.userId;

      if (userId && typeof userId === "string") {
        return userId;
      }

      return recipientDetails.id; // fallback
    },
    [recipientDetails.id]
  );

  // Helper function to extract counselor ID from appointment - memoized
  const getCounselorIdFromAppointment = useCallback(
    (appointment: Appointment): string => {
      const extendedAppointment = appointment as ExtendedAppointment;
      const therapistId = extendedAppointment.therapistId;

      if (therapistId && typeof therapistId === "string") {
        return therapistId;
      }

      return recipientDetails.id; // fallback
    },
    [recipientDetails.id]
  );

  // Set up recipient from props with proper ID extraction
  useEffect(() => {
    if (recipientDetails && appointment) {
      // Extract the correct recipient ID based on user role and appointment data
      let recipientId: string;

      if (isCounselor) {
        // Counselor is chatting with client
        recipientId = getClientIdFromAppointment(appointment);
      } else {
        // Client is chatting with counselor
        recipientId = getCounselorIdFromAppointment(appointment);
      }

      setRecipient({
        id: recipientId,
        name: recipientDetails.name,
        avatar: recipientDetails.avatar,
        occupation: recipientDetails.role === "client" ? "Client" : "Therapist",
      });
    }

    // Set chatId from appointment
    const extendedAppointment = appointment as ExtendedAppointment;
    if (extendedAppointment?.chatId) {
      setChatId(extendedAppointment.chatId);
    }
  }, [
    recipientDetails,
    appointment,
    isCounselor,
    getClientIdFromAppointment,
    getCounselorIdFromAppointment,
  ]);

  // Fetch chat history when chatId is available
  const {
    data: chatHistoryData,
    isLoading: chatHistoryLoading,
    error: chatHistoryError,
  } = useQuery({
    queryKey: ["chat-history", chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return await getChatHistory(chatId, { signal: controller.signal });
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!chatId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: Parameters<typeof sendChatMessage>[0]) => sendChatMessage(data),
    onSuccess: (response, variables) => {
      if (response?.data) {
        // Set chatId if we don't have it yet
        if (!chatId && response.data.chatId) {
          setChatId(response.data.chatId);
        }

        // Remove the optimistic message by content match
        const sentContent = variables.message;
        setMessages((prev) => {
          return prev.filter(
            (msg) =>
              !(msg.id.startsWith("temp-") && msg.content === sentContent)
          );
        });

        // Clear the pending message from tracking
        const tempId = `temp-${Date.now()}-${sentContent}`;
        pendingMessagesRef.current.delete(tempId);

        setNewMessage("");
      }
    },
    onError: (error: string, variables) => {
      // Remove optimistic message on error using the variables passed to mutation
      const failedContent = variables.message;
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            !(msg.id.startsWith("temp-") && msg.content === failedContent)
        )
      );

      // Extract error message safely
      let errorMessage = "Unknown error";
      if (typeof error === "string") {
        errorMessage = error;
      }

      // More specific error handling
      if (errorMessage.includes("booking")) {
        toast.error("You must have a valid appointment to chat with this user");
      } else {
        toast.error("Failed to send message: " + errorMessage);
      }
    },
  });

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const initializeSocket = async () => {
      try {
        const socketUrl = import.meta.env.VITE_SOCKET_URL;
        if (!socketUrl) {
          toast.error("Chat service configuration error");
          return;
        }

        if (!socketService.isSocketConnected()) {
          await socketService.connect(token);
        }
        setIsConnectedToSocket(true);
      } catch {
        toast.error(
          "Failed to connect to chat service. Please check your connection."
        );
        setIsConnectedToSocket(false);
      }
    };

    initializeSocket();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [token]);

  // Transform message for compatibility with DAnonymousChat structure
  const transformMessageForDisplay = useCallback(
    (msg: ChatMessage, currentUserId: string): Message => {
      const baseMessage = transformChatMessage(msg, currentUserId);
      return {
        ...baseMessage,
        _id: baseMessage.id, // Add _id property for IMessage compatibility
        createdAt: msg.createdAt || new Date().toISOString(),
        userId: msg.senderId || baseMessage.senderId,
        groupId: chatId || "temp-chat", // Ensure groupId is always a string
      };
    },
    [chatId]
  );

  // Load chat history when available - FIXED: Added transformMessageForDisplay dependency
  useEffect(() => {
    if (!chatHistoryData?.data || !currentUserId) return;

    const messagesArray = chatHistoryData.data;

    if (Array.isArray(messagesArray)) {
      const transformedMessages = messagesArray.map((msg) =>
        transformMessageForDisplay(msg, currentUserId)
      );

      setMessages(transformedMessages);
    }
  }, [chatHistoryData, currentUserId, transformMessageForDisplay]);

  // Join socket room when chatId is available
  useEffect(() => {
    if (!chatId || !isConnectedToSocket) return;

    socketService.joinRoom(chatId);

    // Set up message listener
    const unsubscribe = socketService.onNewMessage((message: ChatMessage) => {
      if (currentUserId && message) {
        const transformedMessage = transformMessageForDisplay(
          message,
          currentUserId
        );

        setMessages((prev) => {
          const currentMessages = prev || [];
          const messageExists = currentMessages.some(
            (msg) => msg.id === transformedMessage.id
          );
          if (messageExists) {
            return currentMessages;
          }

          return [...currentMessages, transformedMessage];
        });
      }
    });

    return () => {
      unsubscribe();
      if (chatId) {
        socketService.leaveRoom(chatId);
      }
    };
  }, [chatId, isConnectedToSocket, currentUserId, transformMessageForDisplay]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Group messages by date similar to DAnonymousChat
  const messageGroups = React.useMemo(
    () => groupMessagesByDate(messages || []),
    [messages]
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipient || sendMessageMutation.isPending)
      return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}-${messageContent}`;
    pendingMessagesRef.current.add(tempId);

    // Add optimistic message immediately for better UX
    if (currentUserId) {
      const optimisticMessage: Message = {
        _id: tempId,
        id: tempId,
        content: messageContent,
        timestamp: new Date(),
        senderId: currentUserId,
        isOwn: true,
        createdAt: new Date().toISOString(),
        userId: currentUserId,
        groupId: chatId || "temp-chat",
      };
      setMessages((prev) => {
        const currentMessages = prev || [];
        return [...currentMessages, optimisticMessage];
      });
    }

    // Send message via API
    sendMessageMutation.mutate({
      receiverId: recipient.id,
      message: messageContent,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/appointments");
    }
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  // Don't render if no role or user ID
  if (!role || !currentUserId) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Please log in to view chat.</p>
      </div>
    );
  }

  // Loading state matching DAnonymousChat
  if (chatHistoryLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading messages...</p>
      </div>
    );
  }

  // Error state matching DAnonymousChat
  if (chatHistoryError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Error loading messages. Please try again later.</p>
      </div>
    );
  }

  // No recipient found
  if (!recipient) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Chat participant not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-white overflow-hidden">
      {/* Header matching DAnonymousChat style - Fixed */}
      <div className="border-b border-gray-200 relative shrink-0">
        <img
          src={
            recipient.avatar ||
            "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=200&fit=crop"
          }
          className="object-cover h-full w-full object-center absolute top-0 bottom-0 left-0 right-0"
          onError={handleImageError}
        />

        <div className="flex items-center bg-black/75 relative flex-1 p-4">
          <button
            onClick={handleBackClick}
            className="p-2 text-white hover:text-gray-300 transition-colors mr-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white shrink-0 mr-2">
            {!imageLoadError && recipient.avatar ? (
              <img
                src={recipient.avatar}
                className="h-full w-full object-fit-cover rounded-lg"
                onError={handleImageError}
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-lg">
              {recipient.name}
            </h2>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-[#C2C2C2] mb-1 font-medium">
                {recipient.occupation}
              </p>
              {!isConnectedToSocket && (
                <span className="text-xs bg-red-500 px-2 py-1 rounded-full">
                  Offline
                </span>
              )}
              {isConnectedToSocket && (
                <span className="text-xs bg-green-500 px-2 py-1 rounded-full">
                  Online
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages section matching DAnonymousChat - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-offwhite min-h-0">
        {messageGroups.map((group) => (
          <div key={`group-${group.date}`}>
            <DateSeparator date={group.date} />
            <div className="space-y-4">
             {group.messages.map((msg, index) => (
  <div
    key={msg._id + index}
    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${
        msg.isOwn
          ? "bg-primary text-white rounded-br-md"
          : "bg-white text-gray-800 rounded-bl-md shadow-sm"
      }`}
    >
      <p className="text-sm leading-relaxed wrap-break-words">{msg.content}</p>
      <div className={`text-xs mt-2 ${msg.isOwn ? "text-blue-100" : "text-gray-500"}`}>
        {formatMessageTime(msg.createdAt)}
      </div>
    </div>
  </div>
))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input section matching DAnonymousChat - Fixed */}
      <div className="bg-[#F7FAFF] p-4 border-t border-gray-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <Input
            multiline
            maxRows={3}
            fullWidth
            disableUnderline
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type a message to ${recipient.name}...`}
            className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-base lg:text-sm"
            disabled={!isConnectedToSocket || sendMessageMutation.isPending}
          />
          <button
            type="submit"
            disabled={
              sendMessageMutation.isPending ||
              !newMessage?.trim() ||
              !isConnectedToSocket
            }
            className="w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
            ) : (
              <Send className="w-full h-full text-black rotate-45" />
            )}
          </button>
        </form>

        {!isConnectedToSocket && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Connection lost. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;
