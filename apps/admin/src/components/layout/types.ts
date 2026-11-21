export type NavLabel =
  | "Dashboard"
  | "Users"
  | "Transaction"
  | "Library"
  | "Bookings"
  | "Disputes"
  | "DAnonymous"
  | "Moderation"
  | "Feedback"
  | "Announcements";

export interface NavItem {
  to: string;
  label: NavLabel;
  matchNested?: boolean;
}

export interface NavGroup {
  primary: NavItem[];
}
