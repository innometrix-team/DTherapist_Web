import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getCounselorAppointments,
  getUserAppointments,
  downloadInvoice,
  Appointment,
  UserDashboardData,
} from "../../api/Appointments.api";
import {
  ChevronDownIcon,
  MeetingIcon,
  ChatIcon,
  RescheduleIcon,
  WithdrawIcon,
} from "../../assets/icons";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { getCached, setCache } from "../../utils/AppointmentsCache.utils";
import PostCallReviewModal from "../../components/appointment/Postcallreviewmodal";

interface SessionTableProps {
  type: "upcoming" | "passed";
  onReschedule?: (appointmentId: string) => void;
  onDownloadInvoice?: (appointmentId: string) => void;
}

type FetchState = "idle" | "loading" | "success" | "error";

const SessionTable: React.FC<SessionTableProps> = ({
  type,
  onReschedule,
  onDownloadInvoice,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Review modal state ──────────────────────────────────────────────────
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);

  const navigate = useNavigate();
  const { role } = useAuthStore();
  const isCounselor = role === "counselor";

  const cacheKey = isCounselor ? "counselor-appointments" : "user-appointments";

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const parseAppointments = (data: unknown): Appointment[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as Appointment[];
    const d = data as UserDashboardData & {
      passedAppointments?: Appointment[];
      previousAppointments?: Appointment[];
      allAppointments?: Appointment[];
    };
    const merged = [
      ...(d.upcomingAppointments || []),
      ...(d.passedAppointments || []),
      ...(d.previousAppointments || []),
      ...(d.allAppointments || []),
    ];
    const seen = new Set<string>();
    return merged.filter((appt) => {
      if (!appt?.bookingId || seen.has(appt.bookingId)) return false;
      seen.add(appt.bookingId);
      return true;
    });
  };

  const fetchFromNetwork = useCallback(
    async (background = false) => {
      if (!role) return;
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      if (background) {
        setIsRefreshing(true);
      } else {
        setFetchState("loading");
        setFetchError(null);
      }
      try {
        let result;
        if (isCounselor) {
          result = await getCounselorAppointments({ signal: controller.signal });
        } else {
          result = await getUserAppointments({ signal: controller.signal });
        }
        if (!result) return;
        const parsed = parseAppointments(result.data);
        if (isMountedRef.current && !controller.signal.aborted) {
          setCache(cacheKey, parsed);
          setAllAppointments(parsed);
          setFetchState("success");
        }
      } catch (error: unknown) {
        const isAbort =
          (error as { name?: string })?.name === "AbortError" ||
          (error as { code?: string })?.code === "ERR_CANCELED" ||
          (error as { message?: string })?.message?.includes("canceled") ||
          (error as { message?: string })?.message?.includes("aborted");
        if (isAbort) return;
        if (isMountedRef.current) {
          if (background) {
            toast.error("Could not refresh appointments. Showing last known data.");
          } else {
            const message = error instanceof Error ? error.message : "Failed to load appointments";
            setFetchError(message);
            setFetchState("error");
          }
        }
      } finally {
        if (isMountedRef.current) setIsRefreshing(false);
      }
    },
    [role, isCounselor, cacheKey],
  );

  const loadAppointments = useCallback(
    async (forceRefresh = false) => {
      if (!role) return;
      if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) {
          setAllAppointments(cached);
          setFetchState("success");
          fetchFromNetwork(true);
          return;
        }
      }
      fetchFromNetwork(false);
    },
    [role, cacheKey, fetchFromNetwork],
  );

  useEffect(() => {
    if (role) loadAppointments();
  }, [role, loadAppointments]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
  }, [type]);

  const appointments = allAppointments.filter((appointment) => {
    if (!appointment) return false;
    if (type === "upcoming") {
      return appointment.status === "upcoming" || appointment.status === "confirmed";
    }
    return appointment.status === "passed";
  });

  const toggleDropdown = (appointmentId: string) => {
    setActiveDropdown(activeDropdown === appointmentId ? null : appointmentId);
  };

  // ── Open review modal ────────────────────────────────────────────────────
  const openReviewModal = (appointment: Appointment) => {
    setActiveDropdown(null);
    setReviewAppointment(appointment);
    setReviewModalOpen(true);
  };

  const handleActionClick = async (action: string, appointment: Appointment) => {
    setActiveDropdown(null);

    switch (action) {
      case "startMeeting": {
        const appId = import.meta.env.VITE_AGORA_APP_ID;
        const channel = appointment.action.agoraChannel;
        const token = appointment.action.agoraToken?.token;
        const uid = appointment.action.agoraToken?.uid;
        if (appId && channel && token) {
          navigate(`/video/${appointment.bookingId}`, {
            state: {
              agora: { appId, channel, token, uid: typeof uid === "number" ? uid : 0 },
              appointment,
            },
          });
        } else if (appointment.action?.joinMeetingLink) {
          window.open(appointment.action.joinMeetingLink, "_blank");
        }
        break;
      }
      case "chat":
        navigate(`chat/${appointment.chatId ?? appointment.bookingId}`);
        break;
      case "reschedule":
        onReschedule?.(appointment.bookingId);
        break;
      case "dispute":
        navigate(`/dispute/${appointment.bookingId}`, { state: { appointment } });
        break;
      case "sessionReview":
        openReviewModal(appointment);
        break;
      case "downloadInvoice":
        try {
          setDownloadingInvoice(appointment.bookingId);
          await downloadInvoice(appointment.bookingId);
          toast.success("Invoice downloaded successfully");
          onDownloadInvoice?.(appointment.bookingId);
        } catch (error: unknown) {
          toast.error(error instanceof Error ? error.message : "Failed to download invoice");
        } finally {
          setDownloadingInvoice(null);
        }
        break;
    }
  };

  if (!role) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base">Please log in to view appointments.</div>
      </div>
    );
  }

  if (fetchState === "loading") {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base">Loading {type} appointments...</div>
      </div>
    );
  }

  if (fetchState === "error" && fetchError) {
    return (
      <div className="text-center py-8 px-4 text-red-500">
        <div className="text-sm sm:text-base mb-4">Failed to load appointments</div>
        <div className="text-xs text-gray-600 mb-4">Error: {fetchError}</div>
        <button
          onClick={() => loadAppointments(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (fetchState === "success" && appointments.length === 0) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <div className="text-sm sm:text-base">No {type} appointments to display.</div>
      </div>
    );
  }

  if (appointments.length === 0) return null;

  // ── Flag icon for the review action ─────────────────────────────────────
  const FlagActionIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 21V4m0 0l4-1 4 1 4-1 4 1v13l-4-1-4 1-4-1-4 1V4z" />
    </svg>
  );

  return (
    <>
      {/* Subtle background-refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-end px-2 pb-2">
          <span className="text-xs text-gray-400 animate-pulse">Refreshing...</span>
        </div>
      )}

      {/* ── Desktop Table View ── */}
      <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <tr key={appointment.bookingId} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 lg:px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={appointment.profilePicture || "https://placehold.net/avatar-4.png"}
                      alt={appointment.fullName}
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.net/avatar-4.png"; }}
                    />
                    <div>
                      <span className="font-medium text-sm lg:text-base text-gray-900">{appointment.fullName}</span>
                      <div className="text-xs text-gray-400">Status: {appointment.status}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm lg:text-base whitespace-nowrap text-gray-700">
                  {new Date(appointment.date + "T00:00:00").toLocaleDateString()}
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm lg:text-base whitespace-nowrap text-gray-700">
                  {appointment.time}
                </td>
                <td className="px-3 lg:px-6 py-4">
                  <span className="px-2 lg:px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs lg:text-sm whitespace-nowrap font-medium">
                    {appointment.type}
                  </span>
                </td>
                <td className="px-3 lg:px-6 py-4 text-sm text-gray-500">
                  <div className="relative">
                    <button
                      className="flex items-center space-x-1 px-2 lg:px-3 py-1 text-gray-600 hover:text-gray-900 rounded transition-colors"
                      onClick={() => toggleDropdown(appointment.bookingId)}
                    >
                      <span className="text-xs lg:text-sm">Actions</span>
                      <ChevronDownIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>

                    {activeDropdown === appointment.bookingId && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                        {type === "upcoming" ? (
                          <>
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                              onClick={() => handleActionClick("startMeeting", appointment)}
                            >
                              <MeetingIcon className="w-4 h-4 mr-2" />
                              <span>Start Meeting</span>
                            </button>
                            {appointment.chatId && (
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                                onClick={() => handleActionClick("chat", appointment)}
                              >
                                <ChatIcon className="w-4 h-4 mr-2" />
                                <span>Chat</span>
                              </button>
                            )}
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                              onClick={() => handleActionClick("reschedule", appointment)}
                            >
                              <RescheduleIcon className="w-4 h-4 mr-2" />
                              <span>Reschedule</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleActionClick("downloadInvoice", appointment)}
                              disabled={downloadingInvoice === appointment.bookingId}
                            >
                              <WithdrawIcon className="w-4 h-4 mr-2" />
                              <span>
                                {downloadingInvoice === appointment.bookingId ? "Downloading..." : "Download Invoice"}
                              </span>
                            </button>

                            {/* Session review — counselors only */}
                            {isCounselor && (
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-red-50 transition-colors text-red-600"
                                onClick={() => handleActionClick("sessionReview", appointment)}
                              >
                                <FlagActionIcon className="w-4 h-4 mr-2" />
                                <span>Session Review</span>
                              </button>
                            )}

                            {!isCounselor && (
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-red-50 transition-colors text-red-600"
                                onClick={() => handleActionClick("dispute", appointment)}
                              >
                                <ChatIcon className="w-4 h-4 mr-2" />
                                <span>Dispute</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View ── */}
      <div className="md:hidden space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.bookingId} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={appointment.profilePicture || "https://placehold.net/avatar-4.png"}
                  alt={appointment.fullName}
                  className="w-10 h-10 rounded-full shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.net/avatar-4.png"; }}
                />
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{appointment.fullName}</h3>
                  <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-primary text-xs font-medium mt-1">
                    {appointment.type}
                  </span>
                  <div className="text-xs text-gray-400">Status: {appointment.status}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Date</span>
                <span className="text-gray-900 font-medium">
                  {new Date(appointment.date + "T00:00:00").toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Time</span>
                <span className="text-gray-900 font-medium">{appointment.time}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              {type === "upcoming" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick("startMeeting", appointment)}
                  >
                    <MeetingIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Meeting</span>
                  </button>
                  {appointment.chatId && (
                    <button
                      className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                      onClick={() => handleActionClick("chat", appointment)}
                    >
                      <ChatIcon className="w-4 h-4 mr-1" />
                      <span className="truncate">Chat</span>
                    </button>
                  )}
                  <button
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-800 transition-colors flex-1 min-w-0 justify-center"
                    onClick={() => handleActionClick("reschedule", appointment)}
                  >
                    <RescheduleIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">Reschedule</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="flex items-center justify-center flex-1 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleActionClick("downloadInvoice", appointment)}
                    disabled={downloadingInvoice === appointment.bookingId}
                  >
                    <WithdrawIcon className="w-4 h-4 mr-2" />
                    {downloadingInvoice === appointment.bookingId ? "Downloading..." : "Invoice"}
                  </button>

                  {/* Session review — counselors only */}
                  {isCounselor && (
                    <button
                      className="flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
                      onClick={() => handleActionClick("sessionReview", appointment)}
                    >
                      <FlagActionIcon className="w-4 h-4 mr-2" />
                      Review
                    </button>
                  )}

                  {!isCounselor && (
                    <button
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                      onClick={() => handleActionClick("dispute", appointment)}
                    >
                      <ChatIcon className="w-4 h-4 mr-2" />
                      Dispute
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Post-call review modal (counselor only) ── */}
      <PostCallReviewModal
        isOpen={reviewModalOpen}
        appointment={reviewAppointment}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewAppointment(null);
        }}
      />
    </>
  );
};

export default SessionTable;