import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  DeleteUserApi,
  GetUserCertificationsApi,
  GetUserDetailApi,
} from "../../api/GetUsers.api";
import CredentialList from "../../components/user/CredentialList";
import ProfileForm from "../../components/user/ProfileForm";

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: userProfileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await GetUserDetailApi(userId);

      if (!response?.data) {
        throw new Error("No user profile data received");
      }

      return response.data;
    },
    retry: 2,
    refetchOnMount: true,
    staleTime: 3 * 60 * 1000, // 2 minutes
    enabled: !!userId,
  });

  // Query to fetch user credentials (only for counselors/therapists)
  const shouldFetchCredentials =
    !!userProfileData?.areaOfSpecialization?.trim();

  const { data: userCredentialsData, isLoading: credentialsLoading } = useQuery(
    {
      queryKey: ["user-credentials", userId],
      queryFn: async () => {
        if (!userId) throw new Error("User ID is required");

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await GetUserCertificationsApi(userId);

        if (!response?.data) {
          throw new Error("No user credentials data received");
        }

        return response.data;
      },
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: !!userId && shouldFetchCredentials,
    }
  );

  const handleBackButton = () => {
    navigate(-1);
  };

  const role = shouldFetchCredentials ? "counselor" : "client";

  const tabs = useMemo(() => {
    const baseTabs = [{ id: "profile", label: "Profile" }];

    // Only counselors/therapists see credentials tab
    if (role === "counselor") {
      return [
        ...baseTabs.slice(0, 1),
        { id: "credentials", label: "Credentials" },
        ...baseTabs.slice(1),
      ];
    }

    return baseTabs;
  }, [role]);

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Missing userId");
      return DeleteUserApi(userId);
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      handleBackButton();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete user");
    },
  });

  // Set initial active tab when tabs change
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const renderForm = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileForm
            userData={userProfileData}
            isLoading={profileLoading}
            role={role}
          />
        );
      case "credentials":
        return (
          <CredentialList
            credentialsData={userCredentialsData}
            isLoading={credentialsLoading}
            userId={userId}
            role={role}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between pb-4">
        {/* Back button and title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBackButton}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-2xl font-semibold text-gray-900 ">
              User Information
            </span>
          </button>
        </div>

        <button
          disabled={isDeleting}
          onClick={() => setShowDeleteDialog(true)}
          className="bg-[#AE0A0A] text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
        >
          Delete User
        </button>
      </div>

      {/* CONDITIONAL UI */}
      {profileLoading && (
        <div className="flex justify-center items-center py-16 h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 text-sm">
            Loading user details...
          </span>
        </div>
      )}

      {profileError && (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">
            {profileError.message ??
              "Error loading user details. Please try again."}
          </div>
        </div>
      )}

      {!profileLoading && !profileError && !userProfileData && (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">User not found</div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {!profileLoading && !profileError && userProfileData && (
        <>
          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`mr-8 pb-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            {renderForm()}
          </div>
        </>
      )}
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={deleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This will permanently remove their account and all associated data."
      />
    </div>
  );
};

export default UserDetail;

import { Trash2 } from "lucide-react";

function DeleteDialog({
  open,
  onClose,
  onConfirm,
  title = "Delete item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
