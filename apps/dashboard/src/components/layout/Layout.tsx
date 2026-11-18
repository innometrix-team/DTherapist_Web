import React, { useEffect, useState, useRef, useMemo } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MenuIcon, UserIcon } from "../../assets/icons";
import Sidebar from "../sidebar/SideBar";
import ProfileApi, { type IProfile } from "../../api/Profile.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import UserNotificationsDropdown from "../Notification/Notification";
import { QUERY_KEYS } from "../../configs/queryKeys.config";
import FeliciaChatbot from "../AIChatBot/FeliciaChatbot";
import { useNotificationListener } from "../../hooks/useNotificationListener";
import ErrorBoundary from "../common/ErrorBoundary";

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const role = useAuthStore((s) => s.role);
  const storedCategory = useAuthStore((s) => s.professionalCategory);
  const setProfessionalCategory = useAuthStore((s) => s.setProfessionalCategory);

  // Determine user type based on role
  const userType = role === "counselor" ? "counselor" : "user";

  // Query to fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery<IProfile>({
    queryKey: QUERY_KEYS.profile.userProfile(userType),
    queryFn: async (): Promise<IProfile> => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await ProfileApi(userType, {
        signal: controller.signal,
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

  // Sync profile-returned professionalCategory to auth store
  const categoryValue: unknown = profileData?.professionalCategory;
  const category =
    categoryValue === "psychologist" || categoryValue === "counselor"
      ? categoryValue
      : undefined;

  useEffect(() => {
    if (category === "psychologist" && storedCategory !== "psychologist") {
      setProfessionalCategory("psychologist");
    } else if (category === "counselor" && storedCategory !== "counselor") {
      setProfessionalCategory("counselor");
    }
  }, [category, storedCategory, setProfessionalCategory]);

  // Global real-time and push notification listener
  useNotificationListener();

  const isPsychologist =
    category === "psychologist" || storedCategory === "psychologist";

  const roleLabel = useMemo(() => {
    if (userType === "user") {
      return "Client";
    }
    if (isPsychologist) {
      return "Psychologist";
    }
    return "Counselor";
  }, [userType, isPsychologist]);

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
      return "";
    }
    if (profileData?.profilePicture) {
      return profileData.profilePicture;
    }
    return "";
  };

  const profilePicture = getProfilePicture();

  return (
    <div className="flex h-dvh bg-white font-sans">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        userType={userType}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 md:px-6 bg-white border-b-divider border-b h-16 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-offwhite text-darkerb transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 ml-auto">
            {/* User Notifications Dropdown */}
            <UserNotificationsDropdown />

            {/* Profile Picture & User Info with Link to Settings */}
            <Link
              to="/settings"
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-offwhite transition-colors group cursor-pointer"
              title="Settings & Profile"
            >
              <div className="relative shrink-0">
                {profileLoading ? (
                  <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                ) : profilePicture ? (
                  <>
                    <img
                      src={profilePicture}
                      alt={profileData?.fullName || "User avatar"}
                      className="h-9 w-9 rounded-full border border-divider object-cover group-hover:border-primary transition-colors"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = "flex";
                        }
                      }}
                    />
                    <div
                      className="h-9 w-9 rounded-full border border-divider bg-gray-100 text-darkerb items-center justify-center"
                      style={{ display: "none" }}
                    >
                      <UserIcon className="w-5 h-5" />
                    </div>
                  </>
                ) : (
                  <div className="h-9 w-9 rounded-full border border-divider bg-gray-100 text-darkerb flex items-center justify-center group-hover:border-primary transition-colors">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-darkerb group-hover:text-primary transition-colors max-w-[130px] truncate">
                  {profileData?.fullName || "My Account"}
                </span>
                <span className="text-[11px] text-neutral capitalize">
                  {roleLabel}
                </span>
              </div>
            </Link>
          </div>
        </header>


        <main className="flex-1 overflow-y-auto bg-offwhite">
          <ErrorBoundary name="this page">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Draggable AI Assistant with Quick Action Popups */}
      <FeliciaChatbot />
    </div>
  );
};


export default Layout;
