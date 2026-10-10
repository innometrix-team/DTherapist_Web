import {
  UserCheck,
  Users,
  Shield,
  Clock,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TermsSection {
  id: string;
  title: string;
  icon: LucideIcon;
  content: string[];
}

export interface TermsData {
  title: string;
  sections: TermsSection[];
}

export const COUNSELOR_TERMS: TermsData = {
  title: "Terms and Conditions of Service for Professional Counselors",
  sections: [
    {
      id: "eligibility",
      title: "Eligibility Requirements",
      icon: UserCheck,
      content: [
        "Hold valid and verifiable professional licenses, certifications, or credentials in counseling, psychology, or related mental health fields",
        "Have demonstrable experience in providing professional mental health or grief support services",
        "Comply fully with all applicable laws, regulations, and ethical standards governing professional counseling practice in your jurisdiction",
      ],
    },
    {
      id: "service",
      title: "Service Provision",
      icon: Shield,
      content: [
        "Deliver counseling and therapeutic services exclusively through the DTherapist platform",
        "Maintain the highest standards of professionalism, confidentiality, and ethical conduct in all interactions",
        "Participate in ongoing training and professional development as may be reasonably required by DTherapist",
        "Promptly report any suspected data breaches or security incidents to DTherapist",
        "Understand and consent that DTherapist may, at its discretion, monitor and review counselor interactions for compliance, quality assurance, and client safety purposes",
      ],
    },
    {
      id: "rights",
      title: "Counselor Rights",
      icon: Users,
      content: [
        "Request access, modification, or deletion of personal information in accordance with applicable data protection laws",
        "Terminate participation as a service provider with at least 30 days' written notice to DTherapist",
        "Expect DTherapist to handle all personal data and communications in line with relevant data protection and privacy regulations",
      ],
    },
    {
      id: "prohibited",
      title: "Prohibited Conduct",
      icon: AlertTriangle,
      content: [
        "Solicit, accept, or provide counseling services to DTherapist clients outside the platform",
        "Engage in unprofessional, unethical, or discriminatory behavior in any form",
        "Disclose, share, or misuse confidential client information obtained through the platform",
        "Misrepresent qualifications, credentials, or experience",
        "Violations may result in suspension, termination, and/or legal action",
      ],
    },
    {
      id: "compensation",
      title: "Fees and Compensation",
      icon: CreditCard,
      content: [
        "DTherapist compensates counselors for sessions conducted through the platform according to the established payment structure",
        "All financial transactions must occur through DTherapist's official payment system to ensure transparency and security",
      ],
    },
    {
      id: "termination",
      title: "Termination",
      icon: AlertTriangle,
      content: [
        "DTherapist reserves the right to suspend or terminate a Counselor's account with or without prior notice in the event of non-compliance, misconduct, or policy breach",
        "DTherapist may temporarily suspend access pending the outcome of any investigation or dispute",
        "Counselors who wish to leave the platform must provide 30 days' written notice to ensure proper closure of ongoing client sessions",
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      icon: Shield,
      content: [
        "Counselors grant DTherapist a non-exclusive, worldwide, royalty-free license to use professional profiles, names, and images for legitimate platform-related purposes, including client matching and promotional materials",
        "DTherapist retains ownership of its trademarks, logos, software, and proprietary materials",
      ],
    },
    {
      id: "indemnification",
      title: "Indemnification",
      icon: AlertTriangle,
      content: [
        "Counselors agree to indemnify and hold harmless DTherapist, its affiliates, and personnel from any claims, losses, or damages arising from:",
        "• Breach of these Terms",
        "• Professional negligence or misconduct",
        "• Unauthorized disclosure of confidential information",
      ],
    },
    {
      id: "governing-law",
      title: "Governing Law",
      icon: Shield,
      content: [
        "These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria",
        "Any disputes arising hereunder shall be resolved through binding arbitration under the Arbitration and Mediation Act, 2023, as amended",
      ],
    },
    {
      id: "counselor-cancellation",
      title: "Counselor Cancellation Policy",
      icon: Clock,
      content: [
        "DTherapist values professionalism and reliability. To ensure fairness and maintain scheduling integrity, the following policy applies:",
        "If a Counselor cancels a session, the client will be promptly notified and offered one of the following options:",
        "• Reschedule with the same counselor at a mutually convenient time (no extra cost)",
        "• Be matched with another available counselor for the same appointment slot",
        "• Receive a full refund if neither option is acceptable",
        "Counselor Responsibilities:",
        "• Provide timely notice of cancellations or rescheduling",
        "• Communicate respectfully and professionally with clients and DTherapist staff",
        "This policy ensures continuity of care, respects clients' time, and maintains an efficient scheduling system",
        "Special circumstances may be reviewed and approved by DTherapist management on a case-by-case basis",
      ],
    },
    {
      id: "client-cancellation",
      title: "Client Cancellation Policy",
      icon: Clock,
      content: [
        "Clients may cancel or reschedule appointments under the following conditions:",
        "• 24 hours or more before the session: No penalty",
        "• 12–23 hours before: 30% charge of the session fee",
        "• 6–11 hours before: 50% charge of the session fee",
        "• Less than 6 hours or no-show: 100% of the session fee",
        "If a counselor cancels a session, clients will be notified promptly and may:",
        "• Reschedule with the same or another counselor, or",
        "• Request a full refund",
        "Purpose: To ensure fairness, effective scheduling, and respect for both client and counselor commitments",
      ],
    },
    {
      id: "payment-structure",
      title: "Counselor Payment Structure Policy",
      icon: CreditCard,
      content: [
        "DTherapist recognizes and values the contributions of its professional counselors",
        "The revenue from each client session is shared as follows:",
        "• Counselor: 65% of the session fee",
        "• DTherapist: 35% of the session fee",
        "Purpose: This structure ensures fair compensation for counselors while supporting operational costs such as client support, marketing, and platform maintenance",
        "Payment Terms:",
        "• Payments are processed weekly",
        "• Transaction summaries will be visible on the counselor's dashboard",
        "• DTherapist reserves the right to review and adjust the revenue split or payment schedule as necessary, with prior notice",
      ],
    },
    {
      id: "dispute-policy",
      title: "Appointment Dispute Policy",
      icon: AlertTriangle,
      content: [
        "DTherapist maintains a fair and transparent dispute resolution process for issues arising from counseling sessions",
        "Eligibility: A client may file a dispute if:",
        "• The counselor fails to attend a scheduled session, or",
        "• The session is unsatisfactory due to incomplete service, technical issues, or misconduct",
        "Filing a Dispute: After a session has ended, clients can:",
        "1. Go to Past Sessions on their dashboard",
        "2. Select Dispute from the action dropdown",
        "3. Provide a reason and submit the dispute form",
        "The dispute will be logged for administrative review",
        "Resolution Process:",
        "• The DTherapist admin team will review all disputes, verify session details, and determine an appropriate resolution (refund, partial credit, or other action)",
        "• Both counselor and client will be notified of the decision",
        "• The admin's decision shall be final and based on available evidence",
        "Automatic Payment Release:",
        "• If no dispute is filed within 24 hours after a session, payment will automatically be released to the counselor, and the session will be marked as non-disputable",
      ],
    },
    {
      id: "responsibilities",
      title: "Roles and Responsibilities",
      icon: Shield,
      content: [
        "Counselors must:",
        "• Provide high-quality, ethical, and compassionate services",
        "• Adhere to DTherapist's operational and professional policies",
        "• Maintain confidentiality and compliance with applicable legal standards",
        "DTherapist will:",
        "• Offer a secure and user-friendly platform for scheduling and communication",
        "• Manage client inquiries, payments, and support services",
        "• Promote counseling services and maintain an active client base",
      ],
    },
    {
      id: "acknowledgment",
      title: "Acknowledgment",
      icon: UserCheck,
      content: [
        "By registering as a Counselor on DTherapist, you confirm that you have read, understood, and agreed to be bound by these:",
        "• Terms and Conditions of Service",
        "• Counselor and Client Cancellation Policies",
        "• Payment and Dispute Resolution Policies",
        "Your commitment to these principles helps foster a trusted, professional, and supportive therapeutic community",
      ],
    },
  ],
};

export const CLIENT_TERMS: TermsData = {
  title: "DTherapist – Client Terms and Conditions",
  sections: [
    {
      id: "welcome",
      title: "Welcome to DTherapist",
      icon: UserCheck,
      content: [
        "Welcome to DTherapist, an online platform dedicated to supporting individuals coping with grief and loss—whether from the passing of loved ones or significant life changes",
        "By accessing or using our platform, you agree to the following Terms and Conditions, which are designed to protect both our users and service providers",
        "Please read them carefully before proceeding",
      ],
    },
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: Shield,
      content: [
        "By using DTherapist, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions",
        "If you do not agree with any part of these Terms, you may not use our services",
      ],
    },
    {
      id: "eligibility",
      title: "Eligibility",
      icon: UserCheck,
      content: [
        "You must be at least 18 years of age to use our services",
        "Users below 18 may only access the platform under parental or guardian supervision",
      ],
    },
    {
      id: "user-account",
      title: "User Account",
      icon: Shield,
      content: [
        "To use DTherapist, you must create an account ('Account'). You agree to:",
        "• Provide accurate and complete information during registration",
        "• Keep your account details updated and confidential",
        "You are responsible for all activities under your account",
      ],
    },
    {
      id: "service-description",
      title: "Service Description",
      icon: Shield,
      content: [
        "DTherapist provides:",
        "• A supportive online community for individuals navigating grief and emotional recovery",
        "• Access to resources, support groups, and sessions with certified therapists or counselors",
        "Please note that the platform facilitates support, not professional medical diagnosis or treatment",
      ],
    },
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      icon: Shield,
      content: [
        "Your privacy is a top priority",
        "Our Privacy Policy explains how we collect, use, and protect your personal information",
        "Please review it carefully before using the platform",
      ],
    },
    {
      id: "professional-disclaimer",
      title: "Professional Support Disclaimer",
      icon: AlertTriangle,
      content: [
        "DTherapist is not a substitute for professional mental health or medical care",
        "Users experiencing acute emotional distress or crises are encouraged to seek immediate help from qualified professionals or emergency services",
      ],
    },
    {
      id: "user-content",
      title: "User-Generated Content",
      icon: Users,
      content: [
        "The platform allows users to share stories, comments, and images ('User Content')",
        "By posting on DTherapist, you:",
        "• Retain ownership of your content",
        "• Grant DTherapist a non-exclusive, worldwide, royalty-free, transferable license to use, display, and share your content for platform-related purposes, including community growth and promotion",
        "All shared content must comply with applicable copyright laws and community standards of respect and decency",
      ],
    },
    {
      id: "prohibited-activities",
      title: "Prohibited Activities",
      icon: AlertTriangle,
      content: [
        "Users must maintain a safe and respectful environment. The following actions are strictly prohibited:",
        "• Hate speech, harassment, or bullying (verbal or non-verbal)",
        "• Sharing explicit, violent, or threatening content",
        "• Engaging in fraudulent, illegal, or harmful activities",
        "Violations may result in immediate suspension or termination of your account",
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      icon: Shield,
      content: [
        "All content, software, and materials on the platform—including text, graphics, logos, and multimedia—are the exclusive property of DTherapist or its licensors and protected by copyright and trademark laws",
      ],
    },
    {
      id: "disclaimer-warranties",
      title: "Disclaimer of Warranties",
      icon: AlertTriangle,
      content: [
        "DTherapist and its services are provided on an 'as is' and 'as available' basis",
        "We make no warranties, express or implied, regarding:",
        "• Service availability or reliability",
        "• Accuracy or completeness of information",
        "• Fitness for a particular purpose",
      ],
    },
    {
      id: "limitation-liability",
      title: "Limitation of Liability",
      icon: AlertTriangle,
      content: [
        "DTherapist shall not be liable for any direct, indirect, incidental, or consequential damages resulting from:",
        "• Use or inability to use the platform",
        "• Errors, interruptions, or technical failures",
        "• Unauthorized access to data",
        "• Actions or omissions by any user or therapist",
        "Your use of the platform is at your own discretion and risk",
      ],
    },
    {
      id: "termination",
      title: "Termination of Account",
      icon: AlertTriangle,
      content: [
        "DTherapist reserves the right to suspend or terminate any user account without prior notice for violations of these Terms or any activity deemed harmful to the platform's integrity",
      ],
    },
    {
      id: "governing-law",
      title: "Governing Law and Dispute Resolution",
      icon: Shield,
      content: [
        "These Terms are governed by the laws of the Federal Republic of Nigeria",
        "Disputes arising from this agreement shall be resolved through binding arbitration in accordance with the Arbitration and Mediation Act of 2023",
      ],
    },
    {
      id: "changes-to-terms",
      title: "Changes to Terms",
      icon: AlertTriangle,
      content: [
        "DTherapist may revise these Terms at any time",
        "Updates will take effect immediately upon posting",
        "Continued use of the platform after updates constitutes acceptance of the revised Terms",
      ],
    },
    {
      id: "cancellation-intro",
      title: "Client Cancellation Policy",
      icon: Clock,
      content: [
        "We understand that circumstances may require you to change your plans",
        "To ensure fairness and efficient scheduling for both clients and therapists, please review our cancellation terms",
      ],
    },
    {
      id: "client-cancellations",
      title: "Client Cancellations",
      icon: Clock,
      content: [
        "You may cancel or reschedule your appointment at least 24 hours before the scheduled time at no cost",
        "Cancellations made less than 24 hours before the appointment may incur a fee:",
        "• 12–23 hours before: 30% of the session fee",
        "• 6–11 hours before: 50% of the session fee",
        "• Less than 6 hours or no-show: 100% of the session fee",
        "DTherapist reserves the right to enforce or waive these charges based on the situation",
      ],
    },
    {
      id: "therapist-cancellations",
      title: "Therapist Cancellations",
      icon: Users,
      content: [
        "If a therapist cancels a session, clients will be notified promptly and may choose to:",
        "• Reschedule with the same therapist at no cost",
        "• Book another available therapist for the same slot",
        "• Receive a full refund if neither option is suitable",
        "We make every effort to minimize disruptions and ensure clients continue receiving support without delay",
      ],
    },
    {
      id: "cancellation-exceptions",
      title: "Exceptions",
      icon: Shield,
      content: [
        "Exceptions to the cancellation policy may be granted on a case-by-case basis at DTherapist's discretion",
      ],
    },
    {
      id: "dispute-intro",
      title: "Appointment Dispute Policy",
      icon: AlertTriangle,
      content: [
        "DTherapist maintains a transparent process for resolving session-related disputes between clients and therapists",
      ],
    },
    {
      id: "dispute-eligibility",
      title: "Eligibility for Dispute",
      icon: AlertTriangle,
      content: [
        "A client may file a dispute if:",
        "• The therapist fails to attend the scheduled session, or",
        "• The client experiences significant dissatisfaction during the session (e.g., incomplete service, technical issues, or unprofessional conduct)",
      ],
    },
    {
      id: "dispute-filing",
      title: "How to File a Dispute",
      icon: Users,
      content: [
        "After the session time has passed, it will appear under 'Past Sessions' in your account",
        "To file a dispute:",
        "1. Click on the Action dropdown",
        "2. Select Dispute and provide a reason or description",
        "3. Submit the dispute form",
        "The dispute will be logged and reviewed by the DTherapist Admin Team",
      ],
    },
    {
      id: "dispute-resolution",
      title: "Resolution Process",
      icon: Shield,
      content: [
        "The Admin Team will assess the dispute, verify details, and decide on the appropriate action—such as a refund, partial credit, or mediation",
        "Both the client and therapist will be informed of the outcome",
        "DTherapist's decision shall be final and based on available evidence and platform policies",
      ],
    },
    {
      id: "automatic-payment",
      title: "Automatic Payment Release",
      icon: CreditCard,
      content: [
        "If no dispute is filed within 24 hours after the session ends, payment will automatically be released to the therapist, and the session will be considered closed and non-disputable",
      ],
    },
    {
      id: "final-decision",
      title: "Final Decision",
      icon: Shield,
      content: [
        "DTherapist reserves the right to make the final determination in all dispute cases in line with its policies and available evidence",
      ],
    },
    {
      id: "acknowledgment",
      title: "Acknowledgment",
      icon: UserCheck,
      content: [
        "By creating an account and using DTherapist, you acknowledge that you have read, understood, and agreed to these:",
        "• Terms and Conditions",
        "• Cancellation Policies",
        "• Appointment Dispute Policy",
        "Your trust and cooperation help us maintain a safe, fair, and supportive environment for all",
      ],
    },
  ],
};

export const GENERAL_TERMS = {
  governingLaw:
    "These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
  arbitration:
    "Any disputes arising hereunder shall be resolved through binding arbitration under the Arbitration and Mediation Act, 2023, as amended.",
  counselorNote:
    "By offering services through DTherapist, counselors acknowledge their understanding and acceptance of these policies. Your commitment to these principles helps foster a trusted, professional, and supportive therapeutic community.",
  clientNote:
    "By creating an account and using DTherapist, you acknowledge that you have read, understood, and agreed to these Terms and Conditions, Cancellation Policies, and Appointment Dispute Policy. Your trust and cooperation help us maintain a safe, fair, and supportive environment for all.",
  exceptions:
    "Exceptions to policies may be considered on a case-by-case basis, subject to approval by DTherapist management.",
};