import {
    DashboardIcon,
    BooksIcon,
    CounselorIcon,
    TransactionIcon,
    MenuIcon
  } from "../../assets/icons";
import { NavLabel } from "../layout/types";

export const ICONS: Record<NavLabel, React.FC<React.SVGProps<SVGSVGElement>>> = {
    Dashboard: DashboardIcon,
    Library: BooksIcon,
    User: CounselorIcon,
    Bookings: BooksIcon,
    Transaction: TransactionIcon,
    DAnonymous: MenuIcon,
  };