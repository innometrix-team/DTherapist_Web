import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DisputesList from "../../components/Dispute/DisputeList";
import DisputeDetail from "../../components/Dispute/DisputeDetail";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const DisputesPage: React.FC = () => {
  const { role } = useAuthStore();
  const isAdmin = role === "admin";

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need admin privileges to access the dispute management system.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* List all disputes */}
      <Route index element={<DisputesList />} />
      
      {/* View and resolve single dispute */}
      <Route path=":disputeId" element={<DisputeDetail />} />
      
      {/* Catch all - redirect to list */}
      <Route path="*" element={<Navigate to="/admin/disputes" replace />} />
    </Routes>
  );
};

export default DisputesPage;