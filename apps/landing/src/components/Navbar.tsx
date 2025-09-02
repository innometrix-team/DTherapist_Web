import React, { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center relative z-50">
        <img
          src="https://ik.imagekit.io/rqi1dzw2h/DT_Logo.png?updatedAt=1746132133582"
          alt="DTherapist Logo"
          className="h-10 md:h-12 w-auto object-contain"
        />

        {/* Desktop Links */}
        <ul className="hidden md:flex gap-6 text-sm font-medium">
          <li>
            <a href="#home" className="hover:text-primary">
              Home
            </a>
          </li>
          <li>
            <a href="https://d-therapist.vercel.app/appointments" className="hover:text-primary">
              Appointments
            </a>
          </li>
          <li>
            <a href="https://d-therapist.vercel.app/anonymous" className="hover:text-primary">
              DAnonymous
            </a>
          </li>
          <li>
            <a href="#faq" className="hover:text-primary">
              FAQs
            </a>
          </li>
        </ul>

        {/* Buttons (Always Visible) */}
        <div className="hidden md:flex gap-4">
          <button className="text-sm border border-primary text-primary px-4 py-1 rounded hover:bg-primary hover:text-white transition-all">
            <a href="https://d-therapist.vercel.app/auth/login" className="hover:text-white ">
              Login
            </a>
          </button>
          <button className="text-sm bg-primary text-white px-4 py-1 rounded hover:bg-primary transition-all">            
            <a href="https://d-therapist.vercel.app/auth/signup" >
              Register
            </a>
          </button>
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {menuOpen ? (
              <FiX className="text-2xl text-primary" />
            ) : (
              <FiMenu className="text-2xl text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col p-6 gap-6 text-sm font-medium">
            <a href="#home" className="hover:text-primary" onClick={toggleMenu}>
              Home
            </a>
            <a
              href="https://d-therapist.vercel.app/appointments"
              className="hover:text-primary"
              onClick={toggleMenu}
            >
              Appointments
            </a>
            <a
              href="https://d-therapist.vercel.app/anonymous"
              className="hover:text-primary"
              onClick={toggleMenu}
            >
              DAnonymous
            </a>
            <a href="#faq" className="hover:text-primary" onClick={toggleMenu}>
              FAQs
            </a>

            <hr />

            <button className="border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-white transition-all">

            <a href="https://d-therapist.vercel.app/auth/login" className="hover:text-white ">  Login</a>
            </button>
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary transition-all">
              <a href="https://d-therapist.vercel.app/auth/signup" >

              Register
              </a>
            </button>
          </div>
        </div>

        {/* Overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={toggleMenu}
          ></div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
