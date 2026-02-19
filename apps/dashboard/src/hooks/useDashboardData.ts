import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth/useAuthStore";
import DashboardApi, { IDashboardData } from "../api/Dashboard.api";

export const DASHBOARD_QUERY_KEY = (userType: string) => ["dashboard", userType];

/**
 * Single source of truth for all dashboard data.
 * Both BalanceCard and StatsGrid should call this hook —
 * React Query deduplicates the network request automatically.
 */
export function useDashboardData() {
  const { role } = useAuthStore();
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const userType = role === "counselor" ? "service-provider" : "user";
  const queryKey = DASHBOARD_QUERY_KEY(userType);

  const query = useQuery<IDashboardData>({
    queryKey,
    queryFn: async () => {
      // Abort any in-flight request before starting a new one
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await DashboardApi(userType, { signal: controller.signal });

      if (!response?.data) {
        throw new Error("No dashboard data received");
      }

      return response.data;
    },
    staleTime: 60 * 1000,          // treat data as fresh for 60s
    gcTime: 5 * 60 * 1000,         // keep in cache for 5 min after unmount
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
  });

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /** Call this after a mutation (top-up, withdrawal, booking) to force a refresh */
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  return { ...query, userType, invalidate };
}