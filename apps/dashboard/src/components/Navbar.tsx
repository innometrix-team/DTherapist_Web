import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center relative z-50">
        <div className="text-xl font-bold text-primary">
          <Link to="https://dtherapist.com/"><img
                    src="https://ik.imagekit.io/rqi1dzw2h/DT_Logo.png?updatedAt=1746132133582"
                    alt="DTherapist Logo"
                    className="h-12 md:h-14 w-auto object-contain"
                  /></Link>
        </div>

        {/* Desktop Links */}
        <ul className="hidden md:flex gap-6 text-sm font-medium">
          <li>
            <Link to="https://dtherapist.com/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li>
            <Link to="/counselor" className="hover:text-Dblue">
              Counselors
            </Link>
          </li>
          <li>
            <Link to="/anonymous" className="hover:text-Dblue">
              DAnonymous
            </Link>
          </li>
          <li>
            <Link to="/appointments" className="hover:text-Dblue">
              Appointments
            </Link>
          </li>
        </ul>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-4">
          <Link
            to="/auth/login"
            className="text-sm border border-primary text-primary px-4 py-1 rounded hover:bg-primary hover:text-white transition-all"
          >
            Login
          </Link>
          <Link
            to="/auth/signup"
            className="text-sm bg-primary text-white px-4 py-1 rounded hover:bg-primary transition-all"
          >
            Register
          </Link>
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
            <Link to="https://dtherapist.com/" className="hover:text-primary" onClick={toggleMenu}>
              Home
            </Link>
            <Link
              to="/counselor"
              className="hover:text-primary"
              onClick={toggleMenu}
            >
              Counselors
            </Link>
            <Link
              to="/anonymous"
              className="hover:text-Dblue"
              onClick={toggleMenu}
            >
              DAnonymous
            </Link>
           
            <Link to="/appointments" className="hover:text-Dblue" onClick={toggleMenu}>
              Appointments
            </Link>

            <hr />

            <Link
              to="/auth/login"
              className="border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-white transition-all"
              onClick={toggleMenu}
            >
              Login
            </Link>
            <Link
              to="/auth/signup"
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary transition-all"
              onClick={toggleMenu}
            >
              Register
            </Link>
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
