import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, AlertCircle, User } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Import your existing APIs and types
import { 
  Appointment,
} from '../../api/Appointments.api';
import { 
  getChatHistory, 
  sendChatMessage, 
  transformChatMessage,
  ChatMessage,
} from '../../api/Chat.api';
import { useAuthStore } from '../../store/auth/useAuthStore';
import socketService from '../../Services/SocketService';

// Types
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  isOwn: boolean;
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
  appointmentId: string;
  recipientDetails: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  appointment: Appointment;
  onBack?: () => void;
}

const formatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-1`}>
      <div className="flex items-end max-w-[85%] sm:max-w-[75%] lg:max-w-md">
        <div className={`px-3 sm:px-4 py-2 rounded-2xl break-words ${
          message.isOwn 
            ? 'bg-blue-600 text-white rounded-br-sm order-1' 
            : 'bg-gray-200 text-gray-900 rounded-bl-sm order-1'
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className={`flex items-end mx-1 sm:mx-2 mb-1 ${message.isOwn ? 'order-2' : 'order-2'}`}>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ChatComponent: React.FC<ChatComponentProps> = ({ 
  appointmentId, 
  recipientDetails, 
  appointment, 
  onBack 
}) => {
  // Navigation hook
  const navigate = useNavigate();
  
  // Auth and user info
  const { id, role, token } = useAuthStore();
  const isCounselor = role === 'counselor';
  
  // Get user ID safely
  const currentUserId = id;
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isConnectedToSocket, setIsConnectedToSocket] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set()); // Track pending messages

  // Helper function to extract client ID from appointment - memoized
  const getClientIdFromAppointment = useCallback((appointment: Appointment): string => {
    const extendedAppointment = appointment as ExtendedAppointment;
    const userId = extendedAppointment.userId;
    
    if (userId && typeof userId === 'string') {
      return userId;
    }

    return recipientDetails.id; // fallback
  }, [recipientDetails.id]);

  // Helper function to extract counselor ID from appointment - memoized
  const getCounselorIdFromAppointment = useCallback((appointment: Appointment): string => {
    const extendedAppointment = appointment as ExtendedAppointment;
    const therapistId = extendedAppointment.therapistId;
    
    if (therapistId && typeof therapistId === 'string') {
      return therapistId;
    }
    
    return recipientDetails.id; // fallback
  }, [recipientDetails.id]);

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
        occupation: recipientDetails.role === 'client' ? 'Client' : 'Therapist'
      });
    }

    // Set chatId from appointment
    const extendedAppointment = appointment as ExtendedAppointment;
    if (extendedAppointment?.chatId) {
      setChatId(extendedAppointment.chatId);
    }
  }, [recipientDetails, appointment, isCounselor, getClientIdFromAppointment, getCounselorIdFromAppointment]);

  // Fetch chat history when chatId is available
  const { 
    data: chatHistoryData,
    isLoading: chatHistoryLoading,
    error: chatHistoryError
  } = useQuery({
    queryKey: ['chat-history', chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return await getChatHistory(chatId, { signal: controller.signal });
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!chatId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (response, variables) => {
      
      if (response?.data) {
        // Set chatId if we don't have it yet
        if (!chatId && response.data.chatId) {
          setChatId(response.data.chatId);
        }

        // Remove the optimistic message by content match
        const sentContent = variables.message;
        setMessages(prev => {
          return prev.filter(msg => 
            !(msg.id.startsWith('temp-') && msg.content === sentContent)
          );
        });

        // Clear the pending message from tracking
        const tempId = `temp-${Date.now()}-${sentContent}`;
        pendingMessagesRef.current.delete(tempId);

        // Don't manually add the server message here - let the socket handle it
        // This prevents duplicate messages since the socket will receive the new message

        setNewMessage('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    onError: (error: string, variables) => {
      
      
      // Remove optimistic message on error using the variables passed to mutation
      const failedContent = variables.message;
      setMessages(prev => 
        prev.filter(msg => 
          !(msg.id.startsWith('temp-') && msg.content === failedContent)
        )
      );

      // Extract error message safely
      let errorMessage = 'Unknown error';
      if (typeof error === 'string') {
        errorMessage = error;
      } 

     

      // More specific error handling
      if (errorMessage.includes('booking')) {
        toast.error('You must have a valid appointment to chat with this user');
      } else {
        toast.error('Failed to send message: ' + errorMessage);
      }
    }
  });

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const initializeSocket = async () => {
      try {
       
        
        // Check if socket URL is defined
        const socketUrl = import.meta.env.VITE_SOCKET_URL;
        if (!socketUrl) {
         
          toast.error('Chat service configuration error');
          return;
        }
        
        
        
        if (!socketService.isSocketConnected()) {
          await socketService.connect(token);
        }
        setIsConnectedToSocket(true);
        
      } catch  {
        toast.error('Failed to connect to chat service. Please check your connection.');
        setIsConnectedToSocket(false);
      }
    };

    initializeSocket();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [token]);

  // Load chat history when available
  useEffect(() => {
    if (!chatHistoryData?.data || !currentUserId) return;

    // Now chatHistoryData.data is directly a ChatMessage[] array
    const messagesArray = chatHistoryData.data;
    
    if (Array.isArray(messagesArray)) {
      const transformedMessages = messagesArray.map(msg => 
        transformChatMessage(msg, currentUserId)
      );

      setMessages(transformedMessages);
    } 
  }, [chatHistoryData, currentUserId]);

  // Join socket room when chatId is available
  useEffect(() => {
    if (!chatId || !isConnectedToSocket) return;

    socketService.joinRoom(chatId);

    // Set up message listener
    const unsubscribe = socketService.onNewMessage((message: ChatMessage) => {
      
      if (currentUserId && message) {
        const transformedMessage = transformChatMessage(message, currentUserId);
        
        setMessages(prev => {
          // Ensure prev is an array
          const currentMessages = prev || [];
          
          // Always add new messages from socket - don't filter by sender
          // The deduplication should only check by message ID, not sender
          const messageExists = currentMessages.some(msg => msg.id === transformedMessage.id);
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
  }, [chatId, isConnectedToSocket, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipient || sendMessageMutation.isPending) return;

    const messageContent = newMessage.trim();
    // Create temporary ID for tracking
    const tempId = `temp-${Date.now()}-${messageContent}`;
    pendingMessagesRef.current.add(tempId);

    // Add optimistic message immediately for better UX
    if (currentUserId) {
      const optimisticMessage: Message = {
        id: tempId,
        content: messageContent,
        timestamp: new Date(),
        senderId: currentUserId,
        isOwn: true
      };
      setMessages(prev => {
        const currentMessages = prev || [];
        return [...currentMessages, optimisticMessage];
      });
    }

    // Send message via API
    sendMessageMutation.mutate({
      receiverId: recipient.id,
      message: messageContent
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleBackClick = () => {
    // First try the onBack prop if provided
    if (onBack) {
      onBack();
    } else {
      // Fallback to navigation - navigate to appointments page
      navigate('/appointments');
    }
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  // Don't render if no role or user ID
  if (!role || !currentUserId) {
    return (
      <div className="flex flex-col h-screen w-full max-w-full bg-white items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view chat.</p>
        </div>
      </div>
    );
  }

  // No recipient found
  if (!recipient) {
    return (
      <div className="flex flex-col h-screen w-full max-w-full bg-white items-center justify-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <p className="text-gray-600 mb-4">Chat participant not found</p>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Debug: Role={role}, IsCounselor={isCounselor}</div>
          <div>AppointmentId: {appointmentId}</div>
          <div>Available appointment data: {JSON.stringify(appointment, null, 2)}</div>
        </div>
        <button 
          onClick={handleBackClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mt-4"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-full bg-white overflow-hidden">
      {/* Header */}
      <div 
        className="relative flex items-center px-3 sm:px-4 py-3 text-white min-h-[72px] sm:min-h-[80px]"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=200&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Content */}
        <div className="relative flex items-center w-full">
          {/* Avatar with fallback */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-2 sm:mr-3 flex-shrink-0 overflow-hidden bg-gray-300">
            {!imageLoadError && recipient.avatar ? (
              <img
                src={recipient.avatar}
                alt={recipient.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-400">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg truncate pr-2">{recipient.name}</h3>
            <div className="flex items-center space-x-2">
              <p className="text-xs sm:text-sm text-gray-200 truncate">{recipient.occupation}</p>
              {!isConnectedToSocket && (
                <span className="text-xs bg-red-500 px-2 py-1 rounded-full">Offline</span>
              )}
              {isConnectedToSocket && (
                <span className="text-xs bg-green-500 px-2 py-1 rounded-full">Online</span>
              )}
            </div>
          </div>
          <button 
            onClick={handleBackClick}
            className="ml-2 p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1">
        {chatHistoryLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Loading chat history...</span>
          </div>
        )}

        {chatHistoryError && (
          <div className="flex justify-center py-4">
            <p className="text-red-500 text-sm">Failed to load chat history</p>
          </div>
        )}
        
        {messages && messages.length === 0 && !chatHistoryLoading && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500 text-sm">Start a conversation with {recipient.name}</p>
          </div>
        )}
        
        {messages && messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0 left-0 right-0 z-10">
        <div className="p-3 sm:p-4 max-w-full">
          <div className="flex items-end space-x-2 max-w-full">
            <div className="flex-1 relative min-w-0">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyPress={handleKeyPress}
                placeholder={`Type a message to ${recipient.name}...`}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-2xl sm:rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[120px] text-sm sm:text-base disabled:opacity-50 block"
                rows={1}
                style={{ minHeight: '44px' }}
                disabled={!isConnectedToSocket || sendMessageMutation.isPending}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnectedToSocket || sendMessageMutation.isPending}
              className="p-2.5 sm:p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              ) : (
                <Send size={18} className="sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
          
          {!isConnectedToSocket && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Connection lost. Trying to reconnect...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;