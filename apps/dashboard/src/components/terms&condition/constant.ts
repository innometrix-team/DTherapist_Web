import { UserCheck, Users, Shield, Clock, CreditCard, AlertTriangle } from 'lucide-react';

export interface TermsSection {
  id: string;
  title: string;
  icon: any;
  content: string[];
}

export interface TermsData {
  title: string;
  sections: TermsSection[];
}

export const COUNSELOR_TERMS: TermsData = {
  title: "Terms and Conditions for Professional Counselors",
  sections: [
    {
      id: "eligibility",
      title: "Eligibility Requirements",
      icon: UserCheck,
      content: [
        "Hold valid professional licenses and certifications",
        "Have relevant experience in mental health services",
        "Comply with applicable laws and regulations"
      ]
    },
    {
      id: "service",
      title: "Service Provision",
      icon: Shield,
      content: [
        "Offer services solely through DTherapist's official channels",
        "Maintain professional boundaries and confidentiality",
        "Participate in regular training and professional development",
        "Report any suspected security incidents or data breaches",
        "Subject to monitoring and review of interactions by DTherapist"
      ]
    },
    {
      id: "rights",
      title: "Counselor Rights",
      icon: Users,
      content: [
        "Request access, modification, or deletion of personal data",
        "Terminate services with 30-day written notice to DTherapist",
        "Protection under relevant data protection laws and regulations"
      ]
    },
    {
      id: "prohibited",
      title: "Prohibited Conduct",
      icon: AlertTriangle,
      content: [
        "Soliciting or providing services to DTherapist clients outside the platform",
        "Engaging in unprofessional or unethical behaviour",
        "Sharing confidential information"
      ]
    },
    {
      id: "payment",
      title: "Payment Structure",
      icon: CreditCard,
      content: [
        "Counselors receive 65% of the session fee",
        "DTherapist retains 35% of the session fee",
        "Weekly payment schedule",
        "Detailed statements available on counselor dashboard",
        "Payment structure subject to review and adjustment with advance notice"
      ]
    },
    {
      id: "cancellation",
      title: "Cancellation Policy",
      icon: Clock,
      content: [
        "Provide timely notice of cancellations or rescheduling requests",
        "Communicate professionally with clients and DTherapist staff",
        "When cancelling, clients will be offered:",
        "• Rescheduling with the same therapist at no additional cost",
        "• Matching with a different available therapist",
        "• Full refund if other options are not suitable"
      ]
    }
  ]
};

export const CLIENT_TERMS: TermsData = {
  title: "Client Cancellation Policy",
  sections: [
    {
      id: "free-cancellation",
      title: "Free Cancellation Window",
      icon: Clock,
      content: [
        "Cancel or reschedule at no charge with at least 24 hours notice"
      ]
    },
    {
      id: "cancellation-fees",
      title: "Cancellation Fees",
      icon: CreditCard,
      content: [
        "12-23 hours before appointment: 30% surcharge of full session fee",
        "Within 12 hours of appointment: 50% surcharge of full session fee",
        "Within 6 hours or no-shows: 100% surcharge of full session fee",
        "DTherapist reserves the right to apply penalties at discretion"
      ]
    },
    {
      id: "therapist-cancellation",
      title: "When Therapist Cancels",
      icon: Users,
      content: [
        "Notification as soon as possible via provided contact information",
        "Options offered:",
        "• Reschedule with same therapist at no additional cost",
        "• Match with different available therapist",
        "• Full refund if other options are not suitable"
      ]
    },
    {
      id: "responsibilities",
      title: "Client Responsibilities",
      icon: Shield,
      content: [
        "Provide timely notice of cancellations or rescheduling requests",
        "Contact DTherapist as soon as possible for any changes",
        "Promptly notify if a therapist cancels an appointment"
      ]
    }
  ]
};

export const GENERAL_TERMS = {
  governingLaw: "These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
  note: "You contribute to a safe and effective therapeutic environment by adhering to these terms. We value your expertise and commitment to helping those in need.",
  exceptions: "Exceptions to policies may be considered on a case-by-case basis, subject to approval by DTherapist management."
};