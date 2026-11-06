import { useMemo } from "react";
import { MessageCircle, Users } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { useGroups } from "../../hooks/useGroups";
import { GetGroupMessagesApi, type IGroup } from "../../api/Groups.api";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

interface DAnonymousContext {
  groups?: IGroup[];
  isLoading?: boolean;
}

export default function DAnonymousEmptyState() {
  const outletContext = useOutletContext<DAnonymousContext | null>();
  const { data: groupsData, isLoading: isGroupsLoading } = useGroups();

  const outletGroups = outletContext?.groups;
  const rawGroups = groupsData?.data;
  const groups = useMemo(
    () => outletGroups ?? rawGroups ?? [],
    [outletGroups, rawGroups]
  );
  const isLoading = outletContext?.isLoading ?? isGroupsLoading;

  // Check if groups already carry explicit message/conversation counts from API
  const explicitConversationsCount = useMemo(() => {
    return groups.reduce((acc, g) => {
      const gAny = g as unknown as Record<string, unknown>;
      const count =
        typeof gAny.conversationsCount === "number"
          ? gAny.conversationsCount
          : typeof gAny.messagesCount === "number"
          ? gAny.messagesCount
          : typeof gAny.totalMessages === "number"
          ? gAny.totalMessages
          : typeof gAny.conversations === "number"
          ? gAny.conversations
          : typeof gAny.messageCount === "number"
          ? gAny.messageCount
          : 0;
      return acc + count;
    }, 0);
  }, [groups]);

  // Fetch messages per group to calculate live dynamic conversation count.
  // TanStack Query automatically deduplicates cache with DAnonymousGroups,
  // preventing extra network overhead.
  const messageQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: QUERY_KEYS.groups.messages(g._id),
      queryFn: () => GetGroupMessagesApi({ groupId: g._id }),
      staleTime: 60_000,
      enabled: groups.length > 0 && explicitConversationsCount === 0,
    })),
  });

  const isMessagesLoading =
    groups.length > 0 &&
    explicitConversationsCount === 0 &&
    messageQueries.some((q) => q.isLoading);

  const totalConversations = useMemo(() => {
    if (explicitConversationsCount > 0) {
      return explicitConversationsCount;
    }
    return messageQueries.reduce((sum, q) => {
      return sum + (q.data?.data?.length || 0);
    }, 0);
  }, [explicitConversationsCount, messageQueries]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 bg-darkerb rounded-full mx-auto mb-6 flex items-center justify-center">
          <img src="/d-logo.png" alt="D-Logo" className="rounded-full" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">
          Welcome to DAnonymous
        </h2>
        <p className="text-gray-500 mb-6">
          Select a group to start participating in meaningful conversations with
          others on similar journeys anonymously.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            {isLoading ? (
              <span className="inline-block w-20 h-4 bg-gray-200 animate-pulse rounded" />
            ) : (
              <span>
                {groups.length}{" "}
                {groups.length === 1 ? "Active Group" : "Active Groups"}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            {isLoading || isMessagesLoading ? (
              <span className="inline-block w-24 h-4 bg-gray-200 animate-pulse rounded" />
            ) : (
              <span>
                {totalConversations}{" "}
                {totalConversations === 1 ? "conversation" : "conversations"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
