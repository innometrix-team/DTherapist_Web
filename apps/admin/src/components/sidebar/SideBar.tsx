import React, { useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoutIcon } from "../../assets/icons";
import { useAuthStore } from "../../Store/auth/useAuthStore";
import { NavGroup } from "../layout/types";
import { SidebarLink } from "./SideBarLink";
import { SidebarProps } from "./types";
import { STORE_KEYS } from "../../configs/store.config";

const NAV_ITEMS: Record<"admin", NavGroup> = {
  admin: {
    primary: [
      { to: "/", label: "Dashboard" },
      { to: "/user", label: "User" },
      { to: "/library", label: "Library" },
      { to: "/bookings", label: "Bookings" },
      { to: "/disputes", label: "Disputes" },
      { to: "/danonymous", label: "DAnonymous" },
      { to: "/transaction", label: "Transaction" },
      
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


  const sections = useMemo(() => {
    if (!role) return null;

    // Check if the role exists in NAV_ITEMS, fallback to admin if not
    const roleConfig =
      NAV_ITEMS[role as keyof typeof NAV_ITEMS] || NAV_ITEMS.admin;

    return [roleConfig.primary];
  }, [role]);


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
