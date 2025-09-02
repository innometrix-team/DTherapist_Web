import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimerIcon, UptrendIcon } from "../../assets/icons";
import { StatCardConfig } from "../../pages/Dashboard/types";
import AdminDashboardApi from "../../api/AdminDashboard.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

interface StatsGridProps {
  stats?: StatCardConfig[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats: propStats }) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { role } = useAuthStore();

  // Check if user is admin
  const isAdmin = role === "admin";

  // Query to fetch admin dashboard stats
  const {
    data: adminDashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await AdminDashboardApi({
        signal: controller.signal,
      });

      if (!response?.data) {
        throw new Error("No admin dashboard data received");
      }

      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: isAdmin, // Only run query if user is admin
  });

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Transform admin dashboard data to stats format
  const getAdminStatsFromData = () => {
    if (!adminDashboardData) return [];

    console.log(adminDashboardData);

    const adminStats: StatCardConfig[] = [
      {
        label: "Active Users",
        value: (adminDashboardData.activeUsers ?? 0).toLocaleString(),
        trend: "+30% This Month",
        trendUp: true,
      },
      {
        label: "Active Therapists",
        value: (adminDashboardData.activeTherapists ?? 0).toLocaleString(),
        trend: "+30% This Month",
        trendUp: true,
      },
      {
        label: "Deposits",
        value: `₦${(adminDashboardData.deposits ?? 0).toLocaleString()}`,
        trend: "+30% This Month",
        trendUp: true,
      },
      {
        label: "Withdrawals",
        value: `₦${(adminDashboardData.withdrawals ?? 0).toLocaleString()}`,
        trend: "30% This Month",
        trendUp: false, // Red/down trend as shown in the image
      },
    ];

    return adminStats;
  };

  // Get stats to display - use API data if available, otherwise fallback to props
  const statsToDisplay = adminDashboardData
    ? getAdminStatsFromData()
    : propStats || [];

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">
            Admin access required to view these stats
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="gap-4 overflow-x-auto overflow-y-hidden flex flex-nowrap">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 animate-pulse p-6 lg:p-4 rounded-lg grow-0 shrink-0 basis-auto w-[70%] md:w-1/2 lg:w-[calc(25%-12px)] shadow-[0px_4px_10px_0px_#00000008] h-24"
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
          <p className="text-red-600 text-sm">Failed to load admin stats</p>
          <p className="text-red-500 text-xs mt-1">Please refresh the page</p>
        </div>
      </div>
    );
  }

  if (statsToDisplay.length === 0) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">No admin stats available</p>
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
            className="bg-white flex p-6 lg:p-4 rounded-lg justify-between grow-0 shrink-0 basis-auto w-[70%] md:w-1/2 lg:w-[calc(25%-12px)] shadow-[0px_4px_10px_0px_#00000008]"
          >
            <div>
              <div className="text-lg text-[#B3B3B3]">{stat.label}</div>
              <div className="text-2xl font-bold my-3">{stat.value}</div>
              <div className="text-xs">
                <UptrendIcon
                  className={`inline w-4 ${
                    stat.trendUp === false
                      ? "text-red-500 transform rotate-180"
                      : "text-[#014CB1]"
                  }`}
                />
                <span
                  className={
                    stat.trendUp === false ? "text-red-500" : "text-inherit"
                  }
                >
                  {stat.trend}
                </span>
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
