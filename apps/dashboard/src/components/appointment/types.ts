
export interface Session {
    id: string;
    clientName: string;
    clientImage: string;
    date: string;
    time: string;
    timeZone: string;
    type: string;
  }
  
  export type TabType = 'upcoming' | 'passed';