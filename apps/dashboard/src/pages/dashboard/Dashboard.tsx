import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth/useAuthStore";

import BalanceCard from "../../components/dashboard/BalanceCard";
import PromoCard from "../../components/dashboard/PromoCard";
import StatsGrid from "../../components/dashboard/StatsGrid";
import SessionTable from "../../components/appointment/SessionTable";
import RescheduleSession from "../../components/appointment/RescheduleSession";
import FeliciaChatbot from "../../components/AIChatBot/FeliciaChatbot";
import { DashboardConfig, DUMMY_DASHBOARD_CONFIG } from "./types";

const Dashboard: React.FC = () => {
  const { role } = useAuthStore();
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  
  // Modal states for reschedule functionality
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;
    setConfig(DUMMY_DASHBOARD_CONFIG[role]);
  }, [role]);

  const handleReschedule = (sessionId: string) => {
    console.log("Reschedule session:", sessionId);
    setSelectedSessionId(sessionId);
    setIsRescheduleModalOpen(true);
  };

  const handleCloseRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setSelectedSessionId(null);
  };

  const handleDownloadInvoice = (appointmentId: string) => {
    console.log(`Downloading invoice for appointment: ${appointmentId}`);
    // Add invoice download logic here
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
              type="upcoming"
              onReschedule={handleReschedule}
              onDownloadInvoice={handleDownloadInvoice}
            />
          </div>
        </div>
      </div>

      {/* Reschedule Modal with High Z-Index */}
      {isRescheduleModalOpen && selectedSessionId && (
        <div className="fixed inset-0 z-[9999]">
          <RescheduleSession 
            sessionId={selectedSessionId}
            onClose={handleCloseRescheduleModal}
          />
        </div>
      )}

      {/* Felicia AI Chatbot */}
      <FeliciaChatbot />
    </>
  );
};

export default Dashboard;