import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SessionType } from "./types";
import { ChevronDown, User, Video, MapPin, Users, Loader2 } from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  getTherapistsApi,
  getCategoriesApi,
  ITherapist,
  ITherapistListParams,
  convertCategoriesToObjects,
} from "../../api/Therapist.api";
import { getTherapistScheduleApi } from "../../api/TherapistSchedule.api";
import toast from "react-hot-toast";

interface TherapistListProps {
  onBookAppointment: (therapistId: string, sessionType: SessionType) => void;
  onViewProfile: (therapistId: string) => void;
}

// Dropdown menu — receives supportsGroup as a plain boolean (no internal fetch)
const TherapistDropdownMenu: React.FC<{
  therapist: ITherapist;
  supportsGroup: boolean;
  dropdownPosition: { top?: string; bottom?: string };
  onBook: (therapistId: string, sessionType: SessionType) => void;
}> = ({ therapist, supportsGroup, dropdownPosition, onBook }) => (
  <div
    className="dropdown-menu absolute left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-300 z-50"
    style={{
      top: dropdownPosition.top,
      bottom: dropdownPosition.bottom,
      marginTop: dropdownPosition.bottom ? "0" : "0.5rem",
      marginBottom: dropdownPosition.bottom ? "0.5rem" : "0",
    }}
  >
    <button
      onClick={() => onBook(therapist.userId, "video")}
      className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 text-sm"
    >
      <Video className="w-4 h-4 text-primary" />
      <span>Video Call</span>
    </button>
    <button
      onClick={() => onBook(therapist.userId, "physical")}
      className={`flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 text-sm ${supportsGroup ? "border-b border-gray-100" : ""}`}
    >
      <MapPin className="w-4 h-4 text-success" />
      <span>Physical Meeting</span>
    </button>
    {supportsGroup && (
      <button
        onClick={() => onBook(therapist.userId, "group")}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 text-sm"
      >
        <Users className="w-4 h-4 text-primary" />
        <span>Team Meeting</span>
      </button>
    )}
  </div>
);

const MobileTherapistDropdown: React.FC<{
  therapist: ITherapist;
  supportsGroup: boolean;
  dropdownPosition: { top?: string; bottom?: string };
  onBook: (therapistId: string, sessionType: SessionType) => void;
}> = ({ therapist, supportsGroup, dropdownPosition, onBook }) => (
  <div
    className="dropdown-menu absolute left-0 w-full bg-white rounded-lg shadow-lg border z-50"
    style={{
      top: dropdownPosition.top,
      bottom: dropdownPosition.bottom,
      marginTop: dropdownPosition.bottom ? "0" : "0.5rem",
      marginBottom: dropdownPosition.bottom ? "0.5rem" : "0",
    }}
  >
    <button
      onClick={() => onBook(therapist.userId, "video")}
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 text-sm sm:text-base"
    >
      <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
      <span>Video Call</span>
    </button>
    <button
      onClick={() => onBook(therapist.userId, "physical")}
      className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 text-sm sm:text-base ${supportsGroup ? "border-b border-gray-100" : ""}`}
    >
      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
      <span>Physical Meeting</span>
    </button>
    {supportsGroup && (
      <button
        onClick={() => onBook(therapist.userId, "group")}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 text-sm sm:text-base"
      >
        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <span>Team Meeting</span>
      </button>
    )}
  </div>
);

const TherapistList: React.FC<TherapistListProps> = ({
  onBookAppointment,
  onViewProfile,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: string;
    bottom?: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const trimText = (text: string, maxLength: number = 20): string => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength).trim() + "..."
      : text;
  };

  const toggleDropdown = (therapistId: string) => {
    setOpenDropdown((prev) => {
      const newValue = prev === therapistId ? null : therapistId;
      if (newValue) {
        setTimeout(() => {
          const button = document.querySelector(
            `[data-dropdown-id="${therapistId}"]`
          );
          if (button) {
            const rect = button.getBoundingClientRect();
            const dropdownHeight = 160;
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            const position: { top?: string; bottom?: string } = {};
            if (spaceBelow >= dropdownHeight) {
              position.top = "100%";
            } else if (spaceAbove >= dropdownHeight) {
              position.bottom = "100%";
            } else {
              position.top = "100%";
            }
            setDropdownPosition(position);
          }
        }, 0);
      }
      return newValue;
    });
  };

  const handleBooking = (therapistId: string, sessionType: SessionType) => {
    onBookAppointment(therapistId, sessionType);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        openDropdown &&
        !target.closest(".dropdown-container") &&
        !target.closest(".dropdown-menu")
      ) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const result = await getCategoriesApi({ signal: controller.signal });
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: therapistsResponse,
    isLoading: therapistsLoading,
    error: therapistsError,
    refetch: refetchTherapists,
  } = useQuery({
    queryKey: ["therapists", selectedCategory, searchQuery, currentPage],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const params: ITherapistListParams = { page: currentPage, limit: 10 };
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const result = await getTherapistsApi(params, { signal: controller.signal });
      if (!result) throw new Error("Request cancelled");
      return result;
    },
    staleTime: 2 * 60 * 1000,
  });

  const therapists = useMemo(
  () => therapistsResponse?.data?.therapists || [],
  [therapistsResponse?.data?.therapists]
);

  // Prefetch all schedules for the current page of therapists in parallel
  // so the "Team Meeting" option is ready before the dropdown opens
  const scheduleQueries = useQueries({
    queries: therapists.map((t: ITherapist) => ({
      queryKey: ["therapist-schedule", t.userId, "video"],
      queryFn: async () => {
        const result = await getTherapistScheduleApi(t.userId, "video");
        if (!result) throw new Error("Request cancelled");
        return result;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Build a map of therapistId -> supportsGroup for O(1) lookup in the render
  const groupSupportMap = useMemo(() => {
    const map = new Map<string, boolean>();
    therapists.forEach((t: ITherapist, i: number) => {
      const data = scheduleQueries[i]?.data;
      const schedules = data?.data?.schedules || [];
      map.set(t.userId, schedules.some((s) => s.isAvailable && s.allowGroupBooking === true));
    });
    return map;
  }, [therapists, scheduleQueries]);

  const getCostDisplay = (
  cost: { video: number; inPerson: number; groupVideo?: number } | number | null
): string => {
  if (typeof cost === "number") return `₦${cost}.00/hr`;
  if (typeof cost === "object" && cost !== null) {
    const { video, inPerson, groupVideo } = cost;
    const hasGroup = groupVideo !== undefined && groupVideo !== null;

    if (video === inPerson && !hasGroup) return `₦${video}.00/hr`;
    if (video === inPerson && hasGroup) return `₦${video}.00 ₦${groupVideo}/hr`;

    if (!hasGroup) return `₦${video}/₦${inPerson}/hr`;
    return `₦${video}/₦${inPerson} ₦${groupVideo}/hr`;
  }
  return "Contact for pricing";
};

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (categoriesError) toast.error("Failed to load categories");
  }, [categoriesError]);

  useEffect(() => {
    if (therapistsError) toast.error("Failed to load therapists");
  }, [therapistsError]);

  const renderStars = (rating: number | null) => {
    const validRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm lg:text-base ${i < validRating ? "text-yellow-400" : "text-gray-300"}`}
      >
        ★
      </span>
    ));
  };

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.target as HTMLImageElement;
      img.src = "https://placehold.net/avatar-4.png";
    },
    []
  );

  const totalPages = therapistsResponse?.data?.totalPages || 1;
  const totalCount = therapistsResponse?.data?.totalCount || 0;

  const categories = categoriesResponse?.data?.categories
    ? convertCategoriesToObjects(categoriesResponse.data.categories)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="relative h-24 sm:h-32 bg-black/50 bg-no-repeat bg-center bg-cover overflow-hidden rounded-lg shadow-sm p-4 sm:p-6 m-4 sm:m-6"
        style={{
          backgroundImage:
            "url(https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637)",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-semibold text-center">
            Our Counselors
          </h1>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Search + Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <div className="relative w-full sm:w-auto sm:min-w-45">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none px-3 sm:px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm sm:text-base"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories.map((category: { id: string; name: string }) => (
                  <option key={category.id} value={category.name}>
                    {trimText(category.name, 25)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Search for Counselor"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-3 sm:pl-4 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              />
            </div>
          </div>
          {totalCount > 0 && (
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
              {totalCount} counselor{totalCount > 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Loading */}
        {therapistsLoading && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 text-sm sm:text-base">
              Loading counselors...
            </span>
          </div>
        )}

        {/* Error */}
        {therapistsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-red-600 mb-4 text-sm sm:text-base">
              Failed to load counselors
            </p>
            <button
              onClick={() => refetchTherapists()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No results */}
        {!therapistsLoading && !therapistsError && therapists.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
            <p className="text-gray-600 text-base sm:text-lg">
              No counselors found
            </p>
            {(selectedCategory || searchQuery) && (
              <button
                onClick={() => { setSelectedCategory(""); setSearchQuery(""); }}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Desktop Table */}
        {!therapistsLoading && !therapistsError && therapists.length > 0 && (
          <>
            <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-x-auto overflow-y-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Names</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {therapists.map((therapist: ITherapist) => (
                    <tr
                      key={therapist.userId}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={therapist.profilePicture || "https://via.placeholder.com/48x48/e5e7eb/9ca3af?text=User"}
                            alt={therapist.name}
                            className="w-8 h-8 lg:w-12 lg:h-12 rounded-full object-cover shrink-0"
                            onError={handleImageError}
                          />
                          <span className="font-medium text-gray-900 text-sm lg:text-base">
                            {trimText(therapist.name, 20)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 text-gray-600 text-xs lg:text-sm">
                        {trimText(therapist.category, 20)}
                      </td>
                      <td className="px-3 lg:px-6 py-4">
                        <div className="flex">{renderStars(therapist.reviews.averageRating)}</div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 text-gray-600 text-xs lg:text-sm">
                        {therapist.experience} years
                      </td>
                      <td className="px-3 lg:px-6 py-4 font-semibold text-gray-900 text-xs lg:text-sm">
                        {getCostDisplay(therapist.cost)}
                      </td>
                      <td className="px-3 lg:px-6 py-4 relative dropdown-container">
                        <button
                          data-dropdown-id={therapist.userId}
                          onClick={() => toggleDropdown(therapist.userId)}
                          className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 lg:py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs lg:text-sm"
                        >
                          <span className="whitespace-nowrap">Book</span>
                          <ChevronDown
                            className={`w-3 h-3 lg:w-4 lg:h-4 shrink-0 transition-transform ${openDropdown === therapist.userId ? "rotate-180" : ""}`}
                          />
                        </button>
                        {openDropdown === therapist.userId && (
                          <TherapistDropdownMenu
                            therapist={therapist}
                            supportsGroup={groupSupportMap.get(therapist.userId) ?? false}
                            dropdownPosition={dropdownPosition}
                            onBook={handleBooking}
                          />
                        )}
                      </td>
                      <td className="px-3 lg:px-6 py-4 text-center">
                        <button
                          onClick={() => onViewProfile(therapist.userId)}
                          className="p-1 lg:p-2 hover:bg-gray-100 transition-colors border border-gray-300 rounded-full"
                          title="View Profile"
                        >
                          <User className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {therapists.map((therapist: ITherapist) => (
                <div
                  key={therapist.userId}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <img
                      src={therapist.profilePicture || "https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=User"}
                      alt={therapist.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shrink-0"
                      onError={handleImageError}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-lg mb-1 truncate">
                        {therapist.name}
                      </h3>
                      <p className="text-gray-600 mb-2 text-xs sm:text-sm">
                        {trimText(therapist.category, 30)}
                      </p>
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 flex-wrap">
                        <div className="flex">{renderStars(therapist.reviews.averageRating)}</div>
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {therapist.experience} years
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {getCostDisplay(therapist.cost)}
                        </span>
                        <button
                          onClick={() => onViewProfile(therapist.userId)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                          title="View Profile"
                        >
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Action Button */}
                  <div className="relative dropdown-container border-t border-gray-100 pt-3">
                    <button
                      data-dropdown-id={therapist.userId}
                      onClick={() => toggleDropdown(therapist.userId)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 sm:py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      <span>Book Appointment</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${openDropdown === therapist.userId ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openDropdown === therapist.userId && (
                      <MobileTherapistDropdown
                        therapist={therapist}
                        supportsGroup={groupSupportMap.get(therapist.userId) ?? false}
                        dropdownPosition={dropdownPosition}
                        onBook={handleBooking}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex justify-center gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              const shouldShow =
                pageNum === 1 ||
                pageNum === totalPages ||
                Math.abs(pageNum - currentPage) <= 1;
              if (!shouldShow && totalPages > 5) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm ${
                    currentPage === pageNum
                      ? "bg-primary text-white border-primary"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistList;