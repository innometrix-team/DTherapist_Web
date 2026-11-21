import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { getAdminOverviewApi } from "../../api/AdminDashboard.api";
import BalanceCard from "../../components/dashboard/BalanceCard";
import PromoCard from "../../components/dashboard/PromoCard";
import StatsGrid from "../../components/dashboard/StatsGrid";
import { DashboardConfig, DUMMY_DASHBOARD_CONFIG } from "./types";
import StatChart from "../../components/dashboard/StatChart";

const Dashboard: React.FC = () => {
  const role = useAuthStore((s) => s.role);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    if (!role) return;
    setConfig(DUMMY_DASHBOARD_CONFIG[role]);
  }, [role]);

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-overview", selectedYear],
    queryFn: async () => {
      const res = await getAdminOverviewApi(selectedYear);
      if (!res?.data) throw new Error("Failed to load overview analytics");
      return res.data;
    },
    enabled: role === "admin",
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!config) {
    return (
      <div className="p-6 text-red-600">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="lg:grid grid-cols-3 lg:space-x-4 space-y-4 lg:space-y-0">
        <BalanceCard {...config.balance} />
        <PromoCard {...config.promo} />
      </div>

      <StatsGrid
        stats={config.stats}
        overviewData={overviewData}
        overviewLoading={overviewLoading}
      />

      <StatChart
        overviewData={overviewData}
        overviewLoading={overviewLoading}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
    </div>
  );
};

export default Dashboard;
