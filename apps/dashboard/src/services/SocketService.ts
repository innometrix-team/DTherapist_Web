import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { ChatMessage } from '../api/Chat.api';
import type { IMessage } from '../api/Groups.api';
import type { IUserNotification } from '../api/Notifications.api';
import { env } from '../configs/env.config';

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
    if (this.isConnected && this.socket?.connected) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      try {
        // Use HTTP/HTTPS URL and specify the path as instructed by your backend engineer
        this.socket = io(env.SOCKET_URL, {
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
          if (this.currentGroupId) {
            this.socket?.emit('joinGroupRoom', { groupId: this.currentGroupId });
          }
          if (this.currentChatId) {
            this.socket?.emit('joinRoom', { chatId: this.currentChatId });
          }
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
        reject(error instanceof Error ? error : new Error(String(error)));
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

    this.socket.emit('joinRoom', { chatId });
    this.currentChatId = chatId;
  }

  // ---------------------------------------------------------------------------
  // Call-specific chat helpers (temporary websocket chat during a video session)
  // ---------------------------------------------------------------------------

  // join the call chat room (agora channel identifier)
  joinCallChat(channel: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('joinCallChat', { channel });
    this.currentChatId = channel;
  }

  // leave the call chat room
  leaveCallChat(channel: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('leaveCallChat', { channel });
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
    senderId?: string;
    message: string;
  }): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('sendCallMessage', {
      channel: payload.channel,
      message: payload.message,
    });
  }

  // Leave a chat room
  leaveRoom(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leaveRoom', { chatId });
    
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // DAnonymous Group Chat helpers
  // ---------------------------------------------------------------------------

  // Join a group room (for DAnonymous support groups)
  joinGroupRoom(groupId: string): void {
    if (this.currentGroupId && this.currentGroupId !== groupId) {
      this.leaveGroupRoom(this.currentGroupId);
    }
    this.currentGroupId = groupId;

    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('joinGroupRoom', { groupId });
  }

  // Leave a group room
  leaveGroupRoom(groupId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leaveGroupRoom', { groupId });
    if (this.currentGroupId === groupId) {
      this.currentGroupId = null;
    }
  }

  // Listen for new group messages
  onNewGroupMessage(callback: (message: IMessage) => void): () => void {
    if (!this.socket) {
      return () => {};
    }

    const handler = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const payload = data as Record<string, unknown>;
      const message = (
        payload.message && typeof payload.message === 'object'
          ? payload.message
          : payload.data && typeof payload.data === 'object'
          ? payload.data
          : payload
      ) as IMessage;

      if (message && (message._id || message.content)) {
        callback(message);
      }
    };

    this.socket.on('newGroupMessage', handler);
    this.socket.on('groupMessage', handler);
    this.socket.on('newMessage', handler);

    return () => {
      if (this.socket) {
        this.socket.off('newGroupMessage', handler);
        this.socket.off('groupMessage', handler);
        this.socket.off('newMessage', handler);
      }
    };
  }

  // Listen for deleted group messages
  onGroupMessageDeleted(
    callback: (deletedData: { messageId?: string; _id?: string; groupId?: string }) => void
  ): () => void {
    if (!this.socket) {
      return () => {};
    }

    const handler = (data: unknown) => {
      if (!data) return;
      if (typeof data === 'string') {
        callback({ messageId: data });
      } else if (typeof data === 'object') {
        callback(data as { messageId?: string; _id?: string; groupId?: string });
      }
    };

    this.socket.on('groupMessageDeleted', handler);
    this.socket.on('messageDeleted', handler);

    return () => {
      if (this.socket) {
        this.socket.off('groupMessageDeleted', handler);
        this.socket.off('messageDeleted', handler);
      }
    };
  }

  // Send a message over group socket (alongside REST for instant delivery)
  sendGroupMessage(payload: {
    groupId: string;
    content: string;
    replyTo?: string | null;
    parentAuthorId?: string;
  }): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('sendGroupMessage', payload);
    this.socket.emit('groupMessage', payload);
  }

  // Send group typing indicator
  sendGroupTyping(groupId: string, isTyping: boolean): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('groupTyping', { groupId, isTyping });
  }

  // Listen for group typing indicators
  onGroupTyping(callback: (data: TypingData & { groupId?: string }) => void): () => void {
    if (!this.socket) {
      return () => {};
    }

    const handler = (data: unknown) => {
      if (data && typeof data === 'object') {
        callback(data as TypingData & { groupId?: string });
      }
    };

    this.socket.on('groupTyping', handler);

    return () => {
      if (this.socket) {
        this.socket.off('groupTyping', handler);
      }
    };
  }

  // Get current group ID
  getCurrentGroupId(): string | null {
    return this.currentGroupId;
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

  // Listen for real-time notifications
  onNotification(
    callback: (notification: IUserNotification) => void
  ): () => void {
    if (!this.socket) {
      return () => {};
    }

    const handler = (data: unknown) => {
      if (data && typeof data === 'object') {
        callback(data as IUserNotification);
      }
    };

    this.socket.on('notification', handler);
    this.socket.on('new_notification', handler);
    this.socket.on('forum_reply', handler);
    this.socket.on('community_reply', handler);

    return () => {
      if (this.socket) {
        this.socket.off('notification', handler);
        this.socket.off('new_notification', handler);
        this.socket.off('forum_reply', handler);
        this.socket.off('community_reply', handler);
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

  // Emit screen capture / recording notice to an active joined room
  emitScreenCaptured(
    room: string,
    kind: 'screenshot' | 'recording',
    ack?: (response: { ok: boolean; error?: string }) => void
  ): void {
    if (!this.socket || !this.isConnected || !room) {
      return;
    }

    this.socket.emit('screenCaptured', { room, kind }, (response: unknown) => {
      if (ack && response && typeof response === 'object') {
        ack(response as { ok: boolean; error?: string });
      }
    });
  }

  // Listen for screen capture / recording notices in the active room
  onScreenCaptured(
    callback: (data: { kind: 'screenshot' | 'recording'; at?: string }) => void
  ): () => void {
    if (!this.socket) {
      return () => {};
    }

    const handler = (data: unknown) => {
      if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        const kind = record.kind === 'recording' ? 'recording' : 'screenshot';
        const at = typeof record.at === 'string' ? record.at : undefined;
        callback({ kind, at });
      }
    };

    this.socket.on('screenCaptured', handler);

    return () => {
      if (this.socket) {
        this.socket.off('screenCaptured', handler);
      }
    };
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