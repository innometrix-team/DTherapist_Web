import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { LogoutIcon } from "../../assets/icons";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { NavGroup } from "../layout/types";
import { SidebarLink } from "./SideBarLink";
import { SidebarProps } from "./types";

const NAV_ITEMS: Record<"user" | "counselor", NavGroup> = {
  user: {
    primary: [
      { to: "/", label: "Dashboard" },
      { to: "/counselor", label: "Counselors" },
      { to: "/appointments", label: "Appointments" },
      { to: "/anonymous", label: "DAnonymous" },
      { to: "/library", label: "Library" },
    ],
    secondary: [{ to: "/privacy-policy", label: "Privacy Policy" }],
    tertiary: [{ to: "/settings", label: "Settings" }],
  },
  counselor: {
    primary: [
      { to: "/", label: "Dashboard" },
      { to: "/appointments", label: "Appointments" },
      { to: "/anonymous", label: "DAnonymous" },
      { to: "/library", label: "Library" },
    ],
    secondary: [{ to: "/privacy-policy", label: "Privacy Policy" }],
    tertiary: [
      { to: "/my-schedule", label: "My Schedule" },
      { to: "/settings", label: "Settings" },
    ],
  },
};

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { role } = useAuthStore();

  const sections = useMemo(
    () =>
      !role
        ? null
        : [
            NAV_ITEMS[role].primary,
            NAV_ITEMS[role].secondary,
            NAV_ITEMS[role].tertiary,
          ],
    [role]
  );

  if (!sections) return null;

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white overflow-y-auto transition-transform duration-200 ease-in-out
              ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } md:translate-x-0 md:static md:inset-auto`}
      >
        <div className=" p-4 border-b-divider border-b h-16">
          <Link to="/" className="h-full">
            <img src="/images/logo.png" className="h-full" />
          </Link>
        </div>

        <nav className="pl-4 pt-4 h-[calc(100%-4rem)] bg-offwhite border-r-divider border-r">
          {sections.map((group, i) => (
            <React.Fragment key={i}>
              {group.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
              {i < sections.length - 1 && (
                <div className=" my-2 border-t border-divider" />
              )}
            </React.Fragment>
          ))}

          <div className="w-full pr-4">
            <button
              onClick={() => {}}
              className="max-w-4/6 px-6 py-4 mt-16 mx-auto text-white bg-primary  flex items-center justify-center rounded-lg cursor-pointer"
            >
              <LogoutIcon />
              <span className="ml-2.5 text-sm">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
