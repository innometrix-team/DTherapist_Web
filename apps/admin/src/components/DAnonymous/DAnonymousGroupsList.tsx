import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Calendar, Trash2, Edit } from "lucide-react";
import { 
  getDAnonymousGroupsApi, 
  deleteDAnonymousGroupApi,
  IDAnonymousGroup
} from "../../api/DAnonymous.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";
import EditDAnonymousGroupModal from "./EditDAnonymousGroupModal";

const DAnonymousGroupsList: React.FC = () => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { role } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<IDAnonymousGroup | null>(null);

  // Check if user is admin
  const isAdmin = role === "admin";

  // Query to fetch groups
  const {
    data: groupsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["danonymous-groups"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await getDAnonymousGroupsApi({ 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No groups data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    enabled: isAdmin,
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => deleteDAnonymousGroupApi(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["danonymous-groups"] });
      setDeleteConfirmId(null);
      setSelectedGroups(prev => prev.filter(id => id !== deleteConfirmId));
    },
    onError: (error) => {
      console.error("Failed to delete group:", error);
      setDeleteConfirmId(null);
    },
  });

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Filter groups based on search term
  const filteredGroups = groupsData?.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  }) || [];

  // Handle checkbox selection
  const handleGroupSelect = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, groupId]);
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGroups(filteredGroups.map(group => group._id));
    } else {
      setSelectedGroups([]);
    }
  };

  // Handle delete group
  const handleDeleteGroup = (groupId: string) => {
    setDeleteConfirmId(groupId);
  };

  // Handle edit group
  const handleEditGroup = (group: IDAnonymousGroup) => {
    setEditingGroup(group);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteGroupMutation.mutate(deleteConfirmId);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">Admin access required to manage groups</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gray-200 animate-pulse h-10 w-80 rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-200 animate-pulse h-6 w-24 rounded"></div>
            <div className="bg-gray-200 animate-pulse h-10 w-32 rounded"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, index) => (
            <div key={index} className="bg-gray-200 animate-pulse h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">Failed to load groups</p>
          <p className="text-red-500 text-xs mt-1">Please refresh the page</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Groups"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Groups Count */}
          <span className="text-gray-600 text-sm">
            Groups: <span className="font-semibold">{filteredGroups.length.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedGroups.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-primary">
            {selectedGroups.length} group{selectedGroups.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAll(false)}
              className="text-sm text-primary hover:text-blue-800"
            >
              Clear Selection
            </button>
            <button
              onClick={() => handleSelectAll(true)}
              className="text-sm text-primary hover:text-blue-800"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p>No groups found</p>
          {searchTerm && (
            <p className="text-sm mt-1">Try adjusting your search terms</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Group Image */}
              <div className="relative h-48">
                {group.image ? (
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                    <Users className="w-16 h-16 text-white" />
                  </div>
                )}
                
                {/* Checkbox */}
                <div className="absolute top-3 left-3">
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group._id)}
                    onChange={(e) => handleGroupSelect(group._id, e.target.checked)}
                    className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGroup(group);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                    title="Edit group"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group._id);
                    }}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Group Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {group.name}
                </h3>
                
                {group.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {group.description.length > 80 
                      ? `${group.description.substring(0, 80)}...` 
                      : group.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(group.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Group</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this group? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={deleteGroupMutation.isPending}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteGroupMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingGroup && (
        <EditDAnonymousGroupModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
};

export default DAnonymousGroupsList;