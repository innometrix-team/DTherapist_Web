// /components/Admin/AdminBookingsTable.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronDownIcon,
  SearchIcon,
  VideoIcon,
  PhoneIcon,
  MessageCircleIcon,
  X,
  CalendarClock,
} from "lucide-react";

import {
  getAdminBookingsApi,
  IAdminBookingQueryParams,
  IAdminBooking,
  getAdminBookingStatusColor,
  getAdminBookingStatusText,
  getAdminSessionTypeColor,
  getAdminSessionTypeText,
  CancelBookingApi,
  RescheduleBookingApi,
} from "../../api/AdminBookings.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

interface AdminBookingsTableProps {
  className?: string;
}

const ITEMS_PER_PAGE = 10;

const AdminBookingsTable: React.FC<AdminBookingsTableProps> = ({
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All Bookings");
  const [filters, setFilters] = useState<IAdminBookingQueryParams>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  });

  const { role } = useAuthStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if user is admin
  const isAdmin = role === "admin";

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeCancelId, setActiveCancelId] = useState<string | null>(null);

  const openCancel = (bookingId: string) => {
    setActiveCancelId(bookingId);
    setCancelOpen(true);
  };

  const { mutate: cancelBooking, isPending: cancelling } = useMutation({
    mutationFn: async (bookingId: string) => CancelBookingApi(bookingId),
    onSuccess: () => {
      toast.success("Booking cancelled");
      setCancelOpen(false);
      setActiveCancelId(null);
      refetch();
    },
    onError: (e) => toast.error(e?.message || "Failed to cancel booking"),
  });

  const { mutate: rescheduleBooking, isPending: rescheduling } = useMutation({
    mutationFn: async (vars: {
      bookingId: string;
      date: string;
      startTime: string;
      endTime: string;
    }) =>
      RescheduleBookingApi({
        bookingId: vars.bookingId,
        payload: {
          date: vars.date,
          startTime: vars.startTime,
          endTime: vars.endTime,
        },
      }),

    onSuccess: () => {
      toast.success("Booking rescheduled");
      setRescheduleOpen(false);
      setActiveBookingId(null);
      setRescheduleForm({ date: "", startTime: "", endTime: "" });
      refetch();
    },
    onError: (e) =>
      toast.error(e?.message || "Failed to reschedule booking"),
  });

  const openReschedule = (bookingId: string) => {
    setActiveBookingId(bookingId);
    setRescheduleOpen(true);
  };

  // Fetch admin bookings
  const {
    data: bookingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-bookings", filters],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return getAdminBookingsApi(filters, { signal: controller.signal });
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
    enabled: isAdmin, // Only run if user is admin
  });

  const actualData = bookingData?.data;
  const bookings = actualData?.bookings || [];

  // Calculate pagination
  const totalBookings = actualData?.total || 0;
  const currentPage = filters.page || 1;
  const totalPages = Math.ceil(
    totalBookings / (filters.limit || ITEMS_PER_PAGE)
  );

  // Handle search
  const handleSearch = useCallback((searchValue: string) => {
    setSearchTerm(searchValue);
    setFilters((prev) => ({
      ...prev,
      search: searchValue.trim() || undefined,
      page: 1,
    }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  }, []);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing items per page
    }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filterType: string) => {
    setSelectedFilter(filterType);
    let statusFilter: IAdminBooking["status"] | undefined;
    let sessionTypeFilter: IAdminBooking["sessionType"] | undefined;
    let tabFilter: IAdminBooking["tab"] | undefined;

    switch (filterType) {
      case "Pending":
        statusFilter = "pending";
        break;
      case "Confirmed":
        statusFilter = "confirmed";
        break;
      case "Completed":
        statusFilter = "completed";
        break;
      case "Cancelled":
        statusFilter = "cancelled";
        break;
      case "Rescheduled":
        statusFilter = "rescheduled";
        break;
      case "Video Call":
        sessionTypeFilter = "video";
        break;
      case "Audio Call":
        sessionTypeFilter = "audio";
        break;
      case "Chat":
        sessionTypeFilter = "chat";
        break;
      case "Upcoming":
        tabFilter = "upcoming";
        break;
      case "Past":
        tabFilter = "past";
        break;
      default:
        statusFilter = undefined;
        sessionTypeFilter = undefined;
        tabFilter = undefined;
    }

    setFilters((prev) => ({
      ...prev,
      status: statusFilter,
      sessionType: sessionTypeFilter,
      tab: tabFilter,
      page: 1,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error("Failed to load admin bookings. Please try again.");
    }
  }, [error]);

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className={`bg-white p-4 sm:p-6 space-y-6 w-full ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">
            Admin access required to view bookings
          </p>
        </div>
      </div>
    );
  }

  const filterOptions = [
    "All Bookings",
    "Pending",
    "Confirmed",
    "Completed",
    "Cancelled",
    "Rescheduled",
    "Video Call",
    "Audio Call",
    "Chat",
    "Upcoming",
    "Past",
  ];

  // Get session type icon
  const getSessionTypeIcon = (sessionType: IAdminBooking["sessionType"]) => {
    switch (sessionType) {
      case "video":
        return <VideoIcon className="w-4 h-4" />;
      case "audio":
        return <PhoneIcon className="w-4 h-4" />;
      case "chat":
        return <MessageCircleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white space-y-4 sm:space-y-6 w-full ${className}`}>
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 text-sm">Total Bookings:</span>
            <span className="font-semibold text-gray-900">
              {totalBookings.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 text-sm">Showing:</span>
            <span className="font-semibold text-gray-900 text-xs sm:text-sm">
              {Math.min(
                (currentPage - 1) * (filters.limit || ITEMS_PER_PAGE) + 1,
                totalBookings
              )}
              -
              {Math.min(
                currentPage * (filters.limit || ITEMS_PER_PAGE),
                totalBookings
              )}{" "}
              of {totalBookings}
            </span>
          </div>
        </div>

        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 text-sm">Show:</span>
          <select
            value={filters.limit || ITEMS_PER_PAGE}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 sm:px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span className="text-gray-600 text-sm">per page</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pb-4 border-b border-gray-200">
        {/* Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client or therapist name"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-64"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px] sm:min-h-[500px] px-4 sm:px-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 text-sm">
              Loading bookings...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <p className="text-red-600 mb-4">Failed to load bookings</p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {bookings
                .filter((booking) => booking && booking._id)
                .reverse()
                .map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {booking.date || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {booking.time || "N/A"}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAdminBookingStatusColor(
                            booking.status
                          )}`}
                        >
                          {getAdminBookingStatusText(booking.status)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Client:</span>
                        <div className="text-right flex items-center">
                          {booking.client?.profilePicture && (
                            <img
                              src={booking.client.profilePicture}
                              alt={booking.client.name || "Client"}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          )}
                          <div className="text-xs font-medium text-gray-900">
                            {booking.client?.name || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          Therapist:
                        </span>
                        <div className="text-right flex items-center">
                          {booking.therapist?.profilePicture && (
                            <img
                              src={booking.therapist.profilePicture}
                              alt={booking.therapist.name || "Therapist"}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          )}
                          <div className="text-xs font-medium text-gray-900">
                            {booking.therapist?.name || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          Session Type:
                        </span>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`${getAdminSessionTypeColor(
                              booking.sessionType
                            )}`}
                          >
                            {getSessionTypeIcon(booking.sessionType)}
                          </span>
                          <span
                            className={`text-xs font-medium ${getAdminSessionTypeColor(
                              booking.sessionType
                            )}`}
                          >
                            {getAdminSessionTypeText(booking.sessionType)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openReschedule(booking._id)}
                        className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 inline-flex items-center gap-1"
                        disabled={
                          rescheduling ||
                          cancelling ||
                          booking.status === "cancelled"
                        }
                      >
                        <CalendarClock className="w-4 h-4" /> Reschedule
                      </button>
                      <button
                        onClick={() => openCancel(booking._id)}
                        className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded hover:bg-rose-50 inline-flex items-center gap-1"
                        disabled={
                          rescheduling ||
                          cancelling ||
                          booking.status === "cancelled"
                        }
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Therapist
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session Type
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings
                    .filter((booking) => booking && booking._id)
                    .reverse()
                    .map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.date || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.time || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {booking.client?.profilePicture && (
                              <img
                                src={booking.client.profilePicture}
                                alt={booking.client.name || "Client"}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {booking.client?.name || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {booking.therapist?.profilePicture && (
                              <img
                                src={booking.therapist.profilePicture}
                                alt={booking.therapist.name || "Therapist"}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {booking.therapist?.name || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`${getAdminSessionTypeColor(
                                booking.sessionType
                              )}`}
                            >
                              {getSessionTypeIcon(booking.sessionType)}
                            </span>
                            <span
                              className={`text-sm font-medium ${getAdminSessionTypeColor(
                                booking.sessionType
                              )}`}
                            >
                              {getAdminSessionTypeText(booking.sessionType)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getAdminBookingStatusColor(
                              booking.status
                            )}`}
                          >
                            {getAdminBookingStatusText(booking.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openReschedule(booking._id)}
                              className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 inline-flex items-center gap-1"
                              disabled={
                                rescheduling ||
                                cancelling ||
                                booking.status === "cancelled"
                              }
                              title="Reschedule booking"
                            >
                              <CalendarClock className="w-4 h-4" /> Reschedule
                            </button>
                            <button
                              onClick={() => openCancel(booking._id)}
                              className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded hover:bg-rose-50 inline-flex items-center gap-1"
                              disabled={
                                rescheduling ||
                                cancelling ||
                                booking.status === "cancelled"
                              }
                              title="Cancel booking"
                            >
                              <X className="w-4 h-4" /> Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {cancelOpen && (
        <div className="fixed inset-0 z-500 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCancelOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Cancel booking</h3>
              <button
                onClick={() => setCancelOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot
              be undone and the parties will be notified.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelOpen(false)}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Keep booking
              </button>
              <button
                onClick={() => {
                  if (!activeCancelId) return;
                  cancelBooking(activeCancelId);
                }}
                className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      {rescheduleOpen && (
        <div className="fixed inset-0 z-500 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setRescheduleOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Reschedule booking</h3>
              <button
                onClick={() => setRescheduleOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) =>
                    setRescheduleForm((s) => ({ ...s, date: e.target.value }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={rescheduleForm.startTime}
                    onChange={(e) =>
                      setRescheduleForm((s) => ({
                        ...s,
                        startTime: e.target.value,
                      }))
                    }
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={rescheduleForm.endTime}
                    onChange={(e) =>
                      setRescheduleForm((s) => ({
                        ...s,
                        endTime: e.target.value,
                      }))
                    }
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRescheduleOpen(false)}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (!activeBookingId) return;
                  if (
                    !rescheduleForm.date ||
                    !rescheduleForm.startTime ||
                    !rescheduleForm.endTime
                  ) {
                    toast.error("Please fill date, start and end time");
                    return;
                  }
                  rescheduleBooking({
                    bookingId: activeBookingId,
                    date: rescheduleForm.date,
                    startTime: rescheduleForm.startTime,
                    endTime: rescheduleForm.endTime,
                  });
                }}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={rescheduling}
              >
                {rescheduling ? "Rescheduling…" : "Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalBookings > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-sm text-gray-500 text-center sm:text-left">
            Showing{" "}
            {Math.min(
              (currentPage - 1) * (filters.limit || ITEMS_PER_PAGE) + 1,
              totalBookings
            )}{" "}
            to{" "}
            {Math.min(
              currentPage * (filters.limit || ITEMS_PER_PAGE),
              totalBookings
            )}{" "}
            of {totalBookings} results
          </div>

          <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            <div className="flex space-x-1">
              {/* Show first page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-1 sm:px-2 py-1 text-xs sm:text-sm">
                      ...
                    </span>
                  )}
                </>
              )}

              {/* Show current page and surrounding pages */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = Math.max(
                  1,
                  Math.min(currentPage - 1 + i, totalPages - 2 + i + 1)
                );
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded ${
                      pageNum === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Show last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-1 sm:px-2 py-1 text-xs sm:text-sm">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsTable;
