import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth/useAuthStore";
import ProfileApi from "../../api/Profile.api";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

import BalanceCard from "../../components/dashboard/BalanceCard";
import PromoCard from "../../components/dashboard/PromoCard";
import StatsGrid from "../../components/dashboard/StatsGrid";
import SessionTable from "../../components/appointment/SessionTable";
import RescheduleSession from "../../components/appointment/RescheduleSession";
import PageContainer from "../../components/common/PageContainer";
import { DashboardConfig, DUMMY_DASHBOARD_CONFIG } from "./types";

const Dashboard: React.FC = () => {
  const role = useAuthStore((s) => s.role);
  const authName = useAuthStore((s) => s.name);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  
  // Modal states for reschedule functionality
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const userType = role === "counselor" ? "counselor" : "user";

  // Read profile data from shared TanStack query cache
  const { data: profileData } = useQuery({
    queryKey: QUERY_KEYS.profile.userProfile(userType),
    queryFn: async () => {
      const response = await ProfileApi(userType);
      return response?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = useMemo(() => {
    const fullName = profileData?.fullName || authName || "";
    return fullName.trim().split(" ")[0] || "";
  }, [profileData?.fullName, authName]);

  useEffect(() => {
    if (!role) return;
    setConfig(DUMMY_DASHBOARD_CONFIG[role]);
  }, [role]);

  const handleReschedule = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsRescheduleModalOpen(true);
  };

  const handleCloseRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setSelectedSessionId(null);
  };


  if (!config) {
    return (
      <div className="p-6 text-red-600">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <PageContainer className="space-y-6">
          {/* Dynamic Welcome Greeting */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-darkerb tracking-tight">
              {displayName ? `${getGreeting()}, ${displayName}` : getGreeting()}
            </h1>
            <p className="text-xs sm:text-sm text-neutral mt-0.5">
              Here is an overview of your mental health journey today.
            </p>
          </div>

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
                type="upcoming"
                onReschedule={handleReschedule}
              />
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Reschedule Modal with High Z-Index */}
      {isRescheduleModalOpen && selectedSessionId && (
        <div className="fixed inset-0 z-9999">
          <RescheduleSession 
            sessionId={selectedSessionId}
            onClose={handleCloseRescheduleModal}
          />
        </div>
      )}
    </>
  );
};

export default Dashboard;