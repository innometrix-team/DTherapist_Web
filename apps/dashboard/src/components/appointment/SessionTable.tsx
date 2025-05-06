// src/components/SessionTable.tsx
import { useState } from 'react';
import { Session } from './types';
import { UserIcon, ChevronDownIcon, MeetingIcon, ChatIcon, RescheduleIcon } from '../../assets/icons';

interface SessionTableProps {
  sessions: Session[];
  type: 'upcoming' | 'passed';
}

const SessionTable: React.FC<SessionTableProps> = ({ sessions, type }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (sessionId: string) => {
    if (activeDropdown === sessionId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(sessionId);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {type} sessions to display.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-2 rounded-lg ">
      {sessions.map((session) => (
        <div 
          key={session.id} 
          className="grid grid-cols-4 gap-4 px-4 py-3 shadow-md rounded-lg hover:bg-gray-50 items-center"
        >
          {/* Client Name & Image */}
          <div className="flex items-center space-x-3">
            <img 
              src={session.clientImage} 
              alt={session.clientName} 
              className="w-10 h-10 rounded-full"
            />
            <span className="font-medium">{session.clientName}</span>
          </div>
          
          {/* Date */}
          <div>{session.date}</div>
          
          {/* Time */}
          <div>
            {session.time} <span className="text-gray-500">{session.timeZone}</span>
          </div>
          
          {/* Type & Actions */}
          <div className="flex justify-between items-center">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm">
              {session.type}
            </span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button 
                  className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-900 border-gray-400"
                  onClick={() => toggleDropdown(session.id)}
                >
                  <span>Action</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                
                {/* Action Dropdown */}
                {activeDropdown === session.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {type === 'upcoming' ? (
                      <>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50">
                          <MeetingIcon className="w-4 h-4 mr-2" />
                          <span>Start Meeting</span>
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50">
                          <ChatIcon className="w-4 h-4 mr-2" />
                          <span>Chat</span>
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50">
                          <RescheduleIcon className="w-4 h-4 mr-2" />
                          <span>Reschedule</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50">
                          <ChatIcon className="w-4 h-4 mr-2" />
                          <span>View Notes</span>
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50">
                          <RescheduleIcon className="w-4 h-4 mr-2" />
                          <span>Schedule Again</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                <UserIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionTable;