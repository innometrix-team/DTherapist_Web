import { Input } from "@mui/material";
import { ArrowLeft, Send } from "lucide-react";
import { MouseEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChatMessage,
  DUMMY_GROUPS,
  DUMMY_MESSAGES,
} from "../../pages/danonymous/types";
import { formatMessageTime, groupMessagesByDate } from "../../utils/Date.utils";

const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex justify-center items-center mb-4">
    <div className="bg-white rounded-full shadow-[inset_0px_0px_30px_0px_#FFFFFF33] backdrop-blur-[25px] px-4 py-1">
      <p className="text-gray-500 text-xs">{date}</p>
    </div>
  </div>
);

export default function DAnonymousChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(DUMMY_MESSAGES);
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const group = useMemo(
    () => DUMMY_GROUPS.find((g) => g.id === groupId),
    [groupId]
  );

  const messageGroups = useMemo(
    () => groupMessagesByDate(messages ?? []),
    [messages]
  );

  const handleBackToGroups = () => {
    navigate(-1);
  };

  const handleSendMessage = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMessage("");
  };

  if (!group) {
    navigate("/anonymous");
    return null;
  }

  return (
    <>
      <div className="border-b border-gray-200 relative">
        <img
          src={group.banner}
          className="object-cover h-full w-full object-center absolute top-0 bottom-0 left-0 right-0"
        />

        <div className="flex items-center bg-black/75 relative flex-1 p-4">
          <button
            onClick={handleBackToGroups}
            className="p-2 text-white hover:text-gray-700 md:hidden -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0 mr-2">
            <img
              src={group.avatar}
              className="h-full w-full object-fit-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-lg">{group.name}</h2>
            <p className="text-xs text-[#C2C2C2] mb-1 font-medium">
              {group.category}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-offwhite">
        {messageGroups.map((group) => (
          <div key={`group-${group.date}`}>
            <DateSeparator date={group.date} />
            <div className="space-y-4">
              {group.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.isOwn ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${
                      msg.isOwn
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md shadow-sm"
                    }`}
                  >
                    {!msg.isOwn && (
                      <div
                        className={`text-xs font-medium mb-1 ${
                          msg.role === "user"
                            ? "text-success-700"
                            : "text-primary"
                        }`}
                      >
                        {msg.name}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed break-words ">
                      {msg.content}
                    </p>
                    <div
                      className={`text-xs mt-2 ${
                        msg.isOwn ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {formatMessageTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#F7FAFF] p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 ">
          <Input
            multiline
            maxRows={3}
            fullWidth
            disableUnderline
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-base lg:text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-full h-full text-black rotate-45" />
          </button>
        </div>
      </div>
    </>
  );
}
