import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { ChatMessage } from '../api/Chat.api';
import type { IMessage } from '../api/Groups.api';

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
  private currentGroupId: string | null = null;
  
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

  // Join a chat room (for one-on-one chats)
  joinRoom(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    // Leave previous room if exists
    if (this.currentChatId && this.currentChatId !== chatId) {
      this.leaveRoom(this.currentChatId);
    }

    this.socket.emit('joinRoom', chatId);
    this.currentChatId = chatId;
  }

  // Leave a chat room (for one-on-one chats)
  leaveRoom(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leaveRoom', chatId);
    
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  // Join a group room (for group chats)
  joinGroupRoom(groupId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    // Leave previous group room if exists
    if (this.currentGroupId && this.currentGroupId !== groupId) {
      this.leaveGroupRoom(this.currentGroupId);
    }

    this.socket.emit('joinGroup', groupId);
    this.currentGroupId = groupId;
  }

  // Leave a group room
  leaveGroupRoom(groupId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leaveGroup', groupId);
    
    if (this.currentGroupId === groupId) {
      this.currentGroupId = null;
    }
  }

  // Listen for new messages (one-on-one chats)
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

  // Listen for new group messages
  onNewGroupMessage(callback: (message: IMessage) => void): () => void {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('newGroupMessage', callback);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.off('newGroupMessage', callback);
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

  // Send group typing indicator (optional feature)
  sendGroupTyping(groupId: string, isTyping: boolean): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('groupTyping', { groupId, isTyping });
  }

  // Check if socket is connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get current chat ID
  getCurrentChatId(): string | null {
    return this.currentChatId;
  }

  // Get current group ID
  getCurrentGroupId(): string | null {
    return this.currentGroupId;
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      
      // Leave current room if exists
      if (this.currentChatId) {
        this.leaveRoom(this.currentChatId);
      }

      // Leave current group room if exists
      if (this.currentGroupId) {
        this.leaveGroupRoom(this.currentGroupId);
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentChatId = null;
      this.currentGroupId = null;
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