import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DAnonymousGroupsProps } from "../../pages/danonymous/types";
import { IGroup, GetGroupMessagesApi } from "../../api/Groups.api";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

const storageKey = "danonymous_last_read";

const getLastReadMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
};

const getStoredLastReadAt = (gid: string): number => {
  const map = getLastReadMap();
  return map[gid] ?? 0;
};

const setStoredLastReadAt = (gid: string, timestampMs: number) => {
  const map = getLastReadMap();
  map[gid] = timestampMs;
  localStorage.setItem(storageKey, JSON.stringify(map));
};

interface GroupMessageCountProps {
  groupId: string;
  currentGroupId?: string;
  getLastReadAt: (gid: string) => number;
  setLastReadAt: (gid: string, ts: number) => void;
}

const GroupMessageCount = ({
  groupId,
  currentGroupId,
  getLastReadAt,
  setLastReadAt,
}: GroupMessageCountProps) => {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.groups.messages(groupId),
    queryFn: () => GetGroupMessagesApi({ groupId }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: Boolean(groupId),
  });

  const lastReadAt = useMemo(() => getLastReadAt(groupId), [groupId, getLastReadAt]);
  const messages = useMemo(() => data?.data ?? [], [data?.data]);
  const unreadCount = useMemo(() => {
    if (!messages.length) return 0;
    return messages.filter((m) => {
      const created = new Date(m.createdAt).getTime();
      return created > lastReadAt;
    }).length;
  }, [messages, lastReadAt]);

  useEffect(() => {
    if (currentGroupId === groupId && messages.length) {
      const latestTs = Math.max(
        ...messages.map((m) => new Date(m.createdAt).getTime())
      );
      if (latestTs > getLastReadAt(groupId)) {
        setLastReadAt(groupId, latestTs);
      }
    }
  }, [currentGroupId, groupId, messages, getLastReadAt, setLastReadAt]);

  if (unreadCount <= 0) return null;

  return (
    <span
      className="ml-2 inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700"
      aria-label={`${unreadCount} unread messages`}
    >
      {unreadCount}
    </span>
  );
};

const DAnonymousGroups = ({ groups, onGroupSelect }: DAnonymousGroupsProps) => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const handleGroupSelect = useCallback(
    (group: IGroup) => {
      setStoredLastReadAt(group._id, Date.now());
      onGroupSelect();
      void navigate(`/anonymous/${group._id}`);
    },
    [navigate, onGroupSelect]
  );

  return (
    <div
      role="list"
      aria-label="Discussion groups"
      className="overflow-y-scroll pb-5 h-[calc(100%-130px)] md:h-[calc(100%-80px)]"
    >
      {groups.map((group) => {
        const isSelected = groupId === group._id;
        return (
          <div
            key={group._id}
            role="listitem"
            className="border-b-[0.5px] border-divider"
          >
            <button
              type="button"
              onClick={() => handleGroupSelect(group)}
              aria-current={isSelected ? "true" : undefined}
              aria-label={`${group.name} group, ${group.description}`}
              className={`w-full text-left p-4 hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                isSelected ? "bg-blue-50 border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg flex-shrink-0 overflow-hidden">
                  {group.image ? (
                    <img
                      src={group.image}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="font-bold text-white text-base">
                      {group.name?.charAt(0).toUpperCase() || "G"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 truncate text-sm">
                      {group.name}
                    </h3>
                    <GroupMessageCount
                      groupId={group._id}
                      currentGroupId={groupId}
                      getLastReadAt={getStoredLastReadAt}
                      setLastReadAt={setStoredLastReadAt}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mb-1 truncate font-medium">
                    {group.description.substring(0, 30)}...
                  </p>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DAnonymousGroups;
