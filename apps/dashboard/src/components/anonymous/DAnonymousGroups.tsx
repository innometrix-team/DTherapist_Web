import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DAnonymousGroupsProps } from "../../pages/danonymous/types";
import { IGroup } from "../../api/Groups.api";
import { GetGroupMessagesApi } from "../../api/Groups.api";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

const DAnonymousGroups = ({ groups, onGroupSelect }: DAnonymousGroupsProps) => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  // Local storage helpers for last-read timestamps per group
  const storageKey = "danonymous_last_read";

  const getLastReadMap = (): Record<string, number> => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
      return {};
    }
  };

  const setLastReadAt = useCallback((gid: string, timestampMs: number) => {
    const map = getLastReadMap();
    map[gid] = timestampMs;
    localStorage.setItem(storageKey, JSON.stringify(map));
  }, []);

  const getLastReadAt = (gid: string): number => {
    const map = getLastReadMap();
    return map[gid] ?? 0;
  };

  const handleGroupSelect = useCallback(
    (group: IGroup) => {
      // Mark as read at open time so unread clears immediately
      setLastReadAt(group._id, Date.now());
      onGroupSelect();
      navigate(`/anonymous/${group._id}`);
    },
    [navigate, onGroupSelect, setLastReadAt]
  );

  const GroupMessageCount = ({ groupId }: { groupId: string }) => {
    const params = useParams<{ groupId: string }>();
    const { data } = useQuery({
      queryKey: QUERY_KEYS.groups.messages(groupId),
      queryFn: () => GetGroupMessagesApi({ groupId }),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      enabled: !!groupId,
    });

    const lastReadAt = useMemo(() => getLastReadAt(groupId), [groupId]);

    const messages = useMemo(() => data?.data ?? [], [data?.data]);
    const unreadCount = useMemo(() => {
      if (!messages.length) return 0;
      return messages.filter((m) => {
        const created = new Date(m.createdAt).getTime();
        return created > lastReadAt;
      }).length;
    }, [messages, lastReadAt]);

    // If this group is the currently open group, mark latest as read to clear badge
    useEffect(() => {
      if (params.groupId === groupId && messages.length) {
        const latestTs = Math.max(
          ...messages.map((m) => new Date(m.createdAt).getTime())
        );
        if (latestTs > getLastReadAt(groupId)) {
          setLastReadAt(groupId, latestTs);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.groupId, groupId, messages.length]);

    return (
      unreadCount > 0 ? (
        <span className="ml-2 inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          {unreadCount}
        </span>
      ) : null
    );
  };

  return (
    <div className="overflow-y-scroll pb-5 h-[calc(100%-130px)]  md:h-[calc(100%-80px)]">
      {groups.map((group) => (
        <div
          key={group._id}
          onClick={() => handleGroupSelect(group)}
          className={`p-4 border-b-[0.5px] border-divider hover:bg-gray-50 cursor-pointer transition-colors ${
            groupId === group._id
              ? "bg-blue-50 border-l-4 border-l-primary"
              : ""
          } `}
          >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg flex-shrink-0">
              <img
                src={group.image}
                className="h-full w-full object-fit-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 truncate text-sm">
                  {group.name}
                </h3>
                <GroupMessageCount groupId={group._id} />
              </div>
              <p className="text-xs text-gray-500 mb-1 truncate font-medium">
                {group.description.substring(0, 30)}...
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DAnonymousGroups;
