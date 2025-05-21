import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from './types';
import { UserIcon, ChevronDownIcon, MeetingIcon, ChatIcon, RescheduleIcon } from '../../assets/icons';

interface SessionTableProps {
  sessions: Session[];
  type: 'upcoming' | 'passed';
  onReschedule?: (sessionId: string) => void;
  onScheduleAgain?: (sessionId: string) => void;
}

const SessionTable: React.FC<SessionTableProps> = ({ 
  sessions, 
  type, 
  onReschedule, 
  onScheduleAgain 
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleDropdown = (sessionId: string) => {
    if (activeDropdown === sessionId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(sessionId);
    }
  };

  const handleActionClick = (action: string, sessionId: string) => {
    setActiveDropdown(null); // Close dropdown after action
    
    switch(action) {
      case 'startMeeting':
        navigate(`/meeting/${sessionId}`);
        break;
      case 'chat':
        navigate(`/chat/${sessionId}`);
        break;
      case 'reschedule':
        if (onReschedule) {
          onReschedule(sessionId);
        }
        break;
      case 'viewNotes':
        navigate(`/session-notes/${sessionId}`);
        break;
      case 'scheduleAgain':
        if (onScheduleAgain) {
          onScheduleAgain(sessionId);
        }
        break;
      default:
        break;
    }
  };

  const navigateToProfile = (clientId: string) => {
    navigate(`/profile/${clientId}`);
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {type} sessions to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-sm font-medium text-gray-700 rounded-lg shadow-md">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Names
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 rounded-lg shadow-md">
          {sessions.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                  <img 
                    src={session.clientImage} 
                    alt={session.clientName} 
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium text-sm md:text-base">{session.clientName}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {session.date}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {session.time} <span className="text-gray-500 hidden md:inline">{session.timeZone}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                  {session.type}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button 
                      className="flex items-center space-x-1 px-2 py-1 text-xs md:text-sm text-gray-600 hover:text-gray-900 border-gray-400"
                      onClick={() => toggleDropdown(session.id)}
                    >
                      <span className="hidden md:inline">Action</span>
                      <span className="md:hidden">⋯</span>
                      <ChevronDownIcon className="w-4 h-4 hidden md:block" />
                    </button>
                    
                    {/* Action Dropdown */}
                    {activeDropdown === session.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        {type === 'upcoming' ? (
                          <>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50"
                              onClick={() => handleActionClick('startMeeting', session.id)}
                            >
                              <MeetingIcon className="w-4 h-4 mr-2" />
                              <span>Start Meeting</span>
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50"
                              onClick={() => handleActionClick('chat', session.id)}
                            >
                              <ChatIcon className="w-4 h-4 mr-2" />
                              <span>Chat</span>
                            </button>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50"
                              onClick={() => handleActionClick('reschedule', session.id)}
                            >
                              <RescheduleIcon className="w-4 h-4 mr-2" />
                              <span>Reschedule</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50"
                              onClick={() => handleActionClick('scheduleAgain', session.id)}
                            >
                              <RescheduleIcon className="w-4 h-4 mr-2" />
                              <span>Schedule Again</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    onClick={() => navigateToProfile(session.id)}
                  >
                    <UserIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SessionTable;