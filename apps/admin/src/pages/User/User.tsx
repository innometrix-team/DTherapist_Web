import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GetAllUsersApi, GetAllUsersParams, type UserListItem } from "../../api/GetUsers.api";
import Pagination from "../../components/pagination/Pagination";

interface UserFilters {
  search: string;
  role: string;
  isSuspended: string;
  professionalCategory: string;
  professionalCategoryRequestStatus: string;
}

function User() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const itemsPerPage = 20;

  // Get filters and pagination from URL params with defaults
  const filters: UserFilters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      role: searchParams.get("role") || "all",
      isSuspended: searchParams.get("isSuspended") || "all",
      professionalCategory: searchParams.get("professionalCategory") || "all",
      professionalCategoryRequestStatus:
        searchParams.get("professionalCategoryRequestStatus") || "all",
    }),
    [searchParams]
  );

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const updateUrlParams = (
    updates: Partial<UserFilters & { page: number }>
  ) => {
    const newParams = new URLSearchParams(searchParams);

    // Update each parameter
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all" && value !== 1) {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams);
  };

  const setFilters = (newFilters: UserFilters) => {
    updateUrlParams({
      ...newFilters,
      page: 1, // Reset to first page when filters change
    });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  // Query to fetch users
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "admin-users",
      filters.professionalCategoryRequestStatus,
      filters.professionalCategory,
    ],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const params: GetAllUsersParams = {};
      if (
        filters.professionalCategoryRequestStatus &&
        filters.professionalCategoryRequestStatus !== "all"
      ) {
        params.professionalCategoryRequestStatus =
          filters.professionalCategoryRequestStatus as
            | "pending"
            | "approved"
            | "rejected";
      }
      if (
        filters.professionalCategory &&
        filters.professionalCategory !== "all"
      ) {
        params.professionalCategory = filters.professionalCategory as
          | "counselor"
          | "psychologist";
      }

      const response = await GetAllUsersApi(params, {
        signal: controller.signal,
      });

      if (!response?.data) {
        throw new Error("No users data received");
      }

      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const filteredUsers = useMemo(() => {
    const users = (usersData || [])
      .filter((user) => user.role !== "admin")
      .map((user) => ({
        ...user,
        role:
          user.role === "therapist"
            ? "counselor"
            : user.role === "client"
            ? "user"
            : user.role,
      }));

    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        filters.search === "" ||
        user.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase());

      // Role filter
      const matchesRole = filters.role === "all" || user.role === filters.role;

      // Suspension filter
      const matchesSuspension =
        filters.isSuspended === "all" ||
        (filters.isSuspended === "true" && user.isSuspended) ||
        (filters.isSuspended === "false" && !user.isSuspended);

      // Profession category filter
      const matchesProfession =
        filters.professionalCategory === "all" ||
        user.professionalCategory === filters.professionalCategory;

      // Profession request status filter
      const reqStatus =
        user.professionalCategoryRequestStatus ||
        user.professionalCategoryRequest?.status;
      const matchesReqStatus =
        filters.professionalCategoryRequestStatus === "all" ||
        reqStatus === filters.professionalCategoryRequestStatus;

      return (
        matchesSearch &&
        matchesRole &&
        matchesSuspension &&
        matchesProfession &&
        matchesReqStatus
      );
    });
  }, [usersData, filters]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const userCount = useMemo(() => {
    const data = usersData || [];
    return {
      counselors: data.filter((user) => user.role === "therapist").length ?? 0,
      users: data.filter((user) => user.role === "client").length ?? 0,
    };
  }, [usersData]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Validate page number and adjust if necessary
  useEffect(() => {
    if (filteredUsers.length > 0) {
      const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
      if (currentPage > totalPages) {
        updateUrlParams({ page: 1 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUsers.length, currentPage, itemsPerPage]);

  const getSuspensionStatus = (isSuspended: boolean) => {
    return isSuspended ? "suspended" : "active";
  };

  const getStatusColor = (isSuspended: boolean) => {
    return isSuspended
      ? "bg-red-100 text-red-800"
      : "bg-green-100 text-green-800";
  };

  const getRoleColor = (role: string, professionalCategory?: string) => {
    if (professionalCategory === "psychologist") {
      return "bg-indigo-100 text-indigo-800";
    }
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "counselor":
      case "therapist":
        return "bg-blue-100 text-blue-800";
      case "user":
      case "client":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string, professionalCategory?: string) => {
    if (role === "counselor" || role === "therapist") {
      if (professionalCategory === "psychologist") return "Psychologist";
      return "Counselor";
    }
    if (role === "user" || role === "client") return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleOpenUser = (user: UserListItem) => {
    void navigate(`/user/${user._id}`, {
      state: { userSummary: user },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 text-sm">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">
          Error loading users. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Users Management
        </h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="counselor">Counselors</option>
            <option value="user">Users</option>
          </select>

          {/* Profession Filter (Item 7) */}
          <select
            value={filters.professionalCategory}
            onChange={(e) =>
              setFilters({ ...filters, professionalCategory: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Professions</option>
            <option value="psychologist">Psychologists</option>
            <option value="counselor">Counselors</option>
          </select>

          {/* Profession Request Status Filter (Item 8) */}
          <select
            value={filters.professionalCategoryRequestStatus}
            onChange={(e) =>
              setFilters({
                ...filters,
                professionalCategoryRequestStatus: e.target.value,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Request Statuses</option>
            <option value="pending">Pending Profession Requests</option>
            <option value="approved">Approved Requests</option>
            <option value="rejected">Rejected Requests</option>
          </select>

          {/* Suspension Status Filter */}
          <select
            value={filters.isSuspended}
            onChange={(e) =>
              setFilters({ ...filters, isSuspended: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm text-gray-600 mb-6">
          <span>Counselors: {userCount.counselors.toLocaleString()}</span>
          <span>Users: {userCount.users.toLocaleString()}</span>
        </div>
      </div>

      {/* Users Table (Responsive) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3 p-3">
          {paginatedUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}

          {paginatedUsers.map((user) => (
            <div
              key={user._id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {user.fullName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      Alias: {user.alias || 'Not set'}
                    </div>
                    {user.createdAt && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        Registered: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getRoleColor(
                      user.role,
                      user.professionalCategory
                    )}`}
                  >
                    {getRoleLabel(user.role, user.professionalCategory)}
                  </span>
                  {(user.professionalCategoryRequestStatus === "pending" ||
                    user.professionalCategoryRequest?.status === "pending") && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800">
                      Req: → {user.professionalCategoryRequest?.requestedCategory || user.professionalCategoryRequest?.professionalCategory || (user.professionalCategory === "counselor" ? "Psychologist" : "Counselor")}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${getStatusColor(
                      user.isSuspended
                    )}`}
                  >
                    {getSuspensionStatus(user.isSuspended)}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <button
                  onClick={() => handleOpenUser(user)}
                  className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 text-blue-700 border-blue-200 cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet View */}
        <div className="hidden sm:block lg:hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  {/* User Info with Alias */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          Alias: {user.alias || 'Not set'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          user.role,
                          user.professionalCategory
                        )}`}
                      >
                        {getRoleLabel(user.role, user.professionalCategory)}
                      </span>
                      {(user.professionalCategoryRequestStatus === "pending" ||
                        user.professionalCategoryRequest?.status === "pending") && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800">
                          Req: → {user.professionalCategoryRequest?.requestedCategory || user.professionalCategoryRequest?.professionalCategory || (user.professionalCategory === "counselor" ? "Psychologist" : "Counselor")}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Registration Date (Item 1) */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                        user.isSuspended
                      )}`}
                    >
                      {getSuspensionStatus(user.isSuspended)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenUser(user)}
                      className="text-blue-600 hover:text-blue-900 font-medium cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Alias
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Registered
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  {/* User Info */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.fullName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Alias */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="truncate max-w-[120px]">
                      {user.alias || '-'}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          user.role,
                          user.professionalCategory
                        )}`}
                      >
                        {getRoleLabel(user.role, user.professionalCategory)}
                      </span>
                      {(user.professionalCategoryRequestStatus === "pending" ||
                        user.professionalCategoryRequest?.status === "pending") && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800">
                          Req: → {user.professionalCategoryRequest?.requestedCategory || user.professionalCategoryRequest?.professionalCategory || (user.professionalCategory === "counselor" ? "Psychologist" : "Counselor")}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="truncate max-w-[180px]">
                      {user.email}
                    </div>
                  </td>

                  {/* Registration Date (Item 1) */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                        user.isSuspended
                      )}`}
                    >
                      {getSuspensionStatus(user.isSuspended)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenUser(user)}
                      className="text-blue-600 hover:text-blue-900 font-medium cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}
        </div>
      </div>

      {/*  Pagination  */}
      {filteredUsers.length > 0 && (
        <div className="mt-6">
          <Pagination
            total={filteredUsers.length}
            page={currentPage}
            pageSize={itemsPerPage}
            onPageChange={handlePageChange}
            siblingCount={1}
            boundaryCount={1}
            showSummary
          />
        </div>
      )}
    </div>
  );
}

export default User;
