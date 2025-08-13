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
    setActiveDropdown(null);
    
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

  const navigateToProfile = (session: Session) => {
    navigate(`/appointments/client-details/${session.id}`, { 
      state: { 
        sessionData: session 
      } 
    });
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base">
          No {type} sessions to display.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 lg:px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={session.clientImage} 
                      alt={session.clientName} 
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex-shrink-0"
                    />
                    <span className="font-medium text-sm lg:text-base text-gray-900">
                      {session.clientName}
                    </span>
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm lg:text-base whitespace-nowrap text-gray-700">
                  {session.date}
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm lg:text-base whitespace-nowrap text-gray-700">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2">
                    <span>{session.time}</span>
                    <span className="text-xs lg:text-sm text-gray-500">{session.timeZone}</span>
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4">
                  <span className="px-2 lg:px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs lg:text-sm whitespace-nowrap font-medium">
                    {session.type}
                  </span>
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button 
                        className="flex items-center space-x-1 px-2 lg:px-3 py-1 text-gray-600 hover:text-gray-900 rounded transition-colors"
                        onClick={() => toggleDropdown(session.id)}
                      >
                        <span className="text-xs lg:text-sm">Actions</span>
                        <ChevronDownIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      
                      {activeDropdown === session.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                          {type === 'upcoming' ? (
                            <>
                              <button 
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                                onClick={() => handleActionClick('startMeeting', session.id)}
                              >
                                <MeetingIcon className="w-4 h-4 mr-2" />
                                <span>Start Meeting</span>
                              </button>
                              <button 
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                                onClick={() => handleActionClick('chat', session.id)}
                              >
                                <ChatIcon className="w-4 h-4 mr-2" />
                                <span>Chat</span>
                              </button>
                              <button 
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                                onClick={() => handleActionClick('reschedule', session.id)}
                              >
                                <RescheduleIcon className="w-4 h-4 mr-2" />
                                <span>Reschedule</span>
                              </button>
                            </>
                          ) : (
                            <button 
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                              onClick={() => handleActionClick('scheduleAgain', session.id)}
                            >
                              <RescheduleIcon className="w-4 h-4 mr-2" />
                              <span>Schedule Again</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      onClick={() => navigateToProfile(session)}
                    >
                      <UserIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            {/* Header with client info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img 
                  src={session.clientImage} 
                  alt={session.clientName} 
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {session.clientName}
                  </h3>
                  <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-primary text-xs font-medium mt-1">
                    {session.type}
                  </span>
                </div>
              </div>
              <button 
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                onClick={() => navigateToProfile(session)}
              >
                <UserIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Session details */}
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Date</span>
                <span className="text-gray-900 font-medium">{session.date}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Time</span>
                <div>
                  <span className="text-gray-900 font-medium block">{session.time}</span>
                  <span className="text-gray-500 text-xs">{session.timeZone}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="border-t border-gray-100 pt-3">
              {type === 'upcoming' ? (
                <div className="flex flex-wrap gap-2">
                  <button 
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick('startMeeting', session.id)}
                  >
                    <MeetingIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Meeting</span>
                  </button>
                  <button 
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick('chat', session.id)}
                  >
                    <ChatIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Chat</span>
                  </button>
                  <button 
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick('reschedule', session.id)}
                  >
                    <RescheduleIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Reschedule</span>
                  </button>
                </div>
              ) : (
                <button 
                  className="flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors"
                  onClick={() => handleActionClick('scheduleAgain', session.id)}
                >
                  <RescheduleIcon className="w-4 h-4 mr-2" />
                  Schedule Again
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default SessionTable;