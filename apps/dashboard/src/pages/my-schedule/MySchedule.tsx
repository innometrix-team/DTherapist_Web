import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import MeetingPreferenceStep from "../../components/ScheduleSetup/MeetingPreferenceStep";
import DateTimeStep from "../../components/ScheduleSetup/DateTimeStep";
import PricingStep from "../../components/ScheduleSetup/PricingStep";
import ViewEditSchedule from "../../components/ScheduleSetup/ViewEditSchedule";
import { MeetingPreference } from "../../components/ScheduleSetup/schedule.types";
import { IScheduleRequestData } from "../../api/Schedule.api";
import { getAllTherapistSchedulesApi, IScheduleItem } from "../../api/TherapistSchedule.api";
import { getTherapistDetailsApi, ITherapist } from "../../api/Therapist.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

interface Slot {
  startTime: string;
  endTime: string;
  mode: string;
  teamBooking: boolean;
}

interface PricingValues {
  inPerson: number | undefined;
  video: number | undefined;
  group: number | undefined;
}

const days = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const getMeetingPreferenceFromSchedule = (schedules: IScheduleItem[]): MeetingPreference => {
  const hasInPerson = schedules.some((schedule) => schedule.meetingType === "in-person");
  const hasVideo = schedules.some((schedule) => schedule.meetingType === "video");
  const hasGroup = schedules.some((schedule) => schedule.teamBooking === true);

  if (hasInPerson && hasVideo) return "Both";
  if (hasGroup && !hasInPerson) return "Team Session";
  if (hasVideo) return "Video Session";
  return "In-person";
};

const buildDateTimeFromSchedule = (schedules: IScheduleItem[]): string => {
  const dayMap = days.map((day) => {
    const schedule = schedules.find((item) => item.day === day);
    if (!schedule) return [];

    return schedule.slots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      mode: schedule.meetingType === "in-person" ? "in-person" : schedule.teamBooking ? "group" : "video",
      teamBooking: schedule.teamBooking,
    }));
  });

  return JSON.stringify(dayMap);
};

const getPricingFromCost = (cost: ITherapist["cost"]): PricingValues => {
  if (typeof cost === "number") {
    return {
      inPerson: cost > 0 ? cost : undefined,
      video: cost > 0 ? cost : undefined,
      group: undefined,
    };
  }

  if (!cost || typeof cost !== "object") {
    return {
      inPerson: undefined,
      video: undefined,
      group: undefined,
    };
  }

  return {
    inPerson: cost.inPerson > 0 ? cost.inPerson : undefined,
    video: cost.video > 0 ? cost.video : undefined,
    group: cost.groupVideo > 0 ? cost.groupVideo : undefined,
  };
};

const hasAnyPricingValue = (pricing: PricingValues) =>
  pricing.inPerson !== undefined ||
  pricing.video !== undefined ||
  pricing.group !== undefined;

const MySchedule: React.FC = () => {
  const authId = useAuthStore((state) => state.id);
  const { data: scheduleResponse } = useQuery({
    queryKey: ["therapistSchedules", authId],
    queryFn: async () => {
      if (!authId) return [] as IScheduleItem[];
      const result = await getAllTherapistSchedulesApi(authId);
      return result?.data?.schedules || [];
    },
    enabled: !!authId,
  });
  const { data: therapistDetailsResponse } = useQuery({
    queryKey: ["therapistDetails", authId],
    queryFn: async () => {
      if (!authId) return null;
      const result = await getTherapistDetailsApi(authId);
      return result?.data?.therapist ?? null;
    },
    enabled: !!authId,
  });

  const [step, setStep] = useState<"menu" | "create" | "view" | "pricing">("menu");
  const [createStep, setCreateStep] = useState(1);

  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference | null>(null);
  const [dateTime, setDateTime] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("West African Time (WAT)");
  const [pricing, setPricing] = useState<PricingValues>({
    inPerson: undefined,
    video: undefined,
    group: undefined,
  });
  const didHydratePricingRef = useRef(false);

  const scheduleItems = (scheduleResponse || []).filter(
    (schedule) => schedule.isAvailable && schedule.slots.length > 0
  );

  useEffect(() => {
    if (!scheduleItems.length || meetingPreference !== null || dateTime) return;

    setMeetingPreference(getMeetingPreferenceFromSchedule(scheduleItems));
    setDateTime(buildDateTimeFromSchedule(scheduleItems));
    setSelectedTimeZone(scheduleItems[0]?.timezone || "West African Time (WAT)");
  }, [scheduleItems, meetingPreference, dateTime]);

  useEffect(() => {
    if (didHydratePricingRef.current || !therapistDetailsResponse?.cost) return;

    setPricing((currentPricing) => {
      if (hasAnyPricingValue(currentPricing)) return currentPricing;

      didHydratePricingRef.current = true;
      return getPricingFromCost(therapistDetailsResponse.cost);
    });
  }, [therapistDetailsResponse]);

  const handleCreateNext = () => setCreateStep((p) => p + 1);
  const handleCreateBack = () => {
    if (createStep === 1) {
      setStep("menu");
      setCreateStep(1);
    } else {
      setCreateStep((p) => p - 1);
    }
  };

  const handleBackToMenu = () => {
    setStep("menu");
    setCreateStep(1);
  };

  const transformScheduleData = (): IScheduleRequestData[] => {
    try {
      const availability: Slot[][] = dateTime
        ? JSON.parse(dateTime)
        : Array(7).fill([]);

      return availability.flatMap((daySlots, index) => {
        if (daySlots.length === 0) return [];

        const firstMode = daySlots[0].mode;
        let meetingType = "video";
        if (firstMode === "in-person") meetingType = "in-person";
        else if (firstMode === "group") meetingType = "video";
        else if (firstMode === "video") meetingType = "video";
        else if (firstMode === "both") meetingType = "both";
        else if (meetingPreference === "In-person") meetingType = "in-person";
        else if (meetingPreference === "Team Session") meetingType = "video";
        else if (meetingPreference === "Both") meetingType = "both";

        return [
          {
            day: days[index],
            meetingType,
            timezone: selectedTimeZone,
            isAvailable: true,
            teamBooking: daySlots.some((s) => s.teamBooking),
            slots: daySlots.map(({ startTime, endTime }) => ({ startTime, endTime })),
          },
        ];
      });
    } catch {
      return [];
    }
  };

  const handleScheduleReset = () => {
    setMeetingPreference(null);
    setDateTime("");
    setSelectedTimeZone("West African Time (WAT)");
    setPricing({ inPerson: undefined, video: undefined, group: undefined });
    didHydratePricingRef.current = false;
    setCreateStep(1);
  };

  const handlePricingSuccess = () => {
    toast.success("Setup complete! Schedule and pricing saved.");
    handleScheduleReset();
    setStep("menu");
  };

  const stepLabels = ["Session Type", "Availability", "Pricing"];

  return (
    <div className="bg-white min-h-screen">
      {step === "menu" && (
        <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Manage Your Schedule</h1>
              <p className="text-lg text-gray-600">
                Create a new schedule or view and edit your existing availability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => { setStep("create"); setCreateStep(1); }}
                className="bg-white border-2 border-blue-200 rounded-xl p-8 hover:shadow-lg hover:border-primary transition text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <svg className="w-12 h-12 text-primary group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="px-3 py-1 bg-blue-100 text-primary text-xs font-semibold rounded-full">New</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Schedule</h3>
                <p className="text-gray-600 mb-4">Set up your availability and pricing from scratch</p>
                <span className="text-primary font-semibold flex items-center gap-2">
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => setStep("view")}
                className="bg-white border-2 border-blue-200 rounded-xl p-8 hover:shadow-lg hover:border-primary transition text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <svg className="w-12 h-12 text-primary group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="px-3 py-1 bg-green-100 text-primary text-xs font-semibold rounded-full">Manage</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">View &amp; Edit</h3>
                <p className="text-gray-600 mb-4">Update or modify your existing schedule</p>
                <span className="text-primary font-semibold flex items-center gap-2">
                  View Schedule
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => setStep("pricing")}
                className="bg-white border-2 border-blue-200 rounded-xl p-8 hover:shadow-lg hover:border-primary transition text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <svg className="w-12 h-12 text-primary group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="px-3 py-1 bg-purple-100 text-primary text-xs font-semibold rounded-full">Pricing</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Update Pricing</h3>
                <p className="text-gray-600 mb-4">Adjust your session rates independently</p>
                <span className="text-primary font-semibold flex items-center gap-2">
                  Edit Pricing
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "create" && (
        <>
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="max-w-5xl mx-auto flex items-center gap-2">
              {stepLabels.map((label, i) => {
                const stepNum = i + 1;
                const isActive = createStep === stepNum;
                const isDone = createStep > stepNum;
                return (
                  <React.Fragment key={label}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isDone
                            ? "bg-green-500 text-white"
                            : isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isDone ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          stepNum
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium hidden sm:inline ${
                          isActive ? "text-blue-600" : isDone ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div className={`flex-1 h-0.5 rounded transition-colors ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {createStep === 1 && (
            <MeetingPreferenceStep
              value={meetingPreference as MeetingPreference}
              onChange={setMeetingPreference}
              onNext={handleCreateNext}
              onBack={handleBackToMenu}
            />
          )}

          {createStep === 2 && (
            <DateTimeStep
              value={dateTime}
              onChange={setDateTime}
              meetingPreference={meetingPreference as MeetingPreference}
              selectedTimeZone={selectedTimeZone}
              onTimeZoneChange={setSelectedTimeZone}
              scheduleData={transformScheduleData()}
              onNext={handleCreateNext}
              onBack={handleCreateBack}
              onReset={handleScheduleReset}
            />
          )}

          {createStep === 3 && (
            <PricingStep
              pricing={pricing}
              onPricingChange={setPricing}
              meetingPreference={meetingPreference as MeetingPreference}
              onBack={handleCreateBack}
              onSuccess={handlePricingSuccess}
            />
          )}
        </>
      )}

      {step === "view" && (
        <ViewEditSchedule
          therapistId={authId || undefined}
          onBack={handleBackToMenu}
          onEdit={() => { setStep("create"); setCreateStep(1); }}
        />
      )}

      {step === "pricing" && (
        <PricingStep
          pricing={pricing}
          onPricingChange={setPricing}
          meetingPreference={(meetingPreference ?? "Video Session") as MeetingPreference}
          onBack={handleBackToMenu}
          onSuccess={() => {
            toast.success("Pricing updated!");
          }}
        />
      )}
    </div>
  );
};

export default MySchedule;
