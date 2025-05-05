
export interface Service {
    title: string;
    imageUrl: string;
    description: string;
  }
  
  export interface WelcomeFeature {
    icon: React.ReactNode;
    title: string;
    description: string;
  }
  
  export interface Step {
    icon: React.ReactNode;
    title: string;
    desc: string;
  }

  export interface AboutSectionProps {
    imageUrl: string;
  subtitle: string;
  title: string;
  description: string;
  buttonText?: boolean;
  showDownloadButtons?: boolean;
  iosUrl?: string;
  androidUrl?: string;
  }

  export interface Therapist {
    id: string;
    name: string;
    specialty: string;
    reviews: number;
    stars: number;
    experience: number;
    rate: string;
    image: string;
  }

  export interface Testimonial {
    name: string;
    title: string;
    date: string;
    feedback: string;
    image: string;
    stars: number;
  }

  export interface Faqs{
    question: string;
    answer: string;
  }
  
  
  