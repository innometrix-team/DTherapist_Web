import React, { useState, useCallback, useMemo, JSX } from "react";
import { SessionType } from "./types";
import {
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTherapistDetailsApi } from "../../api/Therapist.api";
import createBookingApi, {
  createGroupBookingApi,
  IBookingRequest,
  IGroupBookingRequest,
} from "../../api/Booking.api";
import {
  getTherapistScheduleApi,
  ITimeSlot,
} from "../../api/TherapistSchedule.api";
import toast from "react-hot-toast";

interface BookingSessionProps {
  therapistId: string;
  sessionType: SessionType;
  onBack: () => void;
}

const BookingSession: React.FC<BookingSessionProps> = ({
  therapistId,
  sessionType,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group booking state
  const [groupEmails, setGroupEmails] = useState<string[]>([""]);

  // For the schedule API: group sessions are still video calls
  const scheduleApiSessionType =
    sessionType === "physical" ? "physical" : "video";

  // For the booking API session type label
  const bookingApiSessionType =
    sessionType === "physical" ? "in-person" : "video";

  const isGroupSession = sessionType === "group";

  // Fetch therapist details
  const {
    data: therapistResponse,
    isLoading: therapistLoading,
    error: therapistError,
  } = useQuery({
    queryKey: ["therapist", therapistId],
    queryFn: async () => {
      const result = await getTherapistDetailsApi(therapistId);
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch therapist schedule
  const {
    data: scheduleResponse,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useQuery({
    queryKey: ["therapist-schedule", therapistId, scheduleApiSessionType],
    queryFn: async () => {
      const result = await getTherapistScheduleApi(
        therapistId,
        scheduleApiSessionType,
      );
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Helper function to get cost based on session type
  const getCostForSessionType = (
    cost:
      | { video: number; inPerson: number; groupVideo: number }
      | number
      | null,
    sessionType: SessionType,
  ): number => {
    if (typeof cost === "number") return cost;
    if (typeof cost === "object" && cost !== null) {
      if (sessionType === "physical") return cost.inPerson || 0;
      if (sessionType === "group") return cost.groupVideo || 0;
      return cost.video || 0;
    }
    return 0;
  };

  // Individual booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: IBookingRequest) => {
      const result = await createBookingApi(bookingData);
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Booking created successfully");
      if (data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        setTimeout(() => onBack(), 2000);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create booking");
    },
  });

  // Group booking mutation
  const groupBookingMutation = useMutation({
    mutationFn: async (bookingData: IGroupBookingRequest) => {
      const result = await createGroupBookingApi(bookingData);
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    onSuccess: () => {
      toast.success("Group session booked successfully!");
      setTimeout(() => onBack(), 2000);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create group booking omo");
    },
  });

  const isPending = bookingMutation.isPending || groupBookingMutation.isPending;

  const therapist = therapistResponse?.data?.therapist;
  const sessionCost = therapist
    ? getCostForSessionType(therapist.cost, sessionType)
    : 0;

  // --- Email helpers ---
  const addEmail = () => {
    setGroupEmails((prev) => [...prev, ""]);
  };

  const removeEmail = (index: number) => {
    setGroupEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    setGroupEmails((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const validGroupEmails = groupEmails
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  // --- Calendar logic ---
  const getDatesForDayInCurrentMonth = useCallback(
    (dayName: string, month: Date): Date[] => {
      const dates: Date[] = [];
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const dayMap: { [key: string]: number } = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
      const targetDay = dayMap[dayName];
      if (targetDay === undefined) return dates;

      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);

      const date = new Date(firstDay);
      while (date.getDay() !== targetDay) {
        date.setDate(date.getDate() + 1);
      }
      while (date <= lastDay) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 7);
      }
      return dates;
    },
    [],
  );

  const availableDatesMap = useMemo(() => {
    const map = new Map<string, ITimeSlot[]>();
    const schedules = scheduleResponse?.data?.schedules || [];

    schedules.forEach((scheduleItem) => {
      const scheduleMeetingType =
        scheduleItem.meetingType === "in-person" ? "physical" : "video";

      // For group sessions, filter only schedules where allowGroupBooking is true
      const passesGroupCheck = isGroupSession
        ? scheduleItem.allowGroupBooking === true
        : true;

      if (
        scheduleItem.isAvailable &&
        scheduleMeetingType === scheduleApiSessionType &&
        passesGroupCheck
      ) {
        const dates = getDatesForDayInCurrentMonth(
          scheduleItem.day,
          currentMonth,
        );
        dates.forEach((date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date >= today) {
            map.set(dateStr, scheduleItem.slots);
          }
        });
      }
    });

    return map;
  }, [
    scheduleResponse?.data?.schedules,
    scheduleApiSessionType,
    currentMonth,
    getDatesForDayInCurrentMonth,
    isGroupSession,
  ]);

  const generateCalendarDays = useCallback((): (number | null)[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = (firstDayOfMonth.getDay() + 6) % 7;
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  }, [currentMonth]);

  const calendarDays = generateCalendarDays();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const formatDateToString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const isDateAvailable = (day: number): boolean => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    return availableDatesMap.has(formatDateToString(date));
  };

  const handleDateSelect = (day: number): void => {
    const selectedDateObj = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDateObj < today) {
      toast.error("Cannot select past dates");
      return;
    }
    const formattedDate = formatDateToString(selectedDateObj);
    if (!availableDatesMap.has(formattedDate)) {
      toast.error("This date is not available");
      return;
    }
    setSelectedDate(formattedDate);
    setSelectedTime("");
  };

  const handlePrevMonth = (): void => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1),
    );
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleNextMonth = (): void => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1),
    );
    setSelectedDate("");
    setSelectedTime("");
  };

  const handlePayment = async (): Promise<void> => {
    if (!therapist || !selectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const endTime = `${String(hours + 1).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}`;

    if (isGroupSession) {
      if (validGroupEmails.length === 0) {
        toast.error("Please add at least one participant email");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmail = validGroupEmails.find((e) => !emailRegex.test(e));
      if (invalidEmail) {
        toast.error(`Invalid email address: ${invalidEmail}`);
        return;
      }

      const groupBookingData: IGroupBookingRequest = {
        therapistId,
        sessionType: "video", // group is always routed as video
        date: selectedDate,
        startTime: selectedTime,
        endTime,
        groupClientEmails: validGroupEmails,
      };
      groupBookingMutation.mutate(groupBookingData);
    } else {
      const bookingData: IBookingRequest = {
        therapistId,
        sessionType: bookingApiSessionType as "video" | "in-person",
        date: selectedDate,
        startTime: selectedTime,
        endTime,
        price: sessionCost,
      };
      bookingMutation.mutate(bookingData);
    }
  };

  const renderStars = (rating: number | null): JSX.Element[] => {
    const validRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < validRating ? "text-yellow-400" : "text-gray-300"}`}
      >
        ★
      </span>
    ));
  };

  const getAvailableTimesForDate = (): ITimeSlot[] => {
    if (!selectedDate || !availableDatesMap.has(selectedDate)) return [];
    return availableDatesMap.get(selectedDate) || [];
  };

  const availableTimes = getAvailableTimesForDate();

  const isToday = (day: number): boolean => {
    const today = new Date();
    const dayDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    return dayDate.toDateString() === today.toDateString();
  };

  const isPastDate = (day: number): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < today
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const sessionLabel =
    sessionType === "video"
      ? "Video Call"
      : sessionType === "physical"
        ? "Physical Meeting"
        : "Team Meeting";

  if (therapistLoading || scheduleLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">
            {therapistLoading
              ? "Loading therapist details..."
              : "Loading availability..."}
          </span>
        </div>
      </div>
    );
  }

  if (therapistError || scheduleError || !therapist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {therapistError
              ? "Failed to load therapist"
              : scheduleError
                ? "Failed to load availability"
                : "Therapist not found"}
          </h2>
          <button
            onClick={onBack}
            className="text-primary hover:text-blue-800 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const reviewCount =
    therapist.reviews.totalReviews || therapist.reviews.count || 0;

  const canProceed =
    !!selectedDate &&
    !!selectedTime &&
    !isPending &&
    (!isGroupSession || validGroupEmails.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between m-6 sm:mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Book {sessionLabel} Session
            </h1>
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 m-6">
            {/* Left Column - Therapist Info */}
            <div className="space-y-6 sm:space-y-8">
              {/* Therapist Card */}
              <div className="flex items-start space-x-4">
                <img
                  src={
                    therapist.profilePicture ||
                    "https://placehold.net/avatar-4.png"
                  }
                  alt={therapist.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src !== "https://placehold.net/avatar-4.png") {
                      img.src = "https://placehold.net/avatar-4.png";
                    }
                  }}
                />
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {therapist.name}
                  </h2>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-600">
                      ({reviewCount} Reviews)
                    </span>
                    <div className="flex">
                      {renderStars(therapist.reviews.averageRating)}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-1">{therapist.category}</p>
                  <p className="text-gray-700 mb-2">
                    {therapist.experience} years experience
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    ₦{sessionCost}.00/hr
                  </p>
                  
                </div>
              </div>

              {/* About Section */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                  About Counselor
                </h3>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    {therapist.about ||
                      `${therapist.name} is a licensed professional counselor specializing in ${therapist.category}. With ${therapist.experience} years of experience, they provide comprehensive support and guidance to help clients achieve their mental health goals.`}
                  </p>
                  {therapist.specializations &&
                    therapist.specializations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Specializations:
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {therapist.specializations.map((spec, index) => (
                            <li key={index}>{spec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>

              {/* Group Participants Section */}
              {isGroupSession && (
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    Invite Participants
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add the email addresses of people you want to join this team
                    session.
                  </p>
                  <div className="space-y-3">
                    {groupEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          placeholder={`Participant ${index + 1} email`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          disabled={isPending}
                        />
                        {groupEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            disabled={isPending}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEmail}
                      disabled={isPending}
                      className="flex items-center gap-2 text-primary hover:text-blue-800 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add another participant
                    </button>
                  </div>
                  {validGroupEmails.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      {validGroupEmails.length} participant
                      {validGroupEmails.length > 1 ? "s" : ""} will be invited
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Date & Time */}
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Select Date & Time
              </h3>

              {/* Calendar */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                  </h4>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs sm:text-sm font-semibold text-gray-700 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <div key={index} className="aspect-square">
                      {day && (
                        <button
                          onClick={() => handleDateSelect(day)}
                          disabled={isPastDate(day) || !isDateAvailable(day)}
                          className={`w-full h-full flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                            isPastDate(day) || !isDateAvailable(day)
                              ? "text-gray-300 cursor-not-allowed"
                              : isToday(day)
                                ? "bg-success text-white"
                                : selectedDate ===
                                    formatDateToString(
                                      new Date(
                                        currentMonth.getFullYear(),
                                        currentMonth.getMonth(),
                                        day,
                                      ),
                                    )
                                  ? "bg-primary text-white"
                                  : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>

              {/* Available Times */}
              {selectedDate && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Available Times for{" "}
                    {(() => {
                      const [year, month, day] = selectedDate.split("-");
                      return `${day}/${month}/${year}`;
                    })()}
                  </h4>
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {availableTimes.map((timeSlot) => (
                        <button
                          key={timeSlot._id}
                          onClick={() => setSelectedTime(timeSlot.startTime)}
                          className={`p-2 sm:p-3 text-sm font-medium border rounded-lg transition-colors ${
                            selectedTime === timeSlot.startTime
                              ? "bg-primary text-white border-primary"
                              : "border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700"
                          }`}
                        >
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No available times for this date
                    </p>
                  )}
                </div>
              )}

              {/* Payment - Mobile */}
              <div className="lg:hidden">
                {!isGroupSession && (
                  <div className="flex justify-between items-center mb-4 text-lg sm:text-xl font-bold">
                    <span>Total:</span>
                    <span>₦{sessionCost}.00</span>
                  </div>
                )}
                <button
                  onClick={handlePayment}
                  disabled={!canProceed}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-3 sm:py-4 rounded-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>
                        {isGroupSession
                          ? "Book Team Session"
                          : "Proceed to Make Payment"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Payment - Desktop */}
              <div className="hidden lg:block pt-6 border-t border-gray-200">
                {!isGroupSession && (
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-bold text-gray-900">
                      Total:
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₦{sessionCost}.00
                    </span>
                  </div>
                )}
                <button
                  onClick={handlePayment}
                  disabled={!canProceed}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>
                        {isGroupSession
                          ? "Book Team Session"
                          : "Proceed to Make Payment"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSession;
