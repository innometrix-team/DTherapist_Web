import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { PeopleIcon } from "../../assets/icons";
import DAnonymousGroups from "../../components/anonymous/DAnonymousGroups";
import { DUMMY_GROUPS } from "./types";

const DAnonymous = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const selectedGroup = DUMMY_GROUPS.find((g) => g.id === groupId);

  return (
    <div className="flex bg-gray-50 relative h-full overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50  z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`bg-white border-r border-gray-200 transition-all h-full duration-300 ease-in-out z-50
        ${selectedGroup ? "w-80" : "max-w-96 w-[90%]"}
        md:relative md:translate-x-0
        ${
          isMobileMenuOpen
            ? "fixed inset-y-0 left-0 w-80 translate-x-0"
            : "fixed inset-y-0 left-0 w-80 -translate-x-full"
        }
        ${selectedGroup && !isMobileMenuOpen ? "md:block hidden" : ""}
        ${!selectedGroup ? "md:block" : ""}
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h1 className="text-lg font-semibold text-gray-900">Groups</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for Groups"
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl border-0 focus:ring-2 focus:ring-primary focus:outline-none lg:text-sm"
            />
          </div>
        </div>

        <DAnonymousGroups onGroupSelect={() => setIsMobileMenuOpen(false)} />
      </div>

      <div
        className={`flex-1 flex flex-col ${
          selectedGroup ? "block" : "md:flex"
        }`}
      >
        {!selectedGroup ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <PeopleIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                Welcome to DAnonymous
              </h2>
              <p className="text-gray-500 mb-6">
                Select a group to start participating in meaningful
                conversations with others on similar journeys anonymously.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{DUMMY_GROUPS.length} Active Groups</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>200 conversations</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>

      {/* Mobile-only */}
      {!selectedGroup && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-30"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default DAnonymous;
