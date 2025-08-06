import {
  UserCheck,
  Users,
  Shield,
  Clock,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

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
        "Comply with applicable laws and regulations",
      ],
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
        "Subject to monitoring and review of interactions by DTherapist",
      ],
    },
    {
      id: "rights",
      title: "Counselor Rights",
      icon: Users,
      content: [
        "Request access, modification, or deletion of personal data",
        "Terminate services with 30-day written notice to DTherapist",
        "Protection under relevant data protection laws and regulations",
      ],
    },
    {
      id: "prohibited",
      title: "Prohibited Conduct",
      icon: AlertTriangle,
      content: [
        "Soliciting or providing services to DTherapist clients outside the platform",
        "Engaging in unprofessional or unethical behaviour",
        "Sharing confidential information",
      ],
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
        "Payment structure subject to review and adjustment with advance notice",
      ],
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
        "• Full refund if other options are not suitable",
      ],
    },
  ],
};

export const CLIENT_TERMS: TermsData = {
  title: "Terms and Conditions for Client ",
  sections: [
    {
      id: "eligibility",
      title: "Eligibility Requirements",
      icon: UserCheck,
      content: [
        "Must be at least 18 years old or have parental consent",
        "Provide accurate personal information during registration",
        "Comply with all applicable laws and regulations",
      ],
    },
    {
      id: "user",
      title: "User Account",
      icon: Shield,
      content: [
        "To use the Platform, you must create a user account Account. You agree to provide accurate and complete information when creating your Accountand to keep your Account information up to date",
      ],
    },
    {
      id: "privacy",
      title: "Privacy and Data Protection",
      icon: Shield,
      content: [
        "Your privacy is important – please review our Privacy Policy outlining how we collect, use & safeguard information on this platform",
        
      ],
    },
    {
      id: "User-Generated Content",
      title: " User-Generated Content",
      icon: AlertTriangle,
      content: [
        "You are responsible for any content you post or share on the platform",
        "Content must not violate any laws, infringe on rights, or be offensive",
        "We encourage respectful interactions & sharing personalstories/images among members",
        "The Platform allows you to share your story, connect with others, and access resources and support. You retain ownership of any content you post or upload to the Platform (User Content). However, by posting or uploading User Content, you grant DTherapist a non-exclusive, worldwide, royalty-free, sub licensable, and transferable license to use, reproduce, prepare derivative works of, perform, display, and distribute the User Content in connection with the Platform and DTherapist's (and its successors' and affiliates') business, including for marketing and promotional purposes. Content shared should comply applicable laws regarding copyrighted material plus standards around decency",
      ],
    },
    {
      id: "Intellectual Property",
      title: "Intellectual Property",
      icon: UserCheck,
      content: [
        "All content on the Platform, including text, graphics, logos, and software, is the property of DTherapist or its licensors and is protected by copyright and other intellectual property laws",
        "You may not use, reproduce, distribute, or create derivative works from any content on the Platform without our express written permission",
      ],
    },
    {
      id: "Prohibited Activities",
      title: "Prohibited Activities",
      icon: Shield,
      content: [
        "You agree not to engage in any of the following prohibited activities while using the Platform as it incures losing of account:",
        "• Violating any applicable laws or regulations",
        "• Posting or transmitting any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable",
        "• Impersonating any person or entity or falsely stating or misrepresenting your affiliation with a person or entity",
        "• Collecting or storing personal data about other users without their express permission",
        "• Using the Platform for any commercial purpose without our prior written consent",
      ],
    },
    {
      id: "Disclaimers",
      title: "Disclaimers",
      icon: AlertTriangle,
      content: [
       "The Platform is provided on an 'as is' and 'as available' basis without any warranties of any kind, either express or implied",
        "DTherapist disclaims all warranties, express or implied,",
        "including but not limited to implied warranties of merchantability,",
        "merchantability, fitness for a particular purpose, title, and non-infringement.",
       
      ], 
    },
    {
      id: "Limitation of Liability",
      title: "Limitation of Liability",
      icon: AlertTriangle,
      content: [
        "In no event shall DTherapist be liable for any direct, indirect, incidental, special, punitive, or consequential damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from:",
        " your use of or inability to use the Platform;",
        "any errors, omissions, or inaccuracies in the Platform or any content, software, or materials available on the Platform;",
        "any bugs, viruses, Trojan horses, or other harmful code that may be transmitted to or through the Platform;",
        "any errors or omissions in any information or materials provided by DTherapist or its licensors;",
        "any unauthorized access to or use of DTherapist's servers and/or any personal information stored therein;",
      ],
    },
    {
      id: "Termination",
      title: "Termination",
      icon: Users,
      content: [
        "We reserve the right to suspend or terminate your access to the Platform at any time and for any reason without prior notice",
        "Upon termination, your right to use the Platform will immediately cease",
      ],
    },
    {
      id: "free-cancellation",
      title: "Free Cancellation Window",
      icon: Clock,
      content: [
        "Cancel or reschedule at no charge with at least 24 hours notice",
      ],
    },
    {
      id: "cancellation-fees",
      title: "Cancellation Fees",
      icon: CreditCard,
      content: [
        "12-23 hours before appointment: 30% surcharge of full session fee",
        "Within 12 hours of appointment: 50% surcharge of full session fee",
        "Within 6 hours or no-shows: 100% surcharge of full session fee",
        "DTherapist reserves the right to apply penalties at discretion",
      ],
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
        "• Full refund if other options are not suitable",
      ],
    },
    {
      id: "responsibilities",
      title: "Client Responsibilities",
      icon: Shield,
      content: [
        "Provide timely notice of cancellations or rescheduling requests",
        "Contact DTherapist as soon as possible for any changes",
        "Promptly notify if a therapist cancels an appointment",
      ],
    },
    {
      id: "Termination",
      title: "Termination",
      icon: AlertTriangle,
      content: [
        "DTherapist reserve the right to suspend or terminate your access to the Platform at any time and for any reason without prior notice",
      ],
    },
    {
      id: "Governing Law and Jurisdiction",
      title: "Governing Law and Jurisdiction",
      icon: Shield,
      content: [
        " These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
        "Any disputes arising out of or in connection with these Terms shall be subject to binding arbitration in accordance with the rules of the Arbitration and Mediation Act of 2023, as amended from time to time.",

      ],
    },
     {
      id: "Entire Agreement",
      title: "Entire Agreement",
      icon: Users,
      content: [
        "These Terms constitute the entire agreement between you and DTherapist regarding your use of the Platform and supersede all prior agreements and understandings, whether written or oral, relating to the subject matter hereof.",
      ],
    },
    {
      id: "Changes to Terms",
      title: "Changes to Terms",
      icon: AlertTriangle,
      content: [
        "DTherapist reserves the right to modify these Terms at any time. Any changes will be effective immediately upon posting on the Platform. Your continued use of the Platform after any such changes constitutes your acceptance of the new Terms.",
      ],
    },
    
  ],
};

export const GENERAL_TERMS = {
  governingLaw:
    "These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
  note: "You contribute to a safe and effective therapeutic environment by adhering to these terms. We value your expertise and commitment to helping those in need.",
  exceptions:
    "Exceptions to policies may be considered on a case-by-case basis, subject to approval by DTherapist management.",
};
