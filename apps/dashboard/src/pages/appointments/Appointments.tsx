import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Import types
import { TabType } from "../../components/appointment/types";
import {
  getCounselorAppointments,
  getUserAppointments,
} from "../../api/Appointments.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

// Import components
import TabNavigation from "../../components/appointment/TabNavigation";
import SessionTable from "../../components/appointment/SessionTable";
import RescheduleSession from "../../components/appointment/RescheduleSession";

// Define error types
interface QueryError {
  name?: string;
  code?: string;
  message?: string;
}

const Appointments: React.FC = () => {
  // Get user role from auth store
  const { role } = useAuthStore();
  const isCounselor = role === "counselor";

  // State for active tab (Upcoming or Passed)
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch appointments data based on user role with improved error handling
  const {
    data: appointmentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: isCounselor ? ["counselor-appointments"] : ["user-appointments"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isCounselor) {
        return await getCounselorAppointments({ signal: controller.signal });
      } else {
        return await getUserAppointments({ signal: controller.signal });
      }
    },
    retry: (failureCount, error: unknown) => {
      // Don't retry if the request was aborted
      const queryError = error as QueryError;
      if (
        queryError?.name === "AbortError" ||
        queryError?.code === "ERR_CANCELED"
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    enabled: !!role,
    // Add stale time to prevent unnecessary refetches when switching tabs quickly
    staleTime: 30000, // 30 seconds
    // Keep data fresh for 5 minutes
    gcTime: 300000, // 5 minutes (renamed from cacheTime in newer versions)
  });

  useEffect(() => {
    return () => {
      // Clean up abort controller on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Process appointments data to get stats
  const processAppointmentsData = () => {
    if (!appointmentsData?.data)
      return { appointments: [], upcomingCount: 0, passedCount: 0 };

    let appointments = [];

    if (isCounselor) {
      // Handle counselor data
      appointments = Array.isArray(appointmentsData.data)
        ? appointmentsData.data
        : [];
    } else {
      // Handle user data - check if it's direct array or nested in upcomingAppointments
      if (Array.isArray(appointmentsData.data)) {
        appointments = appointmentsData.data;
      } else {
        // Check if it's nested in upcomingAppointments (as per UserDashboardData type)
        const dashboardData = appointmentsData.data;
        appointments = dashboardData.upcomingAppointments || [];
      }
    }

    const upcomingCount = appointments.filter(
      (appointment) =>
        appointment.status === "upcoming" || appointment.status === "confirmed"
    ).length;

    const passedCount = appointments.filter(
      (appointment) => appointment.status === "passed"
    ).length;

    return { appointments, upcomingCount, passedCount };
  };

  const { upcomingCount, passedCount } = processAppointmentsData();

  // Function to handle tab change with debouncing to prevent rapid switches
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return; // Prevent unnecessary state updates
    setActiveTab(tab);
  };

  // Function to open modal for rescheduling
  const handleOpenModal = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSessionId(null);
    // Refetch data when modal closes to get updated information
    refetch();
  };

  // Callback functions for SessionTable
  const handleReschedule = (appointmentId: string) => {
    handleOpenModal(appointmentId);
  };

  const handleDownloadInvoice = (appointmentId: string) => {
    console.log(`Downloading invoice for appointment: ${appointmentId}`);
    // Additional logic for invoice download can be added here
  };

  // Don't render if no role
  if (!role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Please log in to view appointments.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  // Improved error handling - don't show error for aborted requests
  if (error) {
    // Check if it's an AbortError or network cancellation
    const queryError = error as QueryError;
    const isAbortError =
      queryError?.name === "AbortError" ||
      queryError?.code === "ERR_CANCELED" ||
      queryError?.message?.includes("canceled") ||
      queryError?.message?.includes("aborted");

    if (!isAbortError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load appointments</p>
            <p className="text-gray-600 mb-4">
              {error instanceof Error
                ? error.message
                : "Unknown error occurred"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Banner */}
        <div
          className="w-full h-24 sm:h-32 lg:h-40 rounded-lg mb-4 sm:mb-6 flex items-center justify-center px-4 sm:px-8 bg-black/50 bg-no-repeat bg-center bg-cover relative overflow-hidden"
          style={{
            backgroundImage:
              "url(https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637)",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-blue-900/20 to-purple-900/20"></div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white relative z-10 text-center">
            My Sessions
          </h1>
        </div>

        {/* Main Content Container - Removed overflow-hidden to prevent dropdown clipping */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="p-4 sm:p-6 pb-0">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          {/* Sessions Content */}
          <div className="p-4 sm:p-6">
            {/* Summary Stats - Mobile */}
            <div className="md:hidden mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-primary">
                    {activeTab === "upcoming" ? upcomingCount : passedCount}
                  </div>
                  <div className="text-xs text-primary/70 uppercase tracking-wider">
                    {activeTab === "upcoming" ? "Upcoming" : "Completed"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-600">
                    {activeTab === "upcoming" ? passedCount : upcomingCount}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {activeTab === "upcoming" ? "Completed" : "Upcoming"}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Content - Using key prop to force re-render when tab changes */}
            {activeTab === "upcoming" && (
              <SessionTable
                key="upcoming-sessions"
                type="upcoming"
                onReschedule={handleReschedule}
              />
            )}

            {activeTab === "passed" && (
              <SessionTable
                key="passed-sessions"
                type="passed"
                onDownloadInvoice={handleDownloadInvoice}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal for Rescheduling with High Z-Index */}
      {isModalOpen && selectedSessionId && (
        <div className="fixed inset-0 z-9999">
          <RescheduleSession
            sessionId={selectedSessionId}
            onClose={handleCloseModal}
          />
        </div>
      )}
    </div>
  );
};

export default Appointments;
