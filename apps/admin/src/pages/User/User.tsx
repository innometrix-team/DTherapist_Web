import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GetAllUsersApi, IUser } from "../../api/GetUsers.api";
import Pagination from "../../components/pagination/Pagination";

interface UserFilters {
  search: string;
  role: string;
  isSuspended: string;
}

function User() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const itemsPerPage = 10;

  // Get filters and pagination from URL params with defaults
  const filters: UserFilters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      role: searchParams.get("role") || "all",
      isSuspended: searchParams.get("isSuspended") || "all",
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
    queryKey: ["admin-users"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await GetAllUsersApi();

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
    const users: IUser[] = (usersData || [])
      .filter((user) => user.role !== "admin")
      .map((user) => ({
        ...user,
        role: user.role === "therapist" ? "counselor" : user.role,
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

      return matchesSearch && matchesRole && matchesSuspension;
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
      clients: data.filter((user) => user.role === "client").length ?? 0,
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "counselor":
        return "bg-blue-100 text-blue-800";
      case "therapist":
        return "bg-blue-100 text-blue-800";
      case "user":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleOpenUser = (userId: string) => {
    navigate(`/user/${userId}`);
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
          User Management
        </h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
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
            <option value="client">Client</option>
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
          <span>Clients: {userCount.clients.toLocaleString()}</span>
        </div>
      </div>

      {/* Users Table (Responsive) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3 p-3">
          {paginatedUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}

          {paginatedUsers.map((user: IUser) => (
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
                  </div>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
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
                  onClick={() => handleOpenUser(user._id)}
                  className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 text-blue-700 border-blue-200"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user: IUser) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
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
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.fullName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                        user.isSuspended
                      )}`}
                    >
                      {getSuspensionStatus(user.isSuspended)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenUser(user._id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
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
