import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MeetingPreferenceStep from '../../components/ScheduleSetup/MeetingPreferenceStep';
import DateTimeStep from '../../components/ScheduleSetup/DateTimeStep';
import PricingStep from '../../components/ScheduleSetup/PricingStep';
import { MeetingPreference } from '../../components/ScheduleSetup/schedule.types';
import { IScheduleRequestData } from '../../api/Schedule.api';

interface Slot {
  startTime: string;
  endTime: string;
  mode: string;
}

const MySchedule: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference | null>(null);
  const [dateTime, setDateTime] = useState('');
  const [selectedTimeZone, setSelectedTimeZone] = useState("West African Time (WAT)");
  const [pricing, setPricing] = useState({ inPerson: 0, video: 0 });

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

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
            case 'both':
              meetingType = 'video'; // Default to video when both are selected
              break;
            default:
              // Fallback to meeting preference
              if (meetingPreference === 'Video Session') {
                meetingType = 'video';
              } else if (meetingPreference === 'In-person') {
                meetingType = 'in-person';
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
    
    navigate('/my-schedule'); 
  };

  const handleScheduleReset = () => {
    // Reset all form data
    setMeetingPreference(null);
    setDateTime('');
    setSelectedTimeZone("West African Time (WAT)");
    setPricing({ inPerson: 0, video: 0 });
    setStep(1); // Go back to first step
  };

  return (
    <div className="bg-white py-8 px-6">
      {step === 1 && (
        <MeetingPreferenceStep
          value={meetingPreference as MeetingPreference}
          onChange={setMeetingPreference}
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <DateTimeStep
          value={dateTime}
          onChange={setDateTime}
          meetingPreference={meetingPreference as MeetingPreference}
          selectedTimeZone={selectedTimeZone}
          onTimeZoneChange={setSelectedTimeZone}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 3 && (
        <PricingStep
          pricing={pricing}
          onChange={setPricing}
          scheduleData={transformScheduleData()}
          onBack={handleBack}
          onSuccess={handleScheduleSuccess}
          onReset={handleScheduleReset}
        />
      )}
    </div>
  );
};

export default MySchedule;