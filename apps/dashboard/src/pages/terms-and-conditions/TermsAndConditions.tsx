import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import TermsAndConditions from '../../components/terms-and-conditions/TermsAndConditions';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Top Navigation Bar with Brand Logo */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-divider shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo on the left */}
          <Link
            to="/"
            className="inline-flex items-center group transition-transform hover:scale-[1.01]"
          >
            <img
              src="/images/logo.png"
              alt="DTherapist Logo"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain"
            />
          </Link>

          {/* Action Links on the right */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              to="/auth/signup"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 hover:text-darkerb bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Back to Sign Up</span>
            </Link>
            <Link
              to="/auth/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-darkerb transition-colors shadow-xs"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="bg-white border-b border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center sm:text-left">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-darkerb tracking-tight leading-tight">
              Terms & Conditions
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Clear, transparent guidelines and standards for mental health professionals and clients using DTherapist.
            </p>

            {/* Quick Metadata Highlights */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Applies to all professionals & clients
              </span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <Lock className="w-4 h-4 text-primary" />
                HIPAA & Data Privacy Standards
              </span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span>Last updated: November 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <TermsAndConditions />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-divider mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="DTherapist"
              className="h-6 w-auto object-contain opacity-80"
            />
            <span>© {new Date().getFullYear()} DTherapist. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/auth/login"
              className="hover:text-primary transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/auth/signup"
              className="hover:text-primary transition-colors font-medium"
            >
              Create Account
            </Link>
            <a
              href="mailto:support@dtherapist.com"
              className="hover:text-primary transition-colors font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
