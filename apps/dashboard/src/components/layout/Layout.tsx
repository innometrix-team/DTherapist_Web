import React, { useEffect, useState, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MenuIcon, UserIcon } from "../../assets/icons";
import Sidebar from "../sidebar/SideBar";
import ProfileApi from "../../api/Profile.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { role } = useAuthStore();

  // Determine user type based on role
  const userType = role === "counselor" ? "counselor" : "user";

  // Query to fetch user profile
  const {
    data: profileData,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ["user-profile", userType],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await ProfileApi(userType, { 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No profile data received");
      }
      
      return response.data;
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Get profile picture with fallback
  const getProfilePicture = () => {
    if (profileLoading) {
      return ""; // Will show loading state
    }
    
    if (profileData?.profilePicture) {
      return profileData.profilePicture;
    }
    
    // No profile picture available
    return "";
  };

  const profilePicture = getProfilePicture();

  return (
    <div className="flex h-dvh bg-white">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        userType={userType} // Pass userType instead of relying on role
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col ">
        <header className="flex items-center justify-between p-4 bg-white border-b-divider border-b h-16">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="h-8 w-8 " />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Profile Picture with Loading and Error States */}
            <div className="relative group">
              {profileLoading ? (
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
              ) : profilePicture ? (
                <>
                  <img
                    src={profilePicture}
                    alt={profileData?.fullName || "User avatar"}
                    className="h-8 w-8 rounded-full border object-cover"
                    onLoad={() => console.log("Image loaded successfully:", profilePicture)}
                    onError={(e) => {
                      // Handle image load error by hiding the image
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                  {/* Fallback user icon */}
                  <div 
                    className="h-8 w-8 rounded-full border bg-gray-100 text-gray-600 items-center justify-center"
                    style={{ display: "none" }}
                  >
                    <UserIcon className="w-5 h-5" />
                  </div>
                </>
              ) : (
                /* Default user icon when no profile picture */
                <div className="h-8 w-8 rounded-full border bg-gray-100 text-gray-600 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              
              {/* Optional: Show user name on hover */}
              {profileData?.fullName && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {profileData.fullName}
                </div>
              )}
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