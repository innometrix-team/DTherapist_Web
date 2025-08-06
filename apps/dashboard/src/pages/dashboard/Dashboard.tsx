import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth/useAuthStore";

import BalanceCard from "../../components/dashboard/BalanceCard";
import PromoCard from "../../components/dashboard/PromoCard";
import StatsGrid from "../../components/dashboard/StatsGrid";
import SessionTable from "../../components/appointment/SessionTable";
import { DashboardConfig, DUMMY_DASHBOARD_CONFIG } from "./types";
import { Session } from "../../components/appointment/types";
import { UPCOMING_SESSIONS } from "../../components/appointment/constants";

const Dashboard: React.FC = () => {
  const { role } = useAuthStore();
  const [config, setConfig] = useState<DashboardConfig | null>();
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!role) return;
    setConfig(DUMMY_DASHBOARD_CONFIG[role]);
    
    // Limit to 5 sessions for dashboard display
    setUpcomingSessions(UPCOMING_SESSIONS.slice(0, 5));
  }, [role]);

  const handleReschedule = (sessionId: string) => {
    console.log("Reschedule session:", sessionId);
    // Add your reschedule logic here
  };

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

      <StatsGrid stats={config.stats} />
      
      {/* Upcoming Appointments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
        </div>
        <div className="p-6">
          <SessionTable 
            sessions={upcomingSessions}
            type="upcoming"
            onReschedule={handleReschedule}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;