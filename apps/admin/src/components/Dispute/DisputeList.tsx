import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search
} from "lucide-react";
import { getDisputesApi } from "../../api/Dispute.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const DisputesList: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved" | "rejected">("all");

  // Check if user is admin
  const isAdmin = role === "admin";

  // Fetch disputes
  const { data: disputesData, isLoading, error } = useQuery({
    queryKey: ["disputes"],
    queryFn: () => getDisputesApi(),
    enabled: isAdmin,
  });

  const disputes = disputesData?.data || [];

  // Filter disputes
  const filteredDisputes = disputes.filter((dispute) => {
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      dispute.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute._id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          icon: AlertCircle,
        };
      case "resolved":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          icon: CheckCircle,
        };
      case "rejected":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          icon: AlertCircle,
        };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view dispute
  const handleViewDispute = (disputeId: string) => {
    navigate(disputeId);
  };

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">Admin access required to view disputes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div 
        className="h-40 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <h1 className="text-white text-3xl font-bold">Dispute Management</h1>
          <p className="text-white text-sm mt-1 opacity-90">
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 -mt-6 relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Disputes</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{disputes.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Open Disputes</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {disputes.filter(d => d.status === "open").length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Resolved</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {disputes.filter(d => d.status === "resolved").length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by reason or ID..."
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "open" | "resolved" | "rejected")}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Disputes List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm sm:text-base text-gray-600 mt-4">Loading disputes...</p>
              </div>
            ) : error ? (
              <div className="p-8 sm:p-12 text-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">Failed to load disputes</p>
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">No disputes found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => {
                    const statusBadge = getStatusBadge(dispute.status);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <div key={dispute._id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">
                              ID: {dispute._id.substring(0, 8)}...
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate mb-2">
                              {dispute.reason}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} ml-2 flex-shrink-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDate(dispute.createdAt)}
                          </p>
                          <button
                            onClick={() => handleViewDispute(dispute._id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dispute ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDisputes.map((dispute) => {
                        const statusBadge = getStatusBadge(dispute.status);
                        const StatusIcon = statusBadge.icon;

                        return (
                          <tr key={dispute._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-medium text-gray-900">
                                {dispute._id.substring(0, 8)}...
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900 max-w-xs truncate">
                                {dispute.reason}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(dispute.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleViewDispute(dispute._id)}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputesList;