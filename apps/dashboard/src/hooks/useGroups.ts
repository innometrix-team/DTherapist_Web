import { useQuery } from "@tanstack/react-query";
import {GetGroupsApi} from "../api/Groups.api"; // adjust path
import { QUERY_KEYS } from "../configs/queryKeys.config"; // adjust path

export function useGroups() {
  return useQuery({
    queryKey: [QUERY_KEYS.groups.list],
    queryFn: () => GetGroupsApi(),
    staleTime: 5 * 60 * 1000, 
  });
}