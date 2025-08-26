
export interface Session {
    id: string;
    clientName: string;
    clientImage: string;
    date: string;
    time: string;
    timeZone: string;
    type: string;

    clientBio: string;
    profession: string;
    experience: string;
    nationality: string;
    price: number;
  
  }
  
  export type TabType = 'upcoming' | 'passed';

  export interface Client {
    id: string;
    name: string;
    occupation: string;
    experience: string;
    nationality: string;
    about: string;
    imageUrl: string;
  }

  export interface User {
  id: string;
  name: string;
  occupation: string;
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface ChatState {
  messages: Message[];
  currentUser: User;
  recipient: User;
  isTyping: boolean;
  isConnected: boolean;
}

export interface ChatProps {
  recipient: User;
  currentUser: User;
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  onBackClick?: () => void;
}