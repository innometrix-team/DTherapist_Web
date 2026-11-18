import { IMessage } from "../api/Groups.api";
import { MessageGroup } from "../pages/danonymous/types";

// Helper functions for date handling
export const formatDateDDMMYYYY = (
  value?: string | Date | null,
  fallback = ""
): string => {
  if (!value) return fallback;

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : fallback;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

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
    
    return formatDateDDMMYYYY(messageDate);
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