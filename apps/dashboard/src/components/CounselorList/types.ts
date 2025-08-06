export interface Therapist {
  id: string;
  name: string;
  image: string;
  category: string;
  reviews: number;
  rating: number;
  experience: string;
  cost: number;
  about: string;
  availableTimes: string[];
  testimonials: Testimonial[];
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientImage: string;
  rating: number;
  comment: string;
  date: string;
}

export type SessionType = 'video' | 'physical'