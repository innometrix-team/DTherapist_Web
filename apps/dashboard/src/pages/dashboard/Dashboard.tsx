import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth/useAuthStore";

import BalanceCard from "../../components/dashboard/BalanceCard";
import PromoCard from "../../components/dashboard/PromoCard";
import StatsGrid from "../../components/dashboard/StatsGrid";
import { DashboardConfig, DUMMY_DASHBOARD_CONFIG } from "./types";

const Dashboard: React.FC = () => {
  const { role } = useAuthStore();
  const [config, setConfig] = useState<DashboardConfig | null>();

  useEffect(() => {
    if (!role) return;
    setConfig(DUMMY_DASHBOARD_CONFIG[role]);
  }, [role]);

  if (!config) {
    return (
      <div className="p-6 text-red-600">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 ">
      <div className="lg:grid grid-cols-3 lg:space-x-4 space-y-4 lg:space-y-0">
        <BalanceCard {...config.balance} />
        <PromoCard {...config.promo} />
      </div>

      <StatsGrid stats={config.stats} />
    </div>
  );
};

export default Dashboard;
