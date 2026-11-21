import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimerIcon, UptrendIcon } from "../../assets/icons";
import { StatCardConfig } from "../../pages/Dashboard/types";
import AdminDashboardApi, { IAdminOverviewData } from "../../api/AdminDashboard.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

interface StatsGridProps {
  stats?: StatCardConfig[];
  overviewData?: IAdminOverviewData;
  overviewLoading?: boolean;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  stats: propStats,
  overviewData,
  overviewLoading,
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const role = useAuthStore((s) => s.role);

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



    const clientsLabel = overviewData
      ? `${overviewData.clients.active.toLocaleString()} / ${overviewData.clients.total.toLocaleString()}`
      : adminDashboardData.activeUsers.toLocaleString();
    const clientsTrend = overviewData
      ? `Active / Total clients`
      : "Current active";

    const therapistsLabel = overviewData
      ? `${overviewData.therapists.active.toLocaleString()} / ${overviewData.therapists.total.toLocaleString()}`
      : adminDashboardData.activeTherapists.toLocaleString();
    const therapistsTrend = overviewData
      ? `${overviewData.therapists.bookable.toLocaleString()} bookable`
      : "Current active";

    const adminStats: StatCardConfig[] = [
      {
        label: "Clients (Active / Total)",
        value: clientsLabel,
        trend: clientsTrend,
        trendUp: true,
      },
      {
        label: "Therapists (Active / Total)",
        value: therapistsLabel,
        trend: therapistsTrend,
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

    if (overviewData) {
      adminStats.push({
        label: `Appointments (${overviewData.year})`,
        value: overviewData.appointments.total.toLocaleString(),
        trend: `${overviewData.appointments.completed} completed · ${overviewData.appointments.confirmed} confirmed · ${overviewData.appointments.pending} pending · ${overviewData.appointments.cancelled} cancelled`,
        trendUp: true,
      });
    }

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

  if (isLoading || (overviewLoading && !overviewData && !adminDashboardData)) {
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
              <div className="text-lg text-neutral">{stat.label}</div>
              <div className="text-2xl font-bold my-3">{stat.value}</div>
              <div className="text-xs">
                <UptrendIcon
                  className={`inline w-4 ${
                    stat.trendUp === false
                      ? "text-red-500 transform rotate-180"
                      : "text-primary"
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
            <div className="text-primary w-14 h-14 rounded-full bg-primary/10 grid place-items-center self-center">
              <TimerIcon className="w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
