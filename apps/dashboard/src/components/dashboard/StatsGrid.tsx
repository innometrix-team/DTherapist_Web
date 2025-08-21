import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimerIcon, UptrendIcon } from "../../assets/icons";
import { StatCardConfig } from "../../pages/dashboard/types";
import DashboardApi from "../../api/Dashboard.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

interface StatsGridProps {
  stats?: StatCardConfig[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats: propStats }) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { role } = useAuthStore();

  // Determine user type based on role
  const userType = role === "counselor" ? "service-provider" : "user";

  // Query to fetch dashboard stats
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-stats", userType],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await DashboardApi(userType, { 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No dashboard data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Transform dashboard data to stats format
  const getStatsFromData = () => {
    if (!dashboardData) return [];

    const baseStats: StatCardConfig[] = [
      {
        label: "Total Sessions",
        value: dashboardData.totalSessions.toString(),
        trend: "+12% from last month",
      },
      {
        label: "Time Spent",
        value: `${Math.floor(dashboardData.timeSpent / 60)}h ${dashboardData.timeSpent % 60}m`,
        trend: "+8% from last month",
      },
    ];

    // Add amount earned for service providers (therapists)
    if (userType === "service-provider") {
      baseStats.push({
        label: "Amount Earned",
        value: `₦${dashboardData.amountEarned.toLocaleString()}`,
        trend: "+15% from last month",
      });
    }

    return baseStats;
  };

  // Use API data if available, otherwise use prop stats
  const statsToDisplay = dashboardData ? getStatsFromData() : (propStats || []);

  if (isLoading) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="gap-4 overflow-x-auto overflow-y-hidden flex flex-nowrap">
          {Array(userType === "service-provider" ? 3 : 2).fill(0).map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 animate-pulse p-6 lg:p-4 rounded-lg grow-0 shrink-0 basis-auto w-[70%] md:w-1/2 lg:w-[calc(33.33%-10px)] shadow-[0px_4px_10px_0px_#00000008] h-24"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">Failed to load stats</p>
          <p className="text-red-500 text-xs mt-1">Please refresh the page</p>
        </div>
      </div>
    );
  }

  if (statsToDisplay.length === 0) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">No stats available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[calc(100vw-48px)]">
      <div className="gap-4 overflow-x-auto overflow-y-hidden flex flex-nowrap">
        {statsToDisplay.map((stat) => (
          <div
            key={stat.label}
            className="bg-white flex p-6 lg:p-4 rounded-lg justify-between grow-0 shrink-0 basis-auto w-[70%] md:w-1/2 lg:w-[calc(33.33%-10px)] shadow-[0px_4px_10px_0px_#00000008]"
          >
            <div>
              <div className="text-lg text-[#B3B3B3]">{stat.label}</div>
              <div className="text-2xl font-bold my-3">{stat.value}</div>
              <div className="text-xs">
                <UptrendIcon className="inline text-[#014CB1] w-4" /> {stat.trend}
              </div>
            </div>
            <div className="text-[#014CB1] w-14 h-14 rounded-full bg-[#014CB11A] grid place-items-center self-center">
              <TimerIcon className="w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;