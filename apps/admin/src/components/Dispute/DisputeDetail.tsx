import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  DollarSign,
  FileText,
  Clock
} from "lucide-react";
import { 
  getDisputeApi, 
  resolveDisputeApi,
  IResolveDisputeData,
  IBookingDetails,
  IUserDetails
} from "../../api/Dispute.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const DisputeDetail: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();

  const [selectedAction, setSelectedAction] = useState<"refund" | "reject" | "other">("refund");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Check if user is admin
  const isAdmin = role === "admin";

  // Fetch dispute details
  const { data: disputeData, isLoading, error } = useQuery({
    queryKey: ["dispute", disputeId],
    queryFn: () => disputeId ? getDisputeApi(disputeId) : null,
    enabled: isAdmin && !!disputeId,
  });

  const dispute = disputeData?.data;

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: (data: IResolveDisputeData) => 
      disputeId ? resolveDisputeApi(disputeId, data) : Promise.reject("No dispute ID"),
    onSuccess: () => {
      showToast("Dispute resolved successfully!");
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["dispute", disputeId] });
      
      setTimeout(() => {
        navigate("/admin/disputes");
      }, 1500);
    },
    onError: (error: Error) => {
      console.error("Failed to resolve dispute:", error);
      showToast(error.message || "Failed to resolve dispute", 'error');
      setIsResolving(false);
    },
  });

  // Handle resolve dispute
  const handleResolveDispute = () => {
    if (!resolutionNotes.trim()) {
      showToast("Please provide resolution notes", 'error');
      return;
    }

    setIsResolving(true);

    const resolutionData: IResolveDisputeData = {
      action: selectedAction,
      notes: resolutionNotes.trim(),
    };

    resolveDisputeMutation.mutate(resolutionData);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to load dispute details</p>
          <button
            onClick={() => navigate("/admin/disputes")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Disputes
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(dispute.status);
  const StatusIcon = statusBadge.icon;
  const isDisputeOpen = dispute.status === "open";

  // Type guards and helpers
  const getClientName = () => {
    if (typeof dispute.clientId === 'object' && dispute.clientId !== null) {
      return (dispute.clientId as IUserDetails).fullName || "Unknown Client";
    }
    return "Unknown Client";
  };

  const getTherapistName = () => {
    if (typeof dispute.therapistId === 'object' && dispute.therapistId !== null) {
      return (dispute.therapistId as IUserDetails).fullName || "Unknown Therapist";
    }
    return "Unknown Therapist";
  };

  const getBookingPrice = () => {
    if (typeof dispute.bookingId === 'object' && dispute.bookingId !== null) {
      return (dispute.bookingId as IBookingDetails).price;
    }
    return undefined;
  };

  const getBookingDate = () => {
    if (typeof dispute.bookingId === 'object' && dispute.bookingId !== null) {
      const booking = dispute.bookingId as IBookingDetails;
      if (booking.date) {
        const date = new Date(booking.date);
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
    return "N/A";
  };

  const getBookingTime = () => {
    if (typeof dispute.bookingId === 'object' && dispute.bookingId !== null) {
      const booking = dispute.bookingId as IBookingDetails;
      if (booking.startTime && booking.endTime) {
        return `${booking.startTime} - ${booking.endTime}`;
      }
    }
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="h-40 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <button
            onClick={() => navigate("/disputes")}
            className="inline-flex items-center text-white mb-2 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </button>
          <h1 className="text-white text-3xl font-bold">Dispute Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 -mt-6 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispute Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Dispute Overview</h2>
                    <p className="text-sm text-gray-500 mt-1">ID: {dispute._id}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reason</label>
                    <p className="text-gray-900 mt-1">{dispute.reason}</p>
                  </div>

                  {dispute.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{dispute.description}</p>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    Created {formatDate(dispute.createdAt)}
                  </div>

                  {dispute.attachments && dispute.attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Attachments ({dispute.attachments.length})
                      </label>
                      <div className="space-y-2">
                        {dispute.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parties Involved */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Parties Involved</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Client</span>
                    </div>
                    <p className="text-gray-900">{getClientName()}</p>
                    {typeof dispute.clientId === 'object' && (dispute.clientId as IUserDetails).email && (
                      <p className="text-sm text-gray-500 mt-1">{(dispute.clientId as IUserDetails).email}</p>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Therapist</span>
                    </div>
                    <p className="text-gray-900">{getTherapistName()}</p>
                    {typeof dispute.therapistId === 'object' && (dispute.therapistId as IUserDetails).email && (
                      <p className="text-sm text-gray-500 mt-1">{(dispute.therapistId as IUserDetails).email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              {typeof dispute.bookingId === 'object' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Session Date</p>
                        <p className="text-gray-900">{getBookingDate()}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Session Time</p>
                        <p className="text-gray-900">{getBookingTime()}</p>
                      </div>
                    </div>

                    {getBookingPrice() && (
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="text-gray-900">N{getBookingPrice()}</p>
                        </div>
                      </div>
                    )}

                    {typeof dispute.bookingId === 'object' && (dispute.bookingId as IBookingDetails).status && (
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Booking Status</p>
                          <p className="text-gray-900 capitalize">
                            {(dispute.bookingId as IBookingDetails).status}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resolution Details */}
              {dispute.resolution && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Resolution Details</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Action Taken</label>
                      <p className="text-gray-900 mt-1 capitalize">{dispute.resolution.action}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Resolution Notes</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{dispute.resolution.notes}</p>
                    </div>

                    {dispute.resolution.resolvedAt && (
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolved {formatDate(dispute.resolution.resolvedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resolve Dispute Panel */}
              {isDisputeOpen && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Dispute</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Resolution Action *
                      </label>
                      <select
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value as "refund" | "reject" | "other")}
                        disabled={isResolving}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="refund">Refund Client</option>
                        <option value="reject">Reject Dispute</option>
                        <option value="other">Other Action</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Resolution Notes *
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        disabled={isResolving}
                        placeholder="Explain the resolution decision..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {resolutionNotes.length} characters
                      </p>
                    </div>

                    <button
                      onClick={handleResolveDispute}
                      disabled={isResolving || !resolutionNotes.trim()}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isResolving ? "Resolving..." : "Resolve Dispute"}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Resolution Guidelines</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Review all evidence carefully</li>
                      <li>• Contact parties if needed</li>
                      <li>• Provide clear explanation</li>
                      <li>• Document decision thoroughly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetail;