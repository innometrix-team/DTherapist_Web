import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { APP_LINKS } from "../constants/links";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Close mobile menu if window resizes to desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md shadow-xs sticky top-0 py-3.5 px-6 md:px-12 flex justify-between items-center z-50 border-b border-divider/60">
        <Link to="/" className="flex items-center">
          <img
            src="https://ik.imagekit.io/rqi1dzw2h/DT_Logo.png?updatedAt=1746132133582"
            alt="DTherapist Logo"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-semibold text-darkerb">
          <li>
            <Link to="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <li>
            <a
              href={APP_LINKS.appointments}
              className="transition-colors hover:text-primary"
            >
              Appointments
            </a>
          </li>
          <li>
            <a
              href={APP_LINKS.anonymous}
              className="transition-colors hover:text-primary"
            >
              DAnonymous
            </a>
          </li>
          <li>
            <a href="#faq" className="transition-colors hover:text-primary">
              FAQs
            </a>
          </li>
        </ul>

        {/* Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={APP_LINKS.login}
            className="text-sm font-semibold border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all duration-200 inline-flex items-center"
          >
            Login
          </a>
          <a
            href={APP_LINKS.signup}
            className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-lg hover:bg-darkerb transition-all duration-200 inline-flex items-center shadow-xs"
          >
            Register
          </a>
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="p-1 rounded-lg hover:bg-offwhite transition-colors"
          >
            {menuOpen ? (
              <FiX className="text-2xl text-primary" />
            ) : (
              <FiMenu className="text-2xl text-primary" />
            )}
          </button>
        </div>
      </nav>

      {/* Overlay (rendered outside nav to avoid backdrop-blur inheritance) */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-darkerb/60 backdrop-blur-xs z-[90] md:hidden"
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer (rendered outside nav with guaranteed 100% solid white background) */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl transition-all duration-300 ease-in-out z-[100] md:hidden ${
          menuOpen
            ? "translate-x-0 opacity-100 visible pointer-events-auto"
            : "translate-x-full opacity-0 invisible pointer-events-none"
        }`}
        style={{ backgroundColor: "#ffffff" }}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col h-full bg-white p-6 gap-5 text-sm font-medium overflow-y-auto" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex items-center justify-between pb-4 border-b border-divider">
            <span className="font-bold text-darkerb text-base">Menu</span>
            <button
              onClick={toggleMenu}
              aria-label="Close menu"
              className="p-1 rounded-lg hover:bg-offwhite transition-colors"
            >
              <FiX className="text-xl text-primary" />
            </button>
          </div>

          <Link
            to="/"
            className="text-darkerb font-semibold hover:text-primary transition-colors py-1"
            onClick={toggleMenu}
          >
            Home
          </Link>
          <a
            href={APP_LINKS.appointments}
            className="text-darkerb font-semibold hover:text-primary transition-colors py-1"
            onClick={toggleMenu}
          >
            Appointments
          </a>
          <a
            href={APP_LINKS.anonymous}
            className="text-darkerb font-semibold hover:text-primary transition-colors py-1"
            onClick={toggleMenu}
          >
            DAnonymous
          </a>
          <a
            href="#faq"
            className="text-darkerb font-semibold hover:text-primary transition-colors py-1"
            onClick={toggleMenu}
          >
            FAQs
          </a>
          <Link
            to="/privacy-policy"
            className="text-darkerb font-semibold hover:text-primary transition-colors py-1"
            onClick={toggleMenu}
          >
            Privacy Policy
          </Link>

          <hr className="border-divider my-2" />

          <div className="flex flex-col gap-3 mt-auto">
            <a
              href={APP_LINKS.login}
              className="text-center font-semibold border border-primary text-primary px-4 py-2.5 rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
            >
              Login
            </a>
            <a
              href={APP_LINKS.signup}
              className="text-center font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-darkerb transition-all duration-200 shadow-xs"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

