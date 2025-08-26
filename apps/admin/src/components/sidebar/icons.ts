import {
    DashboardIcon,
    BooksIcon,
    CounselorIcon,
    TransactionIcon,
  } from "../../assets/icons";
import { NavLabel } from "../layout/types";

export const ICONS: Record<NavLabel, React.FC<React.SVGProps<SVGSVGElement>>> = {
    Dashboard: DashboardIcon,
    Library: BooksIcon,
    User: CounselorIcon,
    Transaction: TransactionIcon,
  };