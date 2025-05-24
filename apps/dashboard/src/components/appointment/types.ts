
export interface Session {
    id: string;
    clientName: string;
    clientImage: string;
    date: string;
    time: string;
    timeZone: string;
    type: string;

    clientBio: string;
    profession: string;
    experience: string;
    nationality: string;
    price: number;
  
  }
  
  export type TabType = 'upcoming' | 'passed';

  export interface Client {
    id: string;
    name: string;
    occupation: string;
    experience: string;
    nationality: string;
    about: string;
    imageUrl: string;
  }