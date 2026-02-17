export type MeetingPreference = 'In-person' | 'Video Session' | 'Team Session' | 'Both';

export interface ScheduleSetupData {
  meetingPreference: MeetingPreference;
  availability: string[]; // Days available
  dateTime?: string[];
  pricing?: {
    inPerson: number;
    video: number;
  };
} 