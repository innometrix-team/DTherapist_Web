import { ArrowLeft, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import DAnonymousGroups from "../../components/anonymous/DAnonymousGroups";
import { useGroups } from "../../hooks/useGroups";

const DAnonymous = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: groupsData, isLoading, isError } = useGroups();
  const rawGroups = groupsData?.data;
  const groups = useMemo(() => rawGroups ?? [], [rawGroups]);
  const hasSelectedGroup = Boolean(groupId);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  return (
    <div className="flex bg-gray-50 relative h-full overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`bg-white border-r border-gray-200 transition-all h-full duration-300 ease-in-out z-50
        ${hasSelectedGroup ? "w-80" : "max-w-96 w-[90%]"}
        md:relative md:translate-x-0
        ${
          isMobileMenuOpen
            ? "fixed inset-y-0 left-0 w-80 translate-x-0"
            : "fixed inset-y-0 left-0 w-80 -translate-x-full"
        }
        ${hasSelectedGroup && !isMobileMenuOpen ? "md:block hidden" : ""}
        ${!hasSelectedGroup ? "md:block" : ""}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for Groups"
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl border-0 focus:ring-2 focus:ring-primary focus:outline-none lg:text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-3 w-44 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-xs text-red-500 mb-2">Failed to load groups.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-6 text-center text-neutral text-xs">
            {searchQuery
              ? "No groups match your search."
              : "No support groups available at the moment."}
          </div>
        ) : (
          <DAnonymousGroups
            groups={filteredGroups}
            onGroupSelect={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>

      <div
        className={`flex-1 flex flex-col ${
          hasSelectedGroup ? "block" : "md:flex"
        }`}
      >
        <Outlet context={{ groups, isLoading }} />
      </div>

      {/* Mobile-only */}
      {!hasSelectedGroup && (
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
