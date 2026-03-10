import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Reply, X, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  GetGroupMessagesApi,
  SendGroupMessageApi,
  JoinGroupApi,
  GetGroupsApi,
  IMessage,
  ReportGroupMessageApi,
  BlockUserApi,
  UnblockUserApi,
  DeleteOwnMessageApi,
} from "../../api/Groups.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { QUERY_KEYS } from "../../configs/queryKeys.config";
import { formatMessageTime, groupMessagesByDate } from "../../utils/Date.utils";
import ReportMessageModal from "../anonymous/Reportmessagemodal";

const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex justify-center items-center mb-4">
    <div className="bg-white rounded-full shadow-[inset_0px_0px_30px_0px_#FFFFFF33] backdrop-blur-[25px] px-4 py-1">
      <p className="text-gray-500 text-xs">{date}</p>
    </div>
  </div>
);

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function DAnonymousChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get current user ID from auth store
  const currentUserId = useAuthStore((state) => state.id);

  const [joined, setJoined] = useState(false);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [messageToReport, setMessageToReport] = useState<IMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const joinAbortRef = useRef<AbortController | null>(null);
  const { mutateAsync: joinGroup, isPending: isJoining } = useMutation({
    mutationFn: (data: { groupId: string }) => {
      const controller = new AbortController();
      joinAbortRef.current = controller;
      return JoinGroupApi(data.groupId, { signal: controller.signal });
    },
    onSuccess: () => setJoined(true),
    onError: (error) => {
      toast.error(error?.message || "Failed to join group");
      navigate("/anonymous");
    },
  });

  useEffect(() => {
    if (groupId) {
      joinGroup({ groupId });
    }
    return () => joinAbortRef.current?.abort();
  }, [groupId, joinGroup]);

  const { data: groupsData } = useQuery({
    queryKey: [QUERY_KEYS.groups.list],
    queryFn: () => GetGroupsApi(),
  });

  const group = useMemo(() => {
    const list = groupsData?.data || [];
    return list.find((g) => g._id === groupId || g._id === groupId);
  }, [groupsData, groupId]);

  const {
    data: messagesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: QUERY_KEYS.groups.messages(groupId!),
    queryFn: () => GetGroupMessagesApi({ groupId: groupId! }),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: !!groupId && joined,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    mode: "onChange",
  });

  const contentValue = watch("content");

  const mutation = useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId: string | null }) => {
      const controller = new AbortController();
      const promise = SendGroupMessageApi(
        {
          groupId: groupId!,
          content,
          replyTo: replyToId,
        },
        { signal: controller.signal }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (promise as any).abort = () => controller.abort();
      return promise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.groups.messages(groupId!),
      });
      reset();
      setReplyingTo(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const messageGroups = useMemo(
    () => groupMessagesByDate(messagesData?.data || []),
    [messagesData]
  );

  const onSubmit = (data: MessageFormData) => {
    mutation.mutate({ 
      content: data.content, 
      replyToId: replyingTo?._id || null 
    });
  };

  // Report message mutation
  const reportMutation = useMutation({
    mutationFn: ({ groupId, _id, reason, description }: { groupId: string; _id: string; reason: string; description: string }) => {
      const controller = new AbortController();
      return ReportGroupMessageApi(
        { groupId, _id, reason, description },
        { signal: controller.signal }
      );
    },
    onSuccess: () => {
      toast.success("Message reported successfully");
      setOpenMenuId(null);
      setReportModalOpen(false);
      setMessageToReport(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to report message");
    },
  });

  // Block user mutation
  const blockMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      const controller = new AbortController();
      return BlockUserApi(
        { userId },
        { signal: controller.signal }
      );
    },
    onSuccess: () => {
      toast.success("User blocked successfully");
      setOpenMenuId(null);
      // Optionally refresh messages to remove blocked user's messages
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.groups.messages(groupId!),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to block user");
    },
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      const controller = new AbortController();
      return UnblockUserApi(
        { userId },
        { signal: controller.signal }
      );
    },
    onSuccess: () => {
      toast.success("User unblocked successfully");
      setOpenMenuId(null);
      // Optionally refresh messages
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.groups.messages(groupId!),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unblock user");
    },
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: ({ groupId, _id }: { groupId: string; _id: string }) => {
      const controller = new AbortController();
      return DeleteOwnMessageApi(
        { groupId, _id },
        { signal: controller.signal }
      );
    },
    onSuccess: () => {
      toast.success("Message deleted successfully");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.groups.messages(groupId!),
      });
      setOpenMenuId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete message");
    },
  });

  const handleReply = (message: IMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleOpenReportModal = (message: IMessage) => {
    setMessageToReport(message);
    setReportModalOpen(true);
    setOpenMenuId(null);
  };

  const handleReportSubmit = (data: { reason: string; description: string }) => {
    if (messageToReport && groupId) {
      reportMutation.mutate({
        groupId,
        _id: messageToReport._id,
        reason: data.reason,
        description: data.description,
      });
    }
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-flash');
      setTimeout(() => element.classList.remove('highlight-flash'), 2000);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && !target.closest('.message-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (!groupId) {
    navigate("/anonymous");
    return null;
  }

  if (isJoining || !joined) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Joining group...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading messages...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Error loading messages. Please try again later.</p>
      </div>
    );
  }

  if (!group) {
    navigate("/anonymous");
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes highlight {
            0% { background-color: rgba(59, 130, 246, 0.2); }
            100% { background-color: transparent; }
          }
          
          .highlight-flash {
            animation: highlight 2s ease-out;
          }
        `}
      </style>

      <div className="border-b border-gray-200 relative">
        <img
          src={group?.image}
          className="object-cover h-full w-full object-center absolute top-0 bottom-0 left-0 right-0"
        />

        <div className="flex items-center bg-black/75 relative flex-1 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-white hover:text-gray-700 md:hidden -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0 mr-2">
            <img
              src={group?.image}
              className="h-full w-full object-fit-cover rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-lg">{group.name}</h2>
            <p className="text-xs text-[#C2C2C2] mb-1 font-medium">
              {group.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-offwhite">
        {messageGroups.map((group) => (
          <div key={`group-${group.date}`}>
            <DateSeparator date={group.date} />
            <div className="space-y-4">
              {group.messages.map((msg, index) => {
                // Check if this message is from the current user by comparing userId
                const isOwnMessage = msg.userId === currentUserId;
                
                const repliedMessage = msg.replyTo;

                return (
                  <div
                    key={msg._id || msg.createdAt + index}
                    id={`message-${msg._id}`}
                    className={`flex relative group ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${
                        isOwnMessage
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {/* Alias - only show for other people's messages */}
                      {!isOwnMessage && (
                        <div className="text-xs font-medium mb-1 text-primary">
                          {msg.alias || "Anonymous"}
                        </div>
                      )}

                      {/* Reply Preview - Shows what message this is replying to */}
                      {repliedMessage && (
                        <div
                          onClick={() => scrollToMessage(repliedMessage._id)}
                          className={`mb-2 p-2 rounded-lg border-l-4 cursor-pointer ${
                            isOwnMessage
                              ? "bg-blue-600/30 border-blue-300"
                              : "bg-gray-100 border-gray-400"
                          }`}
                        >
                          <div className={`text-xs font-semibold mb-1 flex items-center gap-1 ${
                            isOwnMessage ? "text-blue-100" : "text-gray-700"
                          }`}>
                            <Reply size={12} />
                            {repliedMessage.alias || "Anonymous"}
                          </div>
                          <div className={`text-xs line-clamp-2 ${
                            isOwnMessage ? "text-blue-50" : "text-gray-600"
                          }`}>
                            {repliedMessage.content}
                          </div>
                        </div>
                      )}

                      {/* Message Content */}
                      <p className="text-sm leading-relaxed break-words">
                        {msg.content}
                      </p>

                      {/* Time, 3-dot Menu and Reply Button */}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div
                          className={`text-xs ${
                            isOwnMessage ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {/* 3-dot Menu Button */}
                          <div className="relative message-menu">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === msg._id ? null : msg._id);
                              }}
                              className={`p-1 rounded opacity-100 transition-opacity ${
                                isOwnMessage
                                  ? "hover:bg-primary text-blue-100"
                                  : "hover:bg-gray-100 text-gray-500"
                              }`}
                              title="Message options"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === msg._id && (
                              <div className={`absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-max ${
                                isOwnMessage ? "mr-0" : "ml-0"
                              }`}>
                                {/* Report Message Option - visible for all messages */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenReportModal(msg);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg disabled:opacity-50"
                                >
                                  Report Message
                                </button>

                                {/* Block User Option - only show for other people's messages */}
                                {!isOwnMessage && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      blockMutation.mutate({ userId: msg.userId });
                                    }}
                                    disabled={blockMutation.isPending}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    Block User
                                  </button>
                                )}

                                {/* Unblock User Option - only show for other people's messages */}
                                {!isOwnMessage && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      unblockMutation.mutate({ userId: msg.userId });
                                    }}
                                    disabled={unblockMutation.isPending}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    Unblock User
                                  </button>
                                )}

                                {/* Delete Message Option - only show for own messages */}
                                {isOwnMessage && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMutation.mutate({ groupId: groupId!, _id: msg._id });
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg disabled:opacity-50"
                                  >
                                    Delete Message
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Reply Button */}
                          <button
                            onClick={() => handleReply(msg)}
                            className={`p-1 rounded opacity-100 transition-opacity ${
                              isOwnMessage
                                ? "hover:bg-primary text-blue-100"
                                : "hover:bg-gray-100 text-gray-500"
                            }`}
                            title="Reply to message"
                          >
                            <Reply size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar - Shows when you're composing a reply */}
      {replyingTo && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Reply size={16} className="text-primary flex-shrink-0" />
              <div className="text-sm min-w-0 flex-1">
                <span className="font-medium text-darkerb block">
                  Replying to {replyingTo.alias || "Anonymous"}
                </span>
                <div className="text-primary truncate">
                  {replyingTo.content}
                </div>
              </div>
            </div>
            <button
              onClick={cancelReply}
              className="text-primary hover:text-darkerb flex-shrink-0 ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#F7FAFF] p-4 border-t border-gray-200">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center space-x-3"
        >
          <Input
            multiline
            maxRows={3}
            fullWidth
            disableUnderline
            {...register("content")}
            placeholder={
              replyingTo 
                ? `Reply to ${replyingTo.alias || "Anonymous"}...` 
                : "Type a message"
            }
            className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-base lg:text-sm"
            error={!!errors.content}
          />
          <button
            type="submit"
            disabled={isSubmitting || !contentValue?.trim()}
            className="w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-full h-full text-black rotate-45" />
          </button>
        </form>
      </div>

      {/* Report Message Modal */}
      <ReportMessageModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setMessageToReport(null);
        }}
        onSubmit={handleReportSubmit}
        isLoading={reportMutation.isPending}
        messagePreview={messageToReport?.content}
      />
    </>
  );
}