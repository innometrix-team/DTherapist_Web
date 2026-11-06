import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { SessionType } from "./types";
import { ChevronDown, User, Video, MapPin, Users, UserX } from "lucide-react";
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
import { QUERY_KEYS } from "../../configs/queryKeys.config";
import Skeleton, { SkeletonTable } from "../common/Skeleton";
import EmptyState from "../common/EmptyState";
import PageContainer from "../common/PageContainer";
import {
  formatTherapistCostSummary,
  formatSessionTypeRate,
} from "../../utils/currency.utils";

interface TherapistListProps {
  onBookAppointment: (therapistId: string, sessionType: SessionType) => void;
  onViewProfile: (therapistId: string) => void;
}

interface DropdownCoords {
  top: number;
  left: number;
  width?: number;
  openUp: boolean;
}

// Portal Dropdown menu — renders in document.body to avoid clipping inside overflow containers
const PortalDropdownMenu: React.FC<{
  therapist: ITherapist;
  supportsGroup: boolean;
  coords: DropdownCoords;
  onBook: (therapistId: string, sessionType: SessionType) => void;
  onClose: () => void;
}> = ({ therapist, supportsGroup, coords, onBook, onClose }) => {
  const isMobile = window.innerWidth < 1024;
  const videoRate = formatSessionTypeRate(therapist.cost, "video");
  const physicalRate = formatSessionTypeRate(therapist.cost, "physical");
  const groupRate = formatSessionTypeRate(therapist.cost, "group");

  return createPortal(
    <div
      className="dropdown-portal fixed bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] py-1 transition-opacity duration-150 ease-out"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width || 248}px`,
      }}
    >
      <button
        onClick={() => {
          onBook(therapist.userId, "video");
          onClose();
        }}
        className={`flex items-center justify-between gap-2 w-full px-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors cursor-pointer ${
          isMobile ? "text-sm sm:text-base py-3" : "text-sm py-2.5"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Video className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-gray-800">Video Call</span>
        </span>
        {videoRate && (
          <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
            {videoRate}
          </span>
        )}
      </button>
      <button
        onClick={() => {
          onBook(therapist.userId, "physical");
          onClose();
        }}
        className={`flex items-center justify-between gap-2 w-full px-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
          supportsGroup ? "border-b border-gray-100" : ""
        } ${isMobile ? "text-sm sm:text-base py-3" : "text-sm py-2.5"}`}
      >
        <span className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-success shrink-0" />
          <span className="font-medium text-gray-800">Physical Meeting</span>
        </span>
        {physicalRate && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {physicalRate}
          </span>
        )}
      </button>
      {supportsGroup && (
        <button
          onClick={() => {
            onBook(therapist.userId, "group");
            onClose();
          }}
          className={`flex items-center justify-between gap-2 w-full px-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
            isMobile ? "text-sm sm:text-base py-3" : "text-sm py-2.5"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-gray-800">Team Meeting</span>
          </span>
          {groupRate && (
            <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
              {groupRate}
            </span>
          )}
        </button>
      )}
    </div>,
    document.body
  );
};

const TherapistList: React.FC<TherapistListProps> = ({
  onBookAppointment,
  onViewProfile,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<DropdownCoords | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<"" | "counselor" | "psychologist">("");
  const [currentPage, setCurrentPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const trimText = (text: string, maxLength: number = 20): string => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength).trim() + "..."
      : text;
  };

  const toggleDropdown = (therapistId: string, buttonEl?: HTMLElement) => {
    if (openDropdown === therapistId) {
      setOpenDropdown(null);
      setDropdownCoords(null);
      return;
    }

    if (buttonEl) {
      const rect = buttonEl.getBoundingClientRect();
      const dropdownHeight = 155;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight;

      const isMobile = window.innerWidth < 1024;
      const width = isMobile ? rect.width : 248;
      const left = isMobile
        ? rect.left
        : Math.max(8, Math.min(rect.left, window.innerWidth - 248 - 16));
      const top = openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4;

      setDropdownCoords({ top, left, width, openUp });
    }
    setOpenDropdown(therapistId);
  };

  const handleBooking = (therapistId: string, sessionType: SessionType) => {
    onBookAppointment(therapistId, sessionType);
    setOpenDropdown(null);
    setDropdownCoords(null);
  };

  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (
        target?.closest?.(".dropdown-portal") ||
        target?.closest?.(`[data-dropdown-id="${openDropdown}"]`)
      ) {
        return;
      }
      setOpenDropdown(null);
      setDropdownCoords(null);
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(".dropdown-portal")) return;
      setOpenDropdown(null);
      setDropdownCoords(null);
    };

    const handleResize = () => {
      setOpenDropdown(null);
      setDropdownCoords(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [openDropdown]);

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: QUERY_KEYS.therapists.categories,
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
    queryKey: QUERY_KEYS.therapists.list(
      selectedCategory,
      searchQuery,
      currentPage,
      selectedProfession || undefined
    ),
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
      if (selectedProfession) {
        params.professionalCategory = selectedProfession;
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
      queryKey: QUERY_KEYS.therapists.schedule(t.userId, "video"),
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
      map.set(t.userId, schedules.some((s) => s.isAvailable && s.teamBooking === true));
    });
    return map;
  }, [therapists, scheduleQueries]);

  const activeTherapist = useMemo(
    () => therapists.find((t: ITherapist) => t.userId === openDropdown),
    [therapists, openDropdown]
  );

  const getCostDisplay = (cost: ITherapist["cost"]): string =>
    formatTherapistCostSummary(cost);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleProfessionChange = useCallback((profession: "" | "counselor" | "psychologist") => {
    setSelectedProfession(profession);
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
      <PageContainer>
        {/* Hero Section */}
        <div
          className="relative w-full h-24 sm:h-32 lg:h-40 bg-black/50 bg-no-repeat bg-center bg-cover overflow-hidden rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6"
          style={{
            backgroundImage:
              "url(https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637)",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-blue-900/20 to-purple-900/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-semibold text-center">
              Our Professionals
            </h1>
          </div>
        </div>

        <div>
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
            <div className="relative w-full sm:w-auto sm:min-w-45">
              <select
                value={selectedProfession}
                onChange={(e) =>
                  handleProfessionChange(
                    e.target.value as "" | "counselor" | "psychologist"
                  )
                }
                className="appearance-none px-3 sm:px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm sm:text-base cursor-pointer"
              >
                <option value="">All Professions</option>
                <option value="counselor">Counselors</option>
                <option value="psychologist">Psychologists</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Search professionals..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-3 sm:pl-4 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              />
            </div>
          </div>
          {totalCount > 0 && (
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
              {totalCount} professional{totalCount > 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Loading Skeletons */}
        {therapistsLoading && (
          <div className="py-2 space-y-4">
            <div className="hidden lg:block">
              <SkeletonTable rows={5} />
            </div>
            <div className="lg:hidden space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 bg-white rounded-xl border border-divider shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {therapistsError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto my-4 shadow-xs">
            <p className="text-red-600 font-semibold mb-3 text-sm sm:text-base">
              Failed to load professionals
            </p>
            <button
              onClick={() => {
                void refetchTherapists();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!therapistsLoading && !therapistsError && therapists.length === 0 && (
          <EmptyState
            icon={UserX}
            title="No Professionals Found"
            description="We couldn't find any professionals matching your search query or category filter. Try clearing your filters or selecting a different specialization."
            actionText={selectedCategory || searchQuery || selectedProfession ? "Clear All Filters" : undefined}
            onActionClick={() => {
              setSelectedCategory("");
              setSearchQuery("");
              setSelectedProfession("");
            }}
          />
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
                          <div>
                            <span className="font-medium text-gray-900 text-sm lg:text-base block">
                              {trimText(therapist.name, 20)}
                            </span>
                            {therapist.professionalCategory && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize bg-blue-50 text-primary border border-blue-100">
                                {therapist.professionalCategory}
                              </span>
                            )}
                          </div>
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
                      <td className="px-3 lg:px-6 py-4">
                        <button
                          data-dropdown-id={therapist.userId}
                          onClick={(e) => toggleDropdown(therapist.userId, e.currentTarget)}
                          className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 lg:py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs lg:text-sm cursor-pointer"
                        >
                          <span className="whitespace-nowrap">Book</span>
                          <ChevronDown
                            className={`w-3 h-3 lg:w-4 lg:h-4 shrink-0 transition-transform ${openDropdown === therapist.userId ? "rotate-180" : ""}`}
                          />
                        </button>
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
                      {therapist.professionalCategory && (
                        <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-50 text-primary border border-blue-100">
                          {therapist.professionalCategory}
                        </span>
                      )}
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
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      data-dropdown-id={therapist.userId}
                      onClick={(e) => toggleDropdown(therapist.userId, e.currentTarget)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 sm:py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base cursor-pointer"
                    >
                      <span>Book Appointment</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${openDropdown === therapist.userId ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Global Portal Dropdown Menu - rendered outside overflow containers */}
        {activeTherapist && dropdownCoords && (
          <PortalDropdownMenu
            therapist={activeTherapist}
            supportsGroup={groupSupportMap.get(activeTherapist.userId) ?? false}
            coords={dropdownCoords}
            onBook={handleBooking}
            onClose={() => {
              setOpenDropdown(null);
              setDropdownCoords(null);
            }}
          />
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
    </PageContainer>
  </div>
);
};

export default TherapistList;
