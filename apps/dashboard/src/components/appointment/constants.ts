// src/components/appointment/constants.ts
import { Session } from './types';

export const UPCOMING_SESSIONS: Session[] = [
  {
    id: '1',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 18th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Physical',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: '2',
    clientName: 'Royce jake',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 18th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: '3',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 18th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: '4',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 18th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: '5',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 18th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: '6',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 18th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: '7',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 18th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  }
];

export const PASSED_SESSIONS: Session[] = [
  {
    id: 'p1',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 11th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: 'p2',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, May 4th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  },
  {
    id: 'p3',
    clientName: 'Royce Kambell',
    clientImage: '/api/placeholder/40/40',
    date: 'Thur, Apr 27th, 2025',
    time: '10:00 - 11:00AM',
    timeZone: '(WAT)',
    type: 'Video Call',
    profession: 'Software Engineer',
    experience: '12 Years Experience',
    nationality: 'Nigerian',
    price: 58.00,
    clientBio: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat. Lorem ipsum dolor sit amet consectetur. Mauris purus vulputate amet consequat.'
  }
];


import { User, Message } from './types';

export const MOCK_CURRENT_USER: User = {
  id: 'current-user',
  name: 'You',
  occupation: 'User',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
};

export const MOCK_RECIPIENT: User = {
  id: 'royce-kembel',
  name: 'Royce Kembel',
  occupation: 'Software Engineer',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face'
};

export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: 'current-user',
    content: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. s vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu',
    timestamp: new Date('2024-01-01T12:26:00'),
    isOwn: true
  },
  {
    id: '2',
    senderId: 'current-user',
    content: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. s vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu',
    timestamp: new Date('2024-01-01T12:26:00'),
    isOwn: true
  },
  {
    id: '3',
    senderId: 'royce-kembel',
    content: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. s vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu',
    timestamp: new Date('2024-01-01T12:26:00'),
    isOwn: false
  },
  {
    id: '4',
    senderId: 'current-user',
    content: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. s vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu',
    timestamp: new Date('2024-01-01T12:26:00'),
    isOwn: true
  }
];

export const CHAT_CONFIG = {
  maxMessageLength: 1000,
  typingIndicatorTimeout: 3000,
  messageTimestampFormat: 'h:mm A',
  reconnectAttempts: 3,
  reconnectDelay: 1000
} as const;