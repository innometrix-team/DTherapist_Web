import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { ChatMessage } from '../api/Chat.api';

// Interface for typing indicator data
interface TypingData {
  userId: string;
  isTyping: boolean;
}

// Socket.IO service for real-time chat
class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private currentChatId: string | null = null;
  
  // Initialize socket connection
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use HTTP/HTTPS URL and specify the path as instructed by your backend engineer
        this.socket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL, {
          path: "/ws", // This is the key addition your backend engineer specified
          auth: {
            token: token
          },
          transports: ['websocket'],
          forceNew: true,
          // Add these options for better connection handling
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          resolve();
        });

        this.socket.on('connect_error', (error: Error) => {
          
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          
          this.isConnected = false;
        });

        this.socket.on('error', () => {
          
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Join a chat room
  joinRoom(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    // Leave previous room if exists
    if (this.currentChatId && this.currentChatId !== chatId) {
      this.leaveRoom(this.currentChatId);
    }

    this.socket.emit('joinRoom', chatId); // Backend expects just chatId, not { chatId }
    this.currentChatId = chatId;
  }

  // ---------------------------------------------------------------------------
  // Call-specific chat helpers (temporary websocket chat during a video session)
  // ---------------------------------------------------------------------------

  // join the call chat room (agora channel identifier)
  joinCallChat(channel: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('joinCallChat', channel);
    this.currentChatId = channel;
  }

  // leave the call chat room
  leaveCallChat(channel: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('leaveCallChat', channel);
    if (this.currentChatId === channel) {
      this.currentChatId = null;
    }
  }

  // subscribe to incoming call messages
  onReceiveCallMessage(
    callback: (msg: { id: string; senderId: string; message: string }) => void
  ): () => void {
    if (!this.socket) {
      return () => {};
    }
    this.socket.on('receiveCallMessage', callback);
    return () => {
      if (this.socket) {
        this.socket.off('receiveCallMessage', callback);
      }
    };
  }

  // send a message over the call chat
  sendCallMessage(payload: {
    channel: string;
    senderId: string;
    message: string;
  }): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('sendCallMessage', payload);
  }

  // Leave a chat room
  leaveRoom(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leaveRoom', chatId); // Backend expects just chatId, not { chatId }
    
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  // Listen for new messages
  onNewMessage(callback: (message: ChatMessage) => void): () => void {
    if (!this.socket) {

      return () => {};
    }

   
    this.socket.on('newMessage', callback);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.off('newMessage', callback);
      }
    };
  }

  // Listen for typing indicators (optional feature)
  onTyping(callback: (data: TypingData) => void): () => void {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('typing', callback);

    return () => {
      if (this.socket) {
        this.socket.off('typing', callback);
      }
    };
  }

  // Send typing indicator (optional feature)
  sendTyping(chatId: string, isTyping: boolean): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing', { chatId, isTyping });
  }

  // Check if socket is connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get current chat ID
  getCurrentChatId(): string | null {
    return this.currentChatId;
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      
      // Leave current room if exists
      if (this.currentChatId) {
        this.leaveRoom(this.currentChatId);
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentChatId = null;
    }
  }

  // Reconnect socket
  reconnect(token: string): Promise<void> {
    this.disconnect();
    return this.connect(token);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;