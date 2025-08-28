import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { LogoutIcon } from "../../assets/icons";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { NavGroup } from "../layout/types";
import { SidebarLink } from "./SideBarLink";
import { SidebarProps } from "./types";
import { STORE_KEYS } from "../../configs/store.config";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS: Record<"user" | "counselor", NavGroup> = {
  user: {
    primary: [
      { to: "/", label: "Dashboard" },
      { to: "/counselor", label: "Counselors" },
      { to: "/appointments", label: "Appointments" },
      { to: "/anonymous", label: "DAnonymous", matchNested: true },
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
  const { logout } = useAuthStore();
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem(STORE_KEYS.AUTH);
    navigate("/auth");
  }, [logout, navigate]);

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
        className={`fixed inset-y-0 left-0 z-80 w-64 transform bg-white overflow-y-auto transition-transform duration-200 ease-in-out
              ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } lg:translate-x-0 lg:static lg:inset-auto`}
      >
        <div className=" p-4 border-b-divider border-b h-16">
          <Link to="/" className="h-full">
            <img src="/images/logo.png" className="h-12 md:h-14 w-auto object-contain" />
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
              onClick={handleLogout}
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
          className="fixed inset-0 bg-black opacity-50 lg:hidden z-70"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
