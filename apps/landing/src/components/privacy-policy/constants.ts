// constants/privacyPolicy.ts

export interface PrivacySection {
  id: string;
  title: string;
  content: string[];
}

export interface PrivacyPolicyData {
  lastUpdated: string;
  sections: {
    users: PrivacySection[];
    providers: PrivacySection[];
  };
}

export const PRIVACY_POLICY_DATA: PrivacyPolicyData = {
  lastUpdated: "2025-09-01",
  sections: {
    users: [
      {
        id: "information-collection",
        title: "1. Information We Collect",
        content: [
          "We may collect personal information such as name, email address (if provided), age, and other relevant details when users sign up for an account or interact with our platform.",
          "This information helps us provide personalized support services tailored to your specific needs during your journey of grief and healing."
        ]
      },
      {
        id: "use-of-information",
        title: "2. Use of Information",
        content: [
          "The information you share helps us tailor support services and resources based on individual needs.",
          "Detailed insights help us understand requirements better, allowing the development of relevant content and personalized experiences.",
          "We use your data to improve our platform and ensure you receive the most appropriate support for your healing journey."
        ]
      },
      {
        id: "data-security",
        title: "3. Data Security",
        content: [
          "Personal information is stored securely with access restricted to authorized personnel only.",
          "We have implemented comprehensive security measures aimed at preventing unauthorized access and usage, derived from industry best practices.",
          "All sensitive data is encrypted both in transit and at rest to ensure maximum protection."
        ]
      },
      {
        id: "third-party-links",
        title: "4. Third-Party Links",
        content: [
          "Our platform might occasionally contain links to third-party websites.",
          "Please note that we hold no responsibility regarding their policies around handling your information.",
          "We encourage you to review the privacy policies of any third-party sites you visit."
        ]
      },
      {
        id: "cookies",
        title: "5. Cookies",
        content: [
          "Our site employs cookies and tracking technology to personalize your experience while engaging with DTherapist.",
          "Users are always given the option to turn off this feature within their browser settings.",
          "Cookies help us remember your preferences and improve your overall experience on our platform."
        ]
      },
      {
        id: "user-rights",
        title: "6. User Rights",
        content: [
          "Users possess comprehensive rights over their own data, including requesting viewing, deletion, or modification where necessary.",
          "You have the right to access all data you have contributed or shared on DTherapist.",
          "We will respond to all legitimate requests regarding your personal information in a timely manner."
        ]
      },
      {
        id: "policy-changes",
        title: "7. Changes to Privacy Policy",
        content: [
          "It's important to check this page regularly to ensure you are updated and understand any alterations made or additions to our current policies.",
          "We reserve the right to amend these terms at any time without prior notice.",
          "Significant changes will be highlighted and communicated through our platform."
        ]
      },
      {
        id: "contact-users",
        title: "8. Contact Us",
        content: [
          "For any questions or concerns regarding our privacy policy, please reach out to us.",
          "We are committed to addressing your privacy concerns promptly and transparently.",
          "Your privacy and trust are fundamental to our mission of providing supportive care."
        ]
      }
    ],
    providers: [
      {
        id: "data-collection-providers",
        title: "1. Data Collection",
        content: [
          "We collect information from Providers, including:",
          "• Contact information (name, email, phone number)",
          "• Professional credentials (license, certification, experience)",
          "• Profile information (bio, specialty, languages spoken)",
          "We collect necessary information for account creation and service provision.",
          "Session data is encrypted and stored securely to maintain confidentiality."
        ]
      },
      {
        id: "data-use-providers",
        title: "1b. Data Use",
        content: [
          "We use collected data to:",
          "• Verify Provider credentials and maintain platform integrity",
          "• Facilitate effective matches between Providers and Clients",
          "• Monitor platform usage and performance for continuous improvement",
          "• Communicate important updates and notifications relevant to your practice"
        ]
      },
      {
        id: "data-protection-providers",
        title: "2. Data Protection",
        content: [
          "We implement industry-standard security measures to protect data, including:",
          "• Advanced encryption protocols",
          "• Secure servers with multiple layers of protection",
          "• Strict access controls and authentication systems",
          "• Regular security updates and vulnerability assessments"
        ]
      },
      {
        id: "data-sharing-providers",
        title: "3. Data Sharing",
        content: [
          "We may share data with:",
          "• Regulatory bodies (for licensing verification and compliance)",
          "• Law enforcement (in cases of suspected harm or illegal activity)",
          "• Third-party service providers (for platform maintenance and improvement)",
          "All data sharing is conducted in accordance with applicable laws and regulations."
        ]
      },
      {
        id: "data-retention-providers",
        title: "4. Data Retention",
        content: [
          "We retain data for as long as necessary to provide services effectively.",
          "Data is maintained until Provider accounts are deactivated or as required by law.",
          "Upon account closure, data is securely deleted according to our retention schedule."
        ]
      },
      {
        id: "provider-obligations",
        title: "5. Provider Obligations",
        content: [
          "Providers must:",
          "• Maintain accurate and up-to-date profiles at all times",
          "• Comply with all applicable laws and regulations in their jurisdiction",
          "• Protect User confidentiality and maintain professional standards",
          "• Report any security concerns or data breaches immediately"
        ]
      }
    ]
  }
};