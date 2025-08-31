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
        signal: controller.signal 
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

  // Helper function to calculate trend from array data
  const calculateTrend = (dataArray: number[]) => {
    if (!Array.isArray(dataArray) || dataArray.length < 2) {
      return { trend: "No data", trendUp: true };
    }

    // Get current month (latest non-zero value or last value)
    const currentMonth = dataArray[dataArray.length - 1];
    
    // Get previous month (second to last value)
    const previousMonth = dataArray[dataArray.length - 2];
    
    // Calculate percentage change
    if (previousMonth === 0 && currentMonth === 0) {
      return { trend: "No change", trendUp: true };
    }
    
    if (previousMonth === 0 && currentMonth > 0) {
      return { trend: "New activity", trendUp: true };
    }
    
    if (previousMonth > 0 && currentMonth === 0) {
      return { trend: "-100%", trendUp: false };
    }
    
    const percentChange = ((currentMonth - previousMonth) / previousMonth) * 100;
    const isPositive = percentChange >= 0;
    const formattedPercent = Math.abs(percentChange).toFixed(1);
    
    return {
      trend: `${isPositive ? '+' : '-'}${formattedPercent}% from last month`,
      trendUp: isPositive
    };
  };

  // Transform admin dashboard data to stats format
  const getAdminStatsFromData = () => {
    // Add proper null checks for all nested properties
    if (!adminDashboardData || 
        typeof adminDashboardData.activeUsers !== 'number' ||
        typeof adminDashboardData.activeTherapists !== 'number' ||
        typeof adminDashboardData.totalCommission !== 'number' ||
        typeof adminDashboardData.withdrawals !== 'number') {
      return [];
    }

    // Calculate trends from the trends data if available
    const commissionTrend = adminDashboardData.trends?.commissions 
      ? calculateTrend(adminDashboardData.trends.commissions)
      : { trend: "No trend data", trendUp: true };
      
    const withdrawalTrend = adminDashboardData.trends?.withdrawals 
      ? calculateTrend(adminDashboardData.trends.withdrawals)
      : { trend: "No trend data", trendUp: true };

    const adminStats: StatCardConfig[] = [
      {
        label: "Active Users",
        value: adminDashboardData.activeUsers.toLocaleString(),
        trend: "Current active", // No trend data available for users
        trendUp: true,
      },
      {
        label: "Active Therapists",
        value: adminDashboardData.activeTherapists.toLocaleString(),
        trend: "Current active", // No trend data available for therapists
        trendUp: true,
      },
      {
        label: "Total Commission",
        value: `₦${adminDashboardData.totalCommission.toLocaleString()}`,
        trend: commissionTrend.trend,
        trendUp: commissionTrend.trendUp,
      },
      {
        label: "Withdrawals",
        value: `₦${adminDashboardData.withdrawals.toLocaleString()}`,
        trend: withdrawalTrend.trend,
        trendUp: withdrawalTrend.trendUp,
      },
    ];

    return adminStats;
  };

  // Get stats to display - use API data if available, otherwise fallback to props
  const statsToDisplay = adminDashboardData ? getAdminStatsFromData() : (propStats || []);

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">Admin access required to view these stats</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-[calc(100vw-48px)]">
        <div className="gap-4 overflow-x-auto overflow-y-hidden flex flex-nowrap">
          {Array(4).fill(0).map((_, index) => (
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
                      ? 'text-red-500 transform rotate-180' 
                      : 'text-[#014CB1]'
                  }`} 
                /> 
                <span className={stat.trendUp === false ? 'text-red-500' : 'text-inherit'}>
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