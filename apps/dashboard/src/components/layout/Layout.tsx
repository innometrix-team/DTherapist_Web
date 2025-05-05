import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MenuIcon } from "../../assets/icons";
import Sidebar from "../sidebar/SideBar";

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col ">
        <header className="flex items-center justify-between p-4 bg-white border-b-divider border-b h-16">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="h-8 w-8 " />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <img
              src=""
              alt="User avatar"
              className="h-8 w-8 rounded-full border"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
