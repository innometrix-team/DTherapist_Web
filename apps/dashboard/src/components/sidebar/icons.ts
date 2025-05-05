import {
    DashboardIcon,
    CounselorIcon,
    AppointmentsIcon,
    PeopleIcon,
    BooksIcon,
    ScheduleIcon,
    SettingsIcon,
  } from "../../assets/icons";
import { NavLabel } from "../layout/types";

export const ICONS: Record<NavLabel, React.FC<React.SVGProps<SVGSVGElement>>> = {
    Dashboard: DashboardIcon,
    Counselors: CounselorIcon,
    Appointments: AppointmentsIcon,
    DAnonymous: PeopleIcon,
    Library: BooksIcon,
    "Privacy Policy": BooksIcon,
    "My Schedule": ScheduleIcon,
    Settings: SettingsIcon,
  };