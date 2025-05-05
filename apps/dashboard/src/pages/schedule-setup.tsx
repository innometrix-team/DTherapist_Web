import React, { useState } from 'react';
import MeetingPreferenceStep from '../components/ScheduleSetup/MeetingPreferenceStep';
import AvailabilityStep from '../components/ScheduleSetup/AvailabilityStep';
import DateTimeStep from '../components/ScheduleSetup/DateTimeStep';
import PricingStep from '../components/ScheduleSetup/PricingStep';
import { MeetingPreference } from '../components/ScheduleSetup/schedule.types';

const ScheduleSetupPage: React.FC = () => {
  const [step, setStep] = useState(1);

  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const [dateTime, setDateTime] = useState('');
  const [pricing, setPricing] = useState({ inPerson: 0, video: 0 });

  const handleToggleAvailability = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      {step === 1 && (
        <MeetingPreferenceStep
          value={meetingPreference as MeetingPreference}
          onChange={setMeetingPreference}
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <AvailabilityStep
          selectedDays={availability}
          onChange={handleToggleAvailability}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 3 && (
        <DateTimeStep
          value={dateTime}
          onChange={setDateTime}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 4 && (
        <PricingStep
          pricing={pricing}
          onChange={setPricing}
          onNext={() => {
            console.log('Saving data...', {
              meetingPreference,
              availability,
              dateTime,
              pricing,
            });
            // TODO: Submit data to backend
            alert('Setup complete! (Data logged in console)');
          }}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default ScheduleSetupPage;
