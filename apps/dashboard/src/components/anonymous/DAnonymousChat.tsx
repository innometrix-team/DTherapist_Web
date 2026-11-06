import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Reply, X, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import {
  GetGroupMessagesApi,
  SendGroupMessageApi,
  JoinGroupApi,
  GetGroupsApi,
  IMessage,
  ReportGroupMessageApi,
  BlockAuthorApi,
  GetGroupBlocksApi,
  UnblockAuthorApi,
  DeleteOwnMessageApi,
} from "../../api/Groups.api";
import type { IAPIResult } from "../../api/Api";
import socketService from "../../services/SocketService";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { QUERY_KEYS } from "../../configs/queryKeys.config";
import { formatMessageTime, groupMessagesByDate } from "../../utils/Date.utils";
import ReportMessageModal from "../anonymous/Reportmessagemodal";
import { useScreenCaptureMonitor } from "../../hooks/useScreenCaptureMonitor";

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

const decodeJwtUserId = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
    const directId = parsed.id || parsed._id || parsed.userId || parsed.sub;
    if (typeof directId === "string" && directId) return directId;
    if (parsed.user && typeof parsed.user === "object") {
      const u = parsed.user as Record<string, unknown>;
      const nestedId = u.id || u._id;
      if (typeof nestedId === "string" && nestedId) return nestedId;
    }
    return null;
  } catch {
    return null;
  }
};

const extractMsgUserId = (msg: unknown): string => {
  if (!msg || typeof msg !== "object") return "";
  const record = msg as Record<string, unknown>;
  const rawId = record.userId ?? record.senderId ?? record.authorId;
  if (typeof rawId === "string") return rawId;
  if (rawId && typeof rawId === "object") {
    const obj = rawId as Record<string, unknown>;
    if (typeof obj._id === "string") return obj._id;
    if (typeof obj.id === "string") return obj.id;
  }
  if (record.user && typeof record.user === "object") {
    const obj = record.user as Record<string, unknown>;
    if (typeof obj._id === "string") return obj._id;
    if (typeof obj.id === "string") return obj.id;
  }
  return "";
};

const getStoredSentMessageIds = (gId: string): Set<string> => {
  try {
    const raw = sessionStorage.getItem(`danon_sent_msgs_${gId}`);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((item): item is string => typeof item === "string"));
      }
    }
  } catch {
    // Ignore storage errors
  }
  return new Set();
};

const storeSentMessageId = (gId: string, msgId: string) => {
  try {
    const existing = getStoredSentMessageIds(gId);
    existing.add(msgId);
    sessionStorage.setItem(`danon_sent_msgs_${gId}`, JSON.stringify(Array.from(existing)));
  } catch {
    // Ignore storage errors
  }
};

const getStoredGroupAlias = (gId: string): string | null => {
  try {
    return sessionStorage.getItem(`danon_alias_${gId}`);
  } catch {
    return null;
  }
};

const storeGroupAlias = (gId: string, alias: string) => {
  try {
    sessionStorage.setItem(`danon_alias_${gId}`, alias);
  } catch {
    // Ignore storage errors
  }
};

export default function DAnonymousChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get current user ID and token from auth store
  const currentUserId = useAuthStore((state) => state.id);
  const token = useAuthStore((state) => state.token);
  const [capturedUserId, setCapturedUserId] = useState<string | null>(null);

  useScreenCaptureMonitor(groupId ? `group:${groupId}` : null);

  const decodedTokenId = useMemo(() => decodeJwtUserId(token), [token]);

  useEffect(() => {
    if (!currentUserId && decodedTokenId) {
      useAuthStore.setState({ id: decodedTokenId });
    }
  }, [currentUserId, decodedTokenId]);

  const effectiveUserId = currentUserId || decodedTokenId || capturedUserId;

  const [sentMsgIds, setSentMsgIds] = useState<Set<string>>(() =>
    groupId ? getStoredSentMessageIds(groupId) : new Set()
  );
  const [myGroupAlias, setMyGroupAlias] = useState<string | null>(() =>
    groupId ? getStoredGroupAlias(groupId) : null
  );

  useEffect(() => {
    if (groupId) {
      setSentMsgIds(getStoredSentMessageIds(groupId));
      setMyGroupAlias(getStoredGroupAlias(groupId));
    }
  }, [groupId]);

  const checkIsOwnMessage = useCallback(
    (msg: IMessage): boolean => {
      if (typeof msg.isOwnMessage === "boolean") return msg.isOwnMessage;
      if (msg._id && sentMsgIds.has(msg._id)) return true;
      const msgUid = extractMsgUserId(msg) || (typeof msg.userId === "string" ? msg.userId : "");
      if (effectiveUserId && msgUid && msgUid === effectiveUserId) {
        return true;
      }
      if (myGroupAlias && msg.alias && msg.alias === myGroupAlias) {
        return true;
      }
      return false;
    },
    [sentMsgIds, effectiveUserId, myGroupAlias]
  );

  const checkIsOwnMessageRef = useRef(checkIsOwnMessage);
  useEffect(() => {
    checkIsOwnMessageRef.current = checkIsOwnMessage;
  }, [checkIsOwnMessage]);

  const targetMessageId = searchParams.get("messageId") || searchParams.get("replyTo");
  const hasDeepLinkScrolledRef = useRef<string | null>(null);

  const [joined, setJoined] = useState<boolean>(() =>
    Boolean(groupId && sessionStorage.getItem(`danon_joined_${groupId}`) === "true")
  );
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [messageToReport, setMessageToReport] = useState<IMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection when token is available
  useEffect(() => {
    if (!token) return;
    if (!socketService.isSocketConnected()) {
      void socketService.connect(token).catch((err) => {
        console.warn("DAnonymous socket connection error:", err);
      });
    }
  }, [token]);

  // Join group room and listen for real-time WebSocket events
  useEffect(() => {
    if (!groupId || !joined) return;

    socketService.joinGroupRoom(groupId);

    const unsubscribeNew = socketService.onNewGroupMessage((incomingMsg: IMessage) => {
      // Ignore messages intended for other groups if groupId is specified on the message
      if (incomingMsg.groupId && incomingMsg.groupId !== groupId) {
        return;
      }

      queryClient.setQueryData<IAPIResult<IMessage[]> | null>(
        QUERY_KEYS.groups.messages(groupId),
        (old) => {
          if (!old || !Array.isArray(old.data)) return old;
          if (old.data.some((m) => m._id === incomingMsg._id)) return old;

          const isOwn = checkIsOwnMessageRef.current(incomingMsg);
          const normalizedMsg: IMessage = {
            ...incomingMsg,
            isOwnMessage: isOwn,
          };

          return {
            ...old,
            data: [...old.data, normalizedMsg],
          };
        }
      );
    });

    const unsubscribeDeleted = socketService.onGroupMessageDeleted((deletedData) => {
      if (deletedData.groupId && deletedData.groupId !== groupId) {
        return;
      }
      const targetId = deletedData.messageId || deletedData._id;
      if (!targetId) return;

      queryClient.setQueryData<IAPIResult<IMessage[]> | null>(
        QUERY_KEYS.groups.messages(groupId),
        (old) => {
          if (!old || !Array.isArray(old.data)) return old;
          return {
            ...old,
            data: old.data.filter((m) => m._id !== targetId),
          };
        }
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeDeleted();
      socketService.leaveGroupRoom(groupId);
    };
  }, [groupId, joined, queryClient]);

  const joinAbortRef = useRef<AbortController | null>(null);
  const { mutateAsync: joinGroup, isPending: isJoining } = useMutation({
    mutationFn: (data: { groupId: string }) => {
      const controller = new AbortController();
      joinAbortRef.current = controller;
      return JoinGroupApi(data.groupId, { signal: controller.signal });
    },
    onSuccess: () => {
      if (groupId) {
        sessionStorage.setItem(`danon_joined_${groupId}`, "true");
      }
      setJoined(true);
    },
    onError: (error) => {
      const msg = error?.message?.toLowerCase() || "";
      if (
        msg.includes("already") ||
        msg.includes("member") ||
        msg.includes("joined") ||
        (groupId && sessionStorage.getItem(`danon_joined_${groupId}`) === "true")
      ) {
        setJoined(true);
        return;
      }
      toast.error(error?.message || "Failed to join group");
      void navigate("/anonymous");
    },
  });

  useEffect(() => {
    if (groupId) {
      void joinGroup({ groupId });
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
    queryFn: async () => {
      const res = await GetGroupMessagesApi({ groupId: groupId! });
      if (res?.data && groupId) {
        sessionStorage.setItem(`danon_joined_${groupId}`, "true");
        setJoined(true);
      }
      return res;
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: !!groupId,
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
    mutationFn: ({
      content,
      replyToId,
      parentAuthorId,
    }: {
      content: string;
      replyToId: string | null;
      parentAuthorId?: string;
    }) => {
      const controller = new AbortController();
      const promise = SendGroupMessageApi(
        {
          groupId: groupId!,
          content,
          replyTo: replyToId,
          parentAuthorId,
        },
        { signal: controller.signal }
      );
      return Object.assign(promise, { abort: () => controller.abort() });
    },
    onSuccess: (response) => {
      if (response?.data && groupId) {
        const sentMsg = response.data;
        if (sentMsg._id) {
          storeSentMessageId(groupId, sentMsg._id);
          setSentMsgIds((prev) => new Set([...prev, sentMsg._id]));
        }
        if (sentMsg.alias) {
          storeGroupAlias(groupId, sentMsg.alias);
          setMyGroupAlias(sentMsg.alias);
        }
        if (sentMsg.userId) {
          setCapturedUserId(sentMsg.userId);
          if (!useAuthStore.getState().id) {
            useAuthStore.setState({ id: sentMsg.userId });
          }
        }

        queryClient.setQueryData<IAPIResult<IMessage[]> | null>(
          QUERY_KEYS.groups.messages(groupId),
          (old) => {
            if (!old || !Array.isArray(old.data)) return old;
            if (old.data.some((m) => m._id === sentMsg._id)) return old;
            const newMsg: IMessage = {
              _id: sentMsg._id,
              content: sentMsg.content,
              createdAt: sentMsg.createdAt,
              userId: sentMsg.userId,
              groupId: sentMsg.groupId,
              alias: sentMsg.alias,
              replyTo: replyingTo
                ? {
                    _id: replyingTo._id,
                    content: replyingTo.content,
                    alias: replyingTo.alias,
                  }
                : null,
              isOwnMessage: true,
            };
            return {
              ...old,
              data: [...old.data, newMsg],
            };
          }
        );
      }
      void queryClient.invalidateQueries({
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
    // Direct replies alert the parent message author (no self-notifications)
    const parentMsgUserId = replyingTo ? extractMsgUserId(replyingTo) || replyingTo.userId : undefined;
    const isSelfReply = parentMsgUserId && effectiveUserId && parentMsgUserId === effectiveUserId;
    const parentAuthorId = replyingTo && !isSelfReply ? parentMsgUserId : undefined;

    mutation.mutate({ 
      content: data.content, 
      replyToId: replyingTo?._id || null,
      parentAuthorId,
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

  const { data: blocksData } = useQuery({
    queryKey: ['group-blocks'],
    queryFn: () => GetGroupBlocksApi(),
  });
  const blockedList = useMemo(() => blocksData?.data || [], [blocksData?.data]);

  // Block author mutation
  const blockMutation = useMutation({
    mutationFn: ({ messageId }: { messageId: string }) => {
      const controller = new AbortController();
      return BlockAuthorApi(messageId, { signal: controller.signal });
    },
    onSuccess: () => {
      toast.success("Author blocked successfully");
      setOpenMenuId(null);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.groups.messages(groupId!),
      });
      void queryClient.invalidateQueries({
        queryKey: ['group-blocks'],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to block author");
    },
  });

  // Unblock author mutation
  const unblockMutation = useMutation({
    mutationFn: ({ blockId }: { blockId: string }) => {
      const controller = new AbortController();
      return UnblockAuthorApi(blockId, { signal: controller.signal });
    },
    onSuccess: () => {
      toast.success("Author unblocked successfully");
      setOpenMenuId(null);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.groups.messages(groupId!),
      });
      void queryClient.invalidateQueries({
        queryKey: ['group-blocks'],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unblock author");
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
    onSuccess: (_, variables) => {
      toast.success("Message deleted successfully");
      if (groupId) {
        try {
          const stored = getStoredSentMessageIds(groupId);
          stored.delete(variables._id);
          sessionStorage.setItem(`danon_sent_msgs_${groupId}`, JSON.stringify(Array.from(stored)));
        } catch {
          // ignore
        }
        setSentMsgIds((prev) => {
          const next = new Set(prev);
          next.delete(variables._id);
          return next;
        });
        queryClient.setQueryData<IAPIResult<IMessage[]> | null>(
          QUERY_KEYS.groups.messages(groupId),
          (old) => {
            if (!old || !Array.isArray(old.data)) return old;
            return {
              ...old,
              data: old.data.filter((m) => m._id !== variables._id),
            };
          }
        );
      }
      void queryClient.invalidateQueries({
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

  // Deep-link to the exact thread when clicked
  useEffect(() => {
    if (!targetMessageId || !messagesData?.data?.length) return;
    if (hasDeepLinkScrolledRef.current === targetMessageId) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`message-${targetMessageId}`);
      if (element) {
        scrollToMessage(targetMessageId);
        hasDeepLinkScrolledRef.current = targetMessageId;
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [targetMessageId, messagesData]);

  // General auto-scroll to bottom on new messages (suppressed if focusing a deep-linked message)
  useEffect(() => {
    if (targetMessageId && hasDeepLinkScrolledRef.current !== targetMessageId) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData, targetMessageId]);

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
    void navigate("/anonymous");
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
    void navigate("/anonymous");
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

      <div className="border-b border-gray-200 relative overflow-hidden">
        {group?.image ? (
          <img
            src={group.image}
            alt=""
            aria-hidden="true"
            className="object-cover h-full w-full object-center absolute top-0 bottom-0 left-0 right-0"
          />
        ) : (
          <div className="h-full w-full absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900 to-indigo-950" />
        )}

        <div className="flex items-center bg-black/75 relative flex-1 p-4">
          <button
            type="button"
            onClick={() => {
              void navigate(-1);
            }}
            aria-label="Back to groups"
            className="p-2 text-white hover:text-gray-300 md:hidden -ml-2 focus:outline-none focus:ring-2 focus:ring-white rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0 mr-2 overflow-hidden">
            {group?.image ? (
              <img
                src={group.image}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-lg font-bold text-white">
                {group?.name?.charAt(0).toUpperCase() || "G"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-lg">{group.name}</h2>
            <p className="text-xs text-neutral mb-1 font-medium">
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
                // Check if this message is from the current user
                const isOwnMessage = checkIsOwnMessage(msg);
                const matchingBlock = msg.alias ? blockedList.find((b) => b.alias === msg.alias) : undefined;
                
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
                          role="button"
                          tabIndex={0}
                          onClick={() => scrollToMessage(repliedMessage._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              scrollToMessage(repliedMessage._id);
                            }
                          }}
                          aria-label={`Jump to replied message from ${repliedMessage.alias || "Anonymous"}`}
                          className={`mb-2 p-2 rounded-lg border-l-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${
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
                              type="button"
                              aria-haspopup="true"
                              aria-expanded={openMenuId === msg._id}
                              aria-label="Message options"
                              className={`p-1 rounded opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-primary ${
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
                              <div role="menu" aria-label="Message actions" className={`absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-max ${
                                isOwnMessage ? "mr-0" : "ml-0"
                              }`}>

                                {/* Report Message Option - visible for all messages */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenReportModal(msg);
                                  }}
                                  type="button" role="menuitem" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg disabled:opacity-50 focus:bg-gray-100 focus:outline-none"
                                >
                                  Report Message
                                </button>

                                {/* Block Author Option - only show for other authors when not currently blocked */}
                                {!isOwnMessage && !matchingBlock && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      blockMutation.mutate({ messageId: msg._id });
                                    }}
                                    disabled={blockMutation.isPending}
                                    type="button" role="menuitem" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 focus:bg-gray-100 focus:outline-none"
                                  >
                                    Block Author
                                  </button>
                                )}

                                {/* Unblock Author Option - only show for other authors when currently blocked */}
                                {!isOwnMessage && matchingBlock && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      unblockMutation.mutate({ blockId: matchingBlock.blockId });
                                    }}
                                    disabled={unblockMutation.isPending}
                                    type="button" role="menuitem" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 focus:bg-gray-100 focus:outline-none"
                                  >
                                    Unblock Author
                                  </button>
                                )}

                                {/* Delete Message Option - only show for own messages */}
                                {isOwnMessage && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMutation.mutate({ groupId: groupId, _id: msg._id });
                                    }}
                                    disabled={deleteMutation.isPending}
                                    type="button" role="menuitem" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg disabled:opacity-50 focus:bg-red-50 focus:outline-none"
                                  >
                                    Delete Message
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Reply Button */}
                          <button
                            type="button"
                            onClick={() => handleReply(msg)}
                            aria-label={`Reply to message from ${msg.alias || (isOwnMessage ? "yourself" : "Anonymous")}`}
                            className={`p-1 rounded opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-primary ${
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
              type="button"
              onClick={cancelReply}
              aria-label="Cancel reply"
              className="text-primary hover:text-darkerb flex-shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-primary rounded p-0.5"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-offwhite p-4 border-t border-gray-200">
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="flex items-center space-x-3"
        >
          <textarea
            rows={1}
            {...register("content")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(onSubmit)(e);
              }
            }}
            placeholder={
              replyingTo 
                ? `Reply to ${replyingTo.alias || "Anonymous"}...` 
                : "Type a message"
            }
            aria-label={replyingTo ? `Reply to ${replyingTo.alias || "Anonymous"}` : "Group message"}
            className={`flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-base lg:text-sm resize-none ${
              errors.content ? "text-red-500" : ""
            }`}
          />
          <button
            type="submit"
            disabled={isSubmitting || !contentValue?.trim()}
            aria-label="Send message"
            className="w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary"
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