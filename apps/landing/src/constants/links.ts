/**
 * Centralized application, dashboard, store, and social links for DTherapist.
 */

const DASHBOARD_BASE_URL =
  (import.meta.env.VITE_DASHBOARD_URL as string | undefined) ||
  "https://dashboard.dtherapist.com";

export const APP_LINKS = {
  // Dashboard & Auth
  dashboard: DASHBOARD_BASE_URL,
  login: `${DASHBOARD_BASE_URL}/auth/login`,
  signup: `${DASHBOARD_BASE_URL}/auth/signup`,
  appointments: `${DASHBOARD_BASE_URL}/appointments`,
  anonymous: `${DASHBOARD_BASE_URL}/anonymous`,
  counselor: `${DASHBOARD_BASE_URL}/counselor`,

  // Mobile App Stores
  appStore: "https://apps.apple.com/us/app/dtherapist/id6751411829",
  playStore:
    "https://play.google.com/store/apps/details?id=com.dtherapistmobile.dtherapistmobile&pcampaignid=web_share",

  // Social Channels
  facebook: "https://www.facebook.com/share/1AfjAd6BWB/?mibextid=wwXIfr",
  instagram:
    "https://www.instagram.com/dtherapist_app?igsh=MWp4OWt1dWtiem11Nw==",

  // Contact Info
  email: "support@dtherapist.com",
  phone: "+234 803 308 7303",
} as const;

export default APP_LINKS;
