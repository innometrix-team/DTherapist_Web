import React from "react";
import { Outlet } from "react-router-dom";

const Auth: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white relative overflow-x-hidden">
      {/* Left side - Image fills half of the screen */}
      <div className="hidden lg:block lg:w-1/2 min-h-screen relative overflow-hidden bg-white">
        <img
          src="https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637"
          alt="DTherapist Administration"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>

      {/* Right side - Form Section with Logo at the Top Right */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-white overflow-y-auto relative">
        {/* Brand Logo: positioned at the top right for both desktop and mobile */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 xl:top-10 xl:right-10 z-20 flex items-center gap-2.5">
          <img
            src="/images/logo.png"
            alt="DTherapist Logo"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain"
          />
          <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-darkerb text-white rounded-md shadow-xs">
            Admin
          </span>
        </div>

        {/* Dynamic Auth Form Outlet */}
        <div className="w-full max-w-[420px] mx-auto pt-14 sm:pt-16 lg:pt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Auth;
