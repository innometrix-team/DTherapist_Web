
export type NavLabel =
  | "Dashboard"
  | "User"
  | "Transaction" 
  | "Library"
  | "Bookings"
  | "Disputes"
  | "DAnonymous"
  | "Moderation"
  | "Feedback"

;

export interface NavItem {
    to: string;
    label: NavLabel;
    matchNested?: boolean;
  }
  
export interface NavGroup {
    primary:   NavItem[];
    
  }
  