import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, Trash2, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  DeleteUserApi,
  GetAllUsersApi,
  GetUserCertificationsApi,
  GetUserDetailApi,
  ReviewProfessionCategoryRequestApi,
  type IProfessionalCategoryRequest,
  type IUser,
  type UserListItem,
} from "../../api/GetUsers.api";
import CommissionManager from "../../components/user/CommissionManager";
import CredentialList from "../../components/user/CredentialList";
import ProfileForm from "../../components/user/ProfileForm";

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    status: "approved" | "rejected";
    note: string;
  }>({
    open: false,
    status: "approved",
    note: "",
  });

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
    },
  );

  const location = useLocation();
  const locationUser = (
    location.state as { userSummary?: UserListItem | IUser } | null
  )?.userSummary;

  // Retrieve cached user from any existing admin-users query in TanStack Query
  const cachedUserFromQuery = useMemo(() => {
    if (!userId) return undefined;
    const allUsersQueries = qc.getQueriesData<IUser[]>({ queryKey: ["admin-users"] });
    for (const [, list] of allUsersQueries) {
      if (Array.isArray(list)) {
        const found = list.find((u) => u._id === userId);
        if (found) return found;
      }
    }
    return undefined;
  }, [qc, userId]);

  // Query users list fallback so direct link / refresh also gets the user's role & request details
  const { data: fallbackUsersList } = useQuery({
    queryKey: ["admin-users", "for-detail", userId],
    queryFn: async () => {
      const res = await GetAllUsersApi();
      return res?.data || [];
    },
    staleTime: 60 * 1000,
    enabled: !!userId,
  });

  const userSummary =
    locationUser ||
    cachedUserFromQuery ||
    fallbackUsersList?.find((u) => u._id === userId);

  const handleBackButton = () => {
    void navigate(-1);
  };

  const role =
    userSummary?.role === "therapist" || userSummary?.role === "counselor"
      ? "counselor"
      : shouldFetchCredentials
      ? "counselor"
      : "client";

  const tabs = useMemo(() => {
    const baseTabs = [{ id: "profile", label: "Profile" }];

    // Only counselors/therapists see credentials and commission tabs
    if (role === "counselor") {
      return [
        { id: "profile", label: "Profile" },
        { id: "credentials", label: "Credentials" },
        { id: "commission", label: "Commission & Split" },
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
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      handleBackButton();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete user");
    },
  });

  const rawUser = userProfileData as unknown as Record<string, unknown> | undefined;
  const rawNestedUser = (rawUser?.user || rawUser?.therapist) as Record<string, unknown> | undefined;
  const rawSummary = userSummary as unknown as Record<string, unknown> | undefined;

  const professionRequest = (
    userProfileData?.professionalCategoryRequest ||
    rawUser?.professionalCategoryRequest ||
    rawUser?.request ||
    rawNestedUser?.professionalCategoryRequest ||
    userSummary?.professionalCategoryRequest ||
    rawSummary?.request ||
    rawSummary?.professionalCategoryRequest
  ) as IProfessionalCategoryRequest | Record<string, unknown> | undefined;

  const requestStatus =
    (typeof professionRequest === "object" && typeof professionRequest?.status === "string"
      ? professionRequest.status
      : undefined) ||
    (typeof userProfileData?.professionalCategoryRequestStatus === "string"
      ? userProfileData.professionalCategoryRequestStatus
      : undefined) ||
    (typeof rawUser?.professionalCategoryRequestStatus === "string"
      ? rawUser.professionalCategoryRequestStatus
      : undefined) ||
    (typeof rawNestedUser?.professionalCategoryRequestStatus === "string"
      ? rawNestedUser.professionalCategoryRequestStatus
      : undefined) ||
    (typeof userSummary?.professionalCategoryRequestStatus === "string"
      ? userSummary.professionalCategoryRequestStatus
      : undefined) ||
    (typeof rawSummary?.professionalCategoryRequestStatus === "string"
      ? rawSummary.professionalCategoryRequestStatus
      : undefined);

  const isPendingProfessionRequest = Boolean(
    requestStatus && requestStatus.toLowerCase() === "pending"
  );
  const isRejectedProfessionRequest = Boolean(
    requestStatus && requestStatus.toLowerCase() === "rejected"
  );

  const currentCategory =
    userProfileData?.professionalCategory ||
    userSummary?.professionalCategory ||
    (typeof rawUser?.professionalCategory === "string" ? rawUser.professionalCategory : undefined) ||
    (typeof rawNestedUser?.professionalCategory === "string" ? rawNestedUser.professionalCategory : undefined) ||
    (typeof rawSummary?.professionalCategory === "string" ? rawSummary.professionalCategory : undefined) ||
    "counselor";

  const rawRequested =
    (typeof professionRequest === "object"
      ? ((professionRequest as Record<string, unknown>).requestedCategory ||
         (professionRequest as Record<string, unknown>).professionalCategory)
      : undefined) ||
    rawUser?.requestedCategory ||
    rawUser?.requestedProfession ||
    rawNestedUser?.requestedCategory ||
    rawSummary?.requestedCategory ||
    rawSummary?.requestedProfession ||
    (currentCategory === "counselor" ? "psychologist" : "counselor");

  const requestedProfession =
    typeof rawRequested === "string" && rawRequested.toLowerCase() === "counselor"
      ? "counselor"
      : "psychologist";

  const displayRequestId =
    (typeof professionRequest === "object" && typeof professionRequest?.requestId === "string"
      ? professionRequest.requestId
      : undefined) ||
    (typeof professionRequest === "object" && typeof (professionRequest as Record<string, unknown>)?._id === "string"
      ? ((professionRequest as Record<string, unknown>)._id as string)
      : undefined) ||
    (typeof professionRequest === "object" && typeof (professionRequest as Record<string, unknown>)?.id === "string"
      ? ((professionRequest as Record<string, unknown>).id as string)
      : undefined) ||
    (typeof rawUser?.professionalCategoryRequestId === "string"
      ? rawUser.professionalCategoryRequestId
      : undefined) ||
    (typeof rawSummary?.professionalCategoryRequestId === "string"
      ? rawSummary.professionalCategoryRequestId
      : undefined) ||
    userSummary?.professionalCategoryRequest?.requestId ||
    userId;

  const displayNote =
    (typeof professionRequest === "object" && typeof professionRequest?.note === "string"
      ? professionRequest.note
      : undefined) ||
    (typeof rawSummary?.note === "string" ? rawSummary.note : undefined);

  const { mutate: reviewProfessionRequest, isPending: isReviewing } = useMutation({
    mutationFn: async ({
      status,
      note,
    }: {
      status: "approved" | "rejected";
      note: string;
    }) => {
      if (!userId) throw new Error("Missing userId");
      const requestId =
        (typeof professionRequest === "object"
          ? (((professionRequest as Record<string, unknown>).requestId ||
              (professionRequest as Record<string, unknown>).id ||
              (professionRequest as Record<string, unknown>)._id) as string | undefined)
          : undefined) ||
        (typeof userProfileData?.professionalCategoryRequest === "string"
          ? userProfileData.professionalCategoryRequest
          : undefined) ||
        (typeof rawUser?.professionalCategoryRequestId === "string"
          ? rawUser.professionalCategoryRequestId
          : undefined) ||
        userId;

      if (!requestId) {
        throw new Error("Missing requestId for profession change review");
      }

      return ReviewProfessionCategoryRequestApi(userId, {
        requestId,
        status,
        note: note.trim() || (status === "approved" ? "QA approval" : "Request rejected by admin"),
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Profession change request ${variables.status} successfully`
      );
      setReviewDialog({ open: false, status: "approved", note: "" });
      setBannerDismissed(true);
      void qc.invalidateQueries({ queryKey: ["user-profile", userId] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      void qc.invalidateQueries({
        queryKey: ["admin-users", "for-detail", userId],
      });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to review profession change request");
    },
  });

  // Keep activeTab in sync with tab query param or fallback to first tab
  useEffect(() => {
    if (tabParam && tabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    } else if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, tabParam, activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tabId);
        return next;
      },
      { replace: true }
    );
  };

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
      case "commission":
        return userId ? (
          <CommissionManager
            userId={userId}
            userFullName={userProfileData?.fullName}
          />
        ) : null;
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
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors"
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
            {profileError.message
              ? `${profileError.message}, Profile not updated`
              : "Error loading user details. Please try again."}
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
          {/* Profession Change Request Review Banner (Item 8) */}
          {!bannerDismissed && isPendingProfessionRequest && (
            <div className="mb-6 p-4 sm:p-5 bg-offwhite border border-divider rounded-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <h3 className="text-base font-semibold text-darkerb">
                      Pending Profession Change Request
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                      Action Required
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      Current: <strong className="capitalize text-darkerb">{currentCategory}</strong>
                      {" → "}
                      Requested: <strong className="capitalize text-primary font-semibold">{requestedProfession}</strong>
                    </p>
                    {displayRequestId && (
                      <p className="text-xs text-neutral">
                        Request ID: <span className="font-mono text-darkerb">{displayRequestId}</span>
                      </p>
                    )}
                    {displayNote && (
                      <p className="text-xs text-gray-600 bg-white px-2.5 py-1 rounded border border-divider inline-block">
                        Applicant Note: <span className="text-darkerb">{displayNote}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setReviewDialog({
                        open: true,
                        status: "approved",
                        note: "QA approval",
                      })
                    }
                    disabled={isReviewing}
                    className="px-4 py-2 bg-primary hover:bg-darkerb text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Change
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReviewDialog({
                        open: true,
                        status: "rejected",
                        note: "",
                      })
                    }
                    disabled={isReviewing}
                    className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerDismissed(true)}
                    aria-label="Close banner"
                    className="p-1.5 text-neutral hover:text-darkerb rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!bannerDismissed && isRejectedProfessionRequest && (
            <div className="mb-6 p-4 bg-offwhite border border-divider rounded-xl text-sm flex items-center justify-between">
              <div className="text-gray-700 flex items-center gap-2">
                <span className="font-semibold text-darkerb">Last Profession Change Request was Rejected</span>
                {displayNote && (
                  <span className="text-gray-600">({displayNote})</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral">
                  ID: {displayRequestId || "-"}
                </span>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Close"
                  className="text-neutral hover:text-darkerb cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`mr-8 pb-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => handleTabClick(tab.id)}
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
      <ReviewProfessionModal
        open={reviewDialog.open}
        status={reviewDialog.status}
        requestedProfession={requestedProfession}
        onClose={() =>
          setReviewDialog((prev) => ({ ...prev, open: false }))
        }
        onConfirm={(note) =>
          reviewProfessionRequest({ status: reviewDialog.status, note })
        }
        isPending={isReviewing}
      />
    </div>
  );
};

export default UserDetail;

function ReviewProfessionModal({
  open,
  status,
  requestedProfession,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  status: "approved" | "rejected";
  requestedProfession: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isPending: boolean;
}) {
  const [note, setNote] = useState(status === "approved" ? "QA approval" : "");

  useEffect(() => {
    if (open) {
      setNote(status === "approved" ? "QA approval" : "");
    }
  }, [open, status]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          {status === "approved" ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <h3 className="text-lg font-semibold text-darkerb capitalize">
            {status} Profession Change
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Are you sure you want to <strong className="capitalize text-darkerb">{status}</strong> changing this user&apos;s profession to{" "}
          <strong className="capitalize text-primary font-semibold">{requestedProfession}</strong>?
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Review Note / Reason
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              status === "approved"
                ? "Optional approval note (defaults to 'QA approval')"
                : "Enter reason for rejection..."
            }
            className="w-full px-3 py-2 text-sm border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3.5 py-1.5 text-sm border border-divider rounded-lg hover:bg-offwhite text-gray-700 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            disabled={isPending}
            className={`px-4 py-1.5 text-sm rounded-lg text-white font-medium cursor-pointer disabled:opacity-50 transition-colors shadow-xs ${
              status === "approved"
                ? "bg-primary hover:bg-darkerb"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isPending ? "Submitting..." : status === "approved" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
