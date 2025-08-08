import { IMessage } from "../api/Groups.api";
import { MessageGroup } from "../pages/danonymous/types";

// Helper functions for date handling
export const formatMessageDate = (dateString: string): string => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
  
    // Reset hours to compare just the dates
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
    if (messageDay.getTime() === todayDay.getTime()) return 'Today';
    if (messageDay.getTime() === yesterdayDay.getTime()) return 'Yesterday';
    
    return messageDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  export const formatMessageTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  export const groupMessagesByDate = (messages: IMessage[]): MessageGroup[] => {
    const groups: { [key: string]: IMessage[] } = {};
  
    // Group messages by date
    messages.forEach(message => {
      const dateKey = formatMessageDate(message.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
  
    // Convert groups object to array
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };