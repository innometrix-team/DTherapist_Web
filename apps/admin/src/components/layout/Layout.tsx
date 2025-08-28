import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MenuIcon, UserIcon } from "../../assets/icons";
import Sidebar from "../sidebar/SideBar";
import NotificationsDropdown from "../Notifications/NotificationsDropdown";

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex h-dvh bg-white">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col ">
        <header className="flex items-center justify-between p-4 bg-white border-b-divider border-b h-16">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="h-8 w-8 " />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Notifications Dropdown */}
            <NotificationsDropdown />
            
            {/* Static Profile Icon */}
            <div className="h-8 w-8 rounded-full border bg-gray-100 text-gray-600 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f7f7f8]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;