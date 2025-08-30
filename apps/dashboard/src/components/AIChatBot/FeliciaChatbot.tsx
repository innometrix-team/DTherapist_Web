import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Minus } from 'lucide-react';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { sendChatbotMessage } from '../../api/ChatBot.api'; // Import the API service

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const FeliciaChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello welcome to Dtherapist. How can I help you?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botTyping, setBotTyping] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const authState = useAuthStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // API-based message sending
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setBotTyping('');

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const result = await sendChatbotMessage(
        {
          message: messageContent,
          role: authState.role || 'client',
        },
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (result && result.data) {
        const botMessage: Message = {
          id: Date.now().toString(),
          content: result.data || 'I received your message.',
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('No response received');
      }

    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Failed to send message:', error);
      
      let errorText = "I'm sorry, I encountered an error. Please try again.";
      
      // Handle API error response
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorText = error.message;
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setBotTyping('');
      abortControllerRef.current = null;
    }
  }, [inputMessage, isLoading, authState.role]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, botTyping, scrollToBottom]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-blue-800 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50"
        aria-label="Open Felicia AI Chat"
      >
        <div className="relative">
          <img src='/AI-Logo.png' className='bg-primary' alt="" />
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 w-96`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-[500px]">
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                <img src='/AI-Logo.png' className='bg-primary' alt="" />
              </span>
            </div>
            <div>
              <h3 className="font-semibold">Felicia</h3>
              <p className="text-xs text-blue-100">
                {isLoading ? 'Thinking...' : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-blue-800 p-1 rounded transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col space-y-1">
                  {message.sender === 'bot' ? (
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white font-bold text-xs">
                           <img src='/AI-Logo.png' className='bg-primary' alt="F" />
                          </span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-primary text-white p-3 rounded-lg rounded-tl-none max-w-sm">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-end space-x-2">
                      <div className="flex-1">
                        <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none max-w-sm ml-auto">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </p>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-gray-600 font-bold text-xs">
                          {authState.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Bot Typing Indicator - Streaming Text */}
              {botTyping && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-xs">
                       <img src='/AI-Logo.png' className='bg-primary' alt="F" />
                    </span>
                  </div>
                  <div className="bg-primary text-white p-3 rounded-lg rounded-tl-none max-w-xs">
                    <div className="text-sm">{botTyping}<span className="animate-pulse">|</span></div>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !botTyping && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-xs">
                       <img src='/AI-Logo.png' className='bg-primary' alt="F" />
                    </span>
                  </div>
                  <div className="bg-primary text-white p-3 rounded-lg rounded-tl-none max-w-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleQuickAction("I need a counsellor")}
                  className="flex items-center space-x-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full hover:bg-yellow-200 transition-colors"
                  disabled={isLoading}
                >
                  <span>👩‍⚕️</span>
                  <span>Need a counsellor?</span>
                </button>
                <button 
                  onClick={() => handleQuickAction("i need advice")}
                  className="flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                  disabled={isLoading}
                >
                  <span>💰</span>
                  <span>Advice</span>
                </button>
                <button 
                  onClick={() => handleQuickAction("i need therapy")}
                  className="flex items-center space-x-1 text-xs bg-blue-100 text-primary px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                  disabled={isLoading}
                >
                  <span>❓</span>
                  <span>Therapy</span>
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-primary hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* Status */}
              {isLoading && (
                <p className="text-xs text-blue-500 mt-2">Sending message...</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeliciaChatbot;