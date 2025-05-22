import React, { useState } from 'react';
import MeetingPreferenceStep from '../../components/ScheduleSetup/MeetingPreferenceStep';
import DateTimeStep from '../../components/ScheduleSetup/DateTimeStep';
import PricingStep from '../../components/ScheduleSetup/PricingStep';
import { MeetingPreference } from '../../components/ScheduleSetup/schedule.types';

const MySchedule: React.FC = () => {
  const [step, setStep] = useState(1);

  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference | null>(null);
  const [dateTime, setDateTime] = useState('');
  const [pricing, setPricing] = useState({ inPerson: 0, video: 0 });

  
  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  return (
    <div className=" bg-white py-8 px-6">
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
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 3 && (
        <PricingStep
          pricing={pricing}
          onChange={setPricing}
          onSubmit={() => {
            console.log('Saving data...', {
              meetingPreference,
              dateTime,
              pricing,
            });
            
          }}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default MySchedule;
