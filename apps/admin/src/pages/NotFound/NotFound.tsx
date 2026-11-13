import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Users, Calendar, DollarSign } from "lucide-react";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      void navigate(-1);
    } else {
      void navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between text-gray-900 antialiased">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/images/logo.png"
              alt="DTherapist Admin"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </header>

      {/* Hero 404 */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-7xl sm:text-9xl font-black text-primary tracking-tight select-none mb-2">
            404
          </h1>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Admin View Not Found
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
            The admin resource, user account, or management page you requested does not exist or has been relocated.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Overview</span>
            </Link>
            <button
              type="button"
              onClick={handleGoBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Quick Admin Links */}
          <div className="border-t border-gray-200 pt-8 text-left max-w-lg mx-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-4">
              Quick Admin Navigation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/user"
                className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-xl hover:border-primary/50 text-center transition-all group"
              >
                <Users className="w-5 h-5 text-primary mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-800">User Management</span>
              </Link>
              <Link
                to="/bookings"
                className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-xl hover:border-primary/50 text-center transition-all group"
              >
                <Calendar className="w-5 h-5 text-primary mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-800">Bookings</span>
              </Link>
              <Link
                to="/transaction"
                className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-xl hover:border-primary/50 text-center transition-all group"
              >
                <DollarSign className="w-5 h-5 text-primary mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-800">Transactions</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} DTherapist Management Portal</span>
          <span>Antigravity Platform</span>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
