// types/serviceTypes.ts
export interface ServiceDetail {
  overview: string;
  whatWeOffer?: string[];
  whoCanBenefit?: string[];
  approaches?: string[];
  HowItWorks?: string[];

}

export interface ServiceDetailsMap {
  [key: string]: ServiceDetail;
}

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    icon: React.ReactNode;
    title: string;
    description: string;
  } | null;
}

export interface ServiceFeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}




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
  
  
  