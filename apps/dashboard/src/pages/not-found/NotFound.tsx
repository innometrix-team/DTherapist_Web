import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  LogIn,
} from "lucide-react";
import { useAuthStore } from "../../store/auth/useAuthStore";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = !!token;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      void navigate(-1);
    } else {
      void navigate(isAuthenticated ? "/" : "/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-offwhite flex flex-col justify-between text-darkerb antialiased">
      {/* Top Navigation Bar */}
      <header className="w-full bg-white border-b border-divider/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/images/logo.png"
              alt="DTherapist Logo"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral hover:text-darkerb transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </header>

      {/* Main 404 Hero Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Large Stylized 404 */}
          <h1 className="text-7xl sm:text-9xl font-black text-primary tracking-tight select-none mb-2">
            404
          </h1>

          {/* Heading & Empathic Copy */}
          <h2 className="text-2xl sm:text-3xl font-bold text-darkerb mb-3">
            Lost your way? We&apos;ve got your back.
          </h2>
          <p className="text-base sm:text-lg text-neutral max-w-lg mx-auto mb-8 leading-relaxed">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-50 border border-divider text-darkerb font-medium shadow-xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-neutral" />
                  <span>Go Back</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/auth/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-50 border border-divider text-darkerb font-medium shadow-xs transition-all cursor-pointer"
                >
                  <span>Create an Account</span>
                </Link>
              </>
            )}
          </div>

          {/* Helpful Destination Tiles */}
          {isAuthenticated && (
            <div className="border-t border-divider/60 pt-8 text-left">
              <p className="text-xs font-semibold text-neutral uppercase tracking-wider text-center mb-4">
                Popular destinations you might be looking for
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                <Link
                  to="/appointments"
                  className="flex items-center gap-3.5 p-3.5 bg-white border border-divider/80 rounded-xl hover:border-primary/50 hover:shadow-xs transition-all group"
                >
                  <Calendar className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-sm font-semibold text-darkerb group-hover:text-primary transition-colors">
                      Appointments
                    </h3>
                    <p className="text-xs text-neutral">
                      Manage upcoming and past sessions
                    </p>
                  </div>
                </Link>

                <Link
                  to="/counselor"
                  className="flex items-center gap-3.5 p-3.5 bg-white border border-divider/80 rounded-xl hover:border-primary/50 hover:shadow-xs transition-all group"
                >
                  <Users className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-sm font-semibold text-darkerb group-hover:text-primary transition-colors">
                      Therapists & Psychologists
                    </h3>
                    <p className="text-xs text-neutral">
                      Find a qualified mental health expert
                    </p>
                  </div>
                </Link>

                <Link
                  to="/anonymous"
                  className="flex items-center gap-3.5 p-3.5 bg-white border border-divider/80 rounded-xl hover:border-primary/50 hover:shadow-xs transition-all group"
                >
                  <MessageSquare className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-sm font-semibold text-darkerb group-hover:text-primary transition-colors">
                      DAnonymous Community
                    </h3>
                    <p className="text-xs text-neutral">
                      Join safe, confidential discussions
                    </p>
                  </div>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center gap-3.5 p-3.5 bg-white border border-divider/80 rounded-xl hover:border-primary/50 hover:shadow-xs transition-all group"
                >
                  <Settings className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-sm font-semibold text-darkerb group-hover:text-primary transition-colors">
                      Account Settings
                    </h3>
                    <p className="text-xs text-neutral">
                      Manage profile, security & wallet
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-divider/60 py-4 px-6 text-center text-xs text-neutral">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} DTherapist. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link
              to="/terms-and-conditions"
              className="hover:text-darkerb transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-darkerb transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
