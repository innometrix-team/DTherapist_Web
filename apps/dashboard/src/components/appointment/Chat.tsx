import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import {  Message, ChatProps } from './types';
import { MOCK_CURRENT_USER, MOCK_RECIPIENT, MOCK_MESSAGES } from './constants';

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

const ChatComponent: React.FC<ChatProps> = ({
  recipient = MOCK_RECIPIENT,
  currentUser = MOCK_CURRENT_USER,
  messages = MOCK_MESSAGES,
  onSendMessage,
  onBackClick
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage?.(newMessage.trim());
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
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
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        
        {/* Content */}
        <div className="relative flex items-center w-full">
          <img
            src={recipient.avatar}
            alt={recipient.name}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-2 sm:mr-3 object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg truncate pr-2">{recipient.name}</h3>
            <p className="text-xs sm:text-sm text-gray-200 truncate">{recipient.occupation}</p>
          </div>
          <button 
            onClick={onBackClick}
            className="ml-2 p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={{
              ...message,
              isOwn: message.senderId === currentUser.id
            }} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-2 sm:p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-2xl sm:rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 sm:max-h-30 text-sm sm:text-base"
              rows={1}
              style={{ minHeight: '40px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;