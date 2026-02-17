import React, { useState } from "react";
import toast from "react-hot-toast";
import MeetingPreferenceStep from "../../components/ScheduleSetup/MeetingPreferenceStep";
import DateTimeStep from "../../components/ScheduleSetup/DateTimeStep";
import PricingStep from "../../components/ScheduleSetup/PricingStep";
import ViewEditSchedule from "../../components/ScheduleSetup/ViewEditSchedule";
import { MeetingPreference } from "../../components/ScheduleSetup/schedule.types";
import { IScheduleRequestData } from "../../api/Schedule.api";

interface Slot {
  startTime: string;
  endTime: string;
  mode: string;
  allowGroupBooking: boolean;
}

const days = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const MySchedule: React.FC = () => {
  const [step, setStep] = useState<"menu" | "create" | "view" | "pricing">("menu");
  const [createStep, setCreateStep] = useState(1);

  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference | null>(null);
  const [dateTime, setDateTime] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("West African Time (WAT)");
  const [pricing, setPricing] = useState({ inPerson: 0, video: 0, group: 0 });


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

  // ── schedule data transform ──────────────────────────────────────────────

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
        else if (firstMode === "group") meetingType = "group";
        else if (firstMode === "video") meetingType = "video";
        else if (meetingPreference === "In-person") meetingType = "in-person";
        else if (meetingPreference === "Team Session") meetingType = "group";

        return [
          {
            day: days[index],
            meetingType,
            timezone: selectedTimeZone,
            isAvailable: true,
            allowGroupBooking: daySlots.some((s) => s.allowGroupBooking),
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
    setPricing({ inPerson: 0, video: 0, group: 0 });
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

      {/* ── Menu ── */}
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
                className="bg-white border-2 border-blue-200 rounded-xl p-8 hover:shadow-lg hover:border-blue-400 transition text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <svg className="w-12 h-12 text-blue-600 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">New</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Schedule</h3>
                <p className="text-gray-600 mb-4">Set up your availability and pricing from scratch</p>
                <span className="text-blue-600 font-semibold flex items-center gap-2">
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => setStep("view")}
                className="bg-white border-2 border-green-200 rounded-xl p-8 hover:shadow-lg hover:border-green-400 transition text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <svg className="w-12 h-12 text-green-600 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Manage</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">View &amp; Edit</h3>
                <p className="text-gray-600 mb-4">Update or modify your existing schedule</p>
                <span className="text-green-600 font-semibold flex items-center gap-2">
                  View Schedule
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => setStep("pricing")}
                className="bg-white border-2 border-purple-200 rounded-xl p-8 hover:shadow-lg hover:border-purple-400 transition text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <svg className="w-12 h-12 text-purple-600 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Pricing</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Update Pricing</h3>
                <p className="text-gray-600 mb-4">Adjust your session rates independently</p>
                <span className="text-purple-600 font-semibold flex items-center gap-2">
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

      {/* ── Create flow ── */}
      {step === "create" && (
        <>
          {/* Progress bar */}
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

          {/* Step 1 – Meeting preference */}
          {createStep === 1 && (
            <MeetingPreferenceStep
              value={meetingPreference as MeetingPreference}
              onChange={setMeetingPreference}
              onNext={handleCreateNext}
              onBack={handleBackToMenu}
            />
          )}

          {/* Step 2 – Availability / DateTimeStep (no pricing) */}
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

          {/* Step 3 – Pricing */}
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

      {/* ── View / Edit ── */}
      {step === "view" && (
        <ViewEditSchedule
          therapistId="current-user-id"
          onBack={handleBackToMenu}
          onEdit={() => { setStep("create"); setCreateStep(1); }}
        />
      )}

      {/* ── Pricing only ── */}
      {step === "pricing" && (
        <PricingStep
          pricing={pricing}
          onPricingChange={setPricing}
          meetingPreference={meetingPreference as MeetingPreference}
          onBack={handleBackToMenu}
          onSuccess={() => {
            toast.success("Pricing updated!");
            handleBackToMenu();
          }}
        />
      )}
    </div>
  );
};

export default MySchedule;