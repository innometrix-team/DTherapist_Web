import React, { useState } from 'react';
import toast from 'react-hot-toast';
import MeetingPreferenceStep from '../../components/ScheduleSetup/MeetingPreferenceStep';
import DateTimeStep from '../../components/ScheduleSetup/DateTimeStep';
import ViewEditSchedule from '../../components/ScheduleSetup/ViewEditSchedule';
import { MeetingPreference } from '../../components/ScheduleSetup/schedule.types';
import { IScheduleRequestData } from '../../api/Schedule.api';

interface Slot {
  startTime: string;
  endTime: string;
  mode: string;
}

const MySchedule: React.FC = () => {
  const [step, setStep] = useState<"menu" | "create" | "view">("menu");
  const [createStep, setCreateStep] = useState(1);

  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference | null>(null);
  const [dateTime, setDateTime] = useState('');
  const [selectedTimeZone, setSelectedTimeZone] = useState("West African Time (WAT)");
  const [pricing, setPricing] = useState({ inPerson: 0, video: 0, group: 0 });

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const handleCreateNext = () => setCreateStep((prev) => prev + 1);
  const handleCreateBack = () => setCreateStep((prev) => prev - 1);

  const handleBackToMenu = () => {
    setStep("menu");
    setCreateStep(1);
  };

  // Transform availability data to API format
  const transformScheduleData = (): IScheduleRequestData[] => {
    try {
      const availability: Slot[][] = dateTime ? JSON.parse(dateTime) : Array(7).fill([]);
      
      // Only include days that have availability (non-empty slots)
      const scheduleData: IScheduleRequestData[] = [];
      
      availability.forEach((daySlots, index) => {
        const isAvailable = daySlots.length > 0;
        
        // Only add days that have at least one time slot
        if (isAvailable) {
          // Determine meeting type based on slots or default to meeting preference
          let meetingType = 'video'; // default
          
          const firstSlotMode = daySlots[0].mode;
          switch (firstSlotMode) {
            case 'video':
              meetingType = 'video';
              break;
            case 'in-person':
              meetingType = 'in-person';
              break;
            case 'group':
              meetingType = 'group';
              break;
            case 'both':
              meetingType = 'video'; // Default to video when both are selected
              break;
            default:
              // Fallback to meeting preference
              if (meetingPreference === 'Video Session') {
                meetingType = 'video';
              } else if (meetingPreference === 'In-person') {
                meetingType = 'in-person';
              } else if (meetingPreference === 'Team Session') {
                meetingType = 'group';
              } else {
                meetingType = 'video';
              }
          }

          scheduleData.push({
            day: days[index],
            meetingType,
            timezone: selectedTimeZone,
            isAvailable: true,
            slots: daySlots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime
            }))
          });
        }
      });

      return scheduleData;
    } catch (error) {
      console.error('Error transforming schedule data:', error);
      // Return empty array instead of default days
      return [];
    }
  };

  const handleScheduleSuccess = () => {
    toast.success("Schedule created successfully!");
    setStep("menu");
    setCreateStep(1);
  };

  const handleScheduleReset = () => {
    // Reset all form data
    setMeetingPreference(null);
    setDateTime('');
    setSelectedTimeZone("West African Time (WAT)");
    setPricing({ inPerson: 0, video: 0, group: 0 });
    setCreateStep(1);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Menu Screen */}
      {step === "menu" && (
        <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Manage Your Schedule
              </h1>
              <p className="text-lg text-gray-600">
                Create a new schedule or view and edit your existing availability
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Create New Schedule */}
              <button
                onClick={() => {
                  setStep("create");
                  setCreateStep(1);
                }}
                className="bg-white border-2 border-blue-200 rounded-lg p-8 hover:shadow-lg hover:border-blue-400 transition text-left group"
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

              {/* View/Edit Schedule */}
              <button
                onClick={() => {
                  setStep("view");
                }}
                className="bg-white border-2 border-green-200 rounded-lg p-8 hover:shadow-lg hover:border-green-400 transition text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <svg className="w-12 h-12 text-green-600 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Manage</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">View & Edit</h3>
                <p className="text-gray-600 mb-4">Update or modify your existing schedule</p>
                <span className="text-green-600 font-semibold flex items-center gap-2">
                  View Schedule
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule */}
      {step === "create" && (
        <>
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
              pricing={pricing}
              onPricingChange={setPricing}
              scheduleData={transformScheduleData()}
              onNext={handleCreateNext}
              onBack={handleCreateBack}
              onSuccess={handleScheduleSuccess}
              onReset={handleScheduleReset}
            />
          )}
        </>
      )}

      {/* View/Edit Schedule */}
      {step === "view" && (
        <ViewEditSchedule
          therapistId="current-user-id"
          onBack={handleBackToMenu}
          onEdit={() => {
            setStep("create");
            setCreateStep(1);
          }}
        />
      )}
    </div>
  );
};

export default MySchedule;