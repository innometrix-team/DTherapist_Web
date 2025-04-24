import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center relative z-50">
        <div className="text-xl font-bold text-Dblue">
          <Link to="/">DTherapist</Link>
        </div>

        {/* Desktop Links */}
        <ul className="hidden md:flex gap-6 text-sm font-medium">
          <li><Link to="/" className="hover:text-Dblue">Home</Link></li>
          <li><Link to="/therapists" className="hover:text-Dblue">Therapists</Link></li>
          <li><Link to="/reviews" className="hover:text-Dblue">Reviews</Link></li>
          <li><Link to="/faqs" className="hover:text-Dblue">FAQs</Link></li>
        </ul>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-4">
          <Link to="/auth/login" className="text-sm border border-Dblue text-Dblue px-4 py-1 rounded hover:bg-Dblue hover:text-white transition-all">Login</Link>
          <Link to="/auth/signup" className="text-sm bg-Dblue text-white px-4 py-1 rounded hover:bg-Dblue transition-all">Register</Link>
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {menuOpen ? <FiX className="text-2xl text-Dblue" /> : <FiMenu className="text-2xl text-Dblue" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col p-6 gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-Dblue" onClick={toggleMenu}>Home</Link>
            <Link to="/therapists" className="hover:text-Dblue" onClick={toggleMenu}>Therapists</Link>
            <Link to="/reviews" className="hover:text-Dblue" onClick={toggleMenu}>Reviews</Link>
            <Link to="/faqs" className="hover:text-Dblue" onClick={toggleMenu}>FAQs</Link>

            <hr />

            <Link to="/auth/login" className="border border-Dblue text-Dblue px-4 py-2 rounded hover:bg-Dblue hover:text-white transition-all" onClick={toggleMenu}>Login</Link>
            <Link to="/auth/signup" className="bg-Dblue text-white px-4 py-2 rounded hover:bg-Dblue transition-all" onClick={toggleMenu}>Register</Link>
          </div>
        </div>

        {/* Overlay */}
        {menuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleMenu}></div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
