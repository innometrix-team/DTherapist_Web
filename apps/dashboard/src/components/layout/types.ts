
export type NavLabel =
  | "Dashboard"
  | "Counselors"
  | "Appointments"
  | "DAnonymous"
  | "Library"
  | "Privacy Policy"
  | "My Schedule"
  | "Settings";

export interface NavItem {
    to: string;
    label: NavLabel;
    matchNested?: boolean;
  }
  
export interface NavGroup {
    primary:   NavItem[];
    secondary: NavItem[];
    tertiary:  NavItem[];
  }
  