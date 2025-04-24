import React from 'react';
import { Outlet } from "react-router-dom";
import Navbar from '../components/Navbar';

const Auth: React.FC = () => {
  
  return (
    <>
    <Navbar/>
    <div className="min-h-[calc(100vh-64px)] flex border-b-[16px] border-Dblue">
      {/* Left side - Image and Info */}
      <div className="hidden lg:flex w-1/2  items-center justify-center p-12">
          <img 
            src="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744094284/img1_pxdd9l.jpg" 
            alt="Therapy illustration" 
            className="max-w-full h-auto object-contain rounded-2xl"
          />
        </div>

      {/* Right side - Form Section */}
      <div className="flex-1 w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md">
         
          <Outlet />
        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;
