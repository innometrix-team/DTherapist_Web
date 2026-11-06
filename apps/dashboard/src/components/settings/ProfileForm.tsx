import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { genderOptions } from "../../constants/settings.constants";
import { FaTrash } from "react-icons/fa";
import { Clock, AlertCircle, ArrowRightLeft } from "lucide-react";
import { CameraIcon } from "../../assets/icons";



import ProfileApi, {
  updateProfile as ProfileUpdateApi,
  getProfessionalBodies,
  requestProfessionChange,
  type IProfile,
  type IProfileUpdateData,
} from "../../api/Profile.api";
import type { IAPIResult } from "../../api/Api";
import DeleteAccountApi from "../../api/DeleteAccount.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { QUERY_KEYS } from "../../configs/queryKeys.config";

type ProfessionalBodyForm = {
  bodyName: string;
  certificationName: string;
  otherBodyName?: string;
};

const normalizeProfessionalBodies = (value: unknown): ProfessionalBodyForm[] => {
  if (!Array.isArray(value)) return [];

  return value.reduce<ProfessionalBodyForm[]>((bodies, item: unknown) => {
    if (item && typeof item === "object") {
      const body = item as Record<string, unknown>;
      bodies.push({
        bodyName: typeof body.bodyName === "string" ? body.bodyName : "",
        certificationName:
          typeof body.certificationName === "string" ? body.certificationName : "",
        ...(typeof body.otherBodyName === "string"
          ? { otherBodyName: body.otherBodyName }
          : {}),
      });
    }
    return bodies;
  }, []);
};

interface CategoryRequestView {
  requestId?: string;
  status?: "pending" | "approved" | "rejected";
  requestedProfession: "counselor" | "psychologist";
  note?: string;
}

const parseCategoryRequest = (
  profile: IProfile | undefined,
  fallbackCategory: "counselor" | "psychologist"
): CategoryRequestView | undefined => {
  if (!profile || typeof profile !== "object") return undefined;
  const rawProfile = profile as unknown as Record<string, unknown>;
  const rawReq = rawProfile.professionalCategoryRequest;
  if (!rawReq || typeof rawReq !== "object") return undefined;

  const req = rawReq as Record<string, unknown>;
  const rawStatus = req.status;
  const status: "pending" | "approved" | "rejected" | undefined =
    rawStatus === "pending" || rawStatus === "approved" || rawStatus === "rejected"
      ? rawStatus
      : undefined;

  const rawRequested = req.requestedCategory ?? req.professionalCategory;
  const requestedProfession: "counselor" | "psychologist" =
    rawRequested === "psychologist" || rawRequested === "counselor"
      ? rawRequested
      : fallbackCategory;

  const requestId: string | undefined =
    typeof req.requestId === "string" && req.requestId.trim().length > 0
      ? req.requestId
      : typeof req.requestId === "number"
      ? String(req.requestId)
      : undefined;

  const note: string | undefined =
    typeof req.note === "string" && req.note.trim().length > 0
      ? req.note
      : typeof req.note === "number"
      ? String(req.note)
      : undefined;

  return {
    requestId,
    status,
    requestedProfession,
    note,
  };
};

const baseProfileFields = {
  fullName: z
    .string()
    .min(2, "Full Name is required")
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: "Please enter your full name",
    }),
  phoneNumber: z.string().regex(/^[\d\s\-+()]+$/, "Please enter a valid phone number"),
  country: z.string().min(2, "Country is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  specialization: z.string().optional(),
  experience: z.number().optional(),
  gender: z.enum(["male", "female", "non-binary", "other"]).optional(),
};

const baseProfileSchema = z.object(baseProfileFields);

export type ProfileFormData = z.infer<typeof baseProfileSchema>;

const createProfileSchema = (isCounselor: boolean) =>
  baseProfileSchema.superRefine((data, ctx) => {
    if (isCounselor) {
      if (!data.specialization || data.specialization.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["specialization"],
          message: "Specialization is required",
        });
      }
      if (
        typeof data.experience !== "number" ||
        data.experience < 0 ||
        isNaN(data.experience)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["experience"],
          message: "Years of experience must be 0 or greater",
        });
      }
      if (!data.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gender"],
          message: "Please select a gender",
        });
      }
    }
  });

const ProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const setAuth = useAuthStore((state) => state.setAuth);
  const isCounselor = role === "counselor";

  // State for delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteAbortControllerRef = useRef<AbortController | null>(null);

  // Use appropriate schema based on role
  const schema = useMemo(() => createProfileSchema(isCounselor), [isCounselor]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: isCounselor
      ? {
          fullName: "",
          phoneNumber: "",
          bio: "",
          specialization: "",
          experience: 0,
          country: "",
          gender: "male",
        }
      : {
          fullName: "",
          phoneNumber: "",
          bio: "",
          country: "",
        },
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initialProfilePicture, setInitialProfilePicture] = useState<string | null>(null);
  const [professionalBodies, setProfessionalBodies] = useState<ProfessionalBodyForm[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch existing profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery<IAPIResult<IProfile> | null>({
    queryKey: QUERY_KEYS.profile.current(role || ''),
    queryFn: async (): Promise<IAPIResult<IProfile> | null> => {
      return ProfileApi(role as "user" | "counselor");
    },
    enabled: !!role,
    retry: 1,
  });

  // Fetch available professional bodies
  const { data: bodiesResponse, isLoading: isLoadingBodies } = useQuery({
    queryKey: QUERY_KEYS.profile.professionalBodies,
    queryFn: async (): Promise<{ data: unknown }> => {
      const fetchBodies = getProfessionalBodies as () => Promise<{ data: unknown }>;
      return fetchBodies();
    },
    enabled: isCounselor,
  });

  const availableBodies = useMemo(() => {
    const data: unknown = bodiesResponse?.data;
    const list = Array.isArray(data)
      ? data.filter((body: unknown): body is string => typeof body === "string")
      : [];
    if (list.length > 0 && !list.includes("Others")) {
      return [...list, "Others"];
    }
    return list;
  }, [bodiesResponse?.data]);

  const handleAddBody = useCallback(() => {
    setProfessionalBodies((prev) => [
      ...prev,
      { bodyName: "", certificationName: "", otherBodyName: "" },
    ]);
  }, []);

  const handleRemoveBody = useCallback((index: number) => {
    setProfessionalBodies((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateBody = useCallback((
    index: number,
    field: keyof ProfessionalBodyForm,
    value: string
  ) => {
    setProfessionalBodies((prev: ProfessionalBodyForm[]) =>
      prev.map((item: ProfessionalBodyForm, i: number): ProfessionalBodyForm => {
        if (i !== index) return item;
        const updated: ProfessionalBodyForm = { ...item, [field]: value };
        if (field === "bodyName" && value !== "Others") {
          delete updated.otherBodyName;
        }
        return updated;
      })
    );
  }, []);

  // Item 8: Profession Change Request state & mutation
  const [showProfessionChange, setShowProfessionChange] = useState(false);
  const rawProfileRecord = profileData?.data as unknown as
    | Record<string, unknown>
    | undefined;
  const currentProfession: "counselor" | "psychologist" =
    rawProfileRecord?.professionalCategory === "psychologist"
      ? "psychologist"
      : "counselor";

  const defaultTargetCategory: "counselor" | "psychologist" =
    currentProfession === "counselor" ? "psychologist" : "counselor";

  const [selectedTargetCategory, setSelectedTargetCategory] =
    useState<"counselor" | "psychologist">(defaultTargetCategory);

  useEffect(() => {
    setSelectedTargetCategory(
      currentProfession === "counselor" ? "psychologist" : "counselor"
    );
  }, [currentProfession]);

  const categoryRequest: CategoryRequestView | undefined = parseCategoryRequest(
    profileData?.data,
    defaultTargetCategory
  );
  const isPendingProfessionRequest = categoryRequest?.status === "pending";
  const isRejectedProfessionRequest = categoryRequest?.status === "rejected";
  const requestedProfession: "counselor" | "psychologist" =
    categoryRequest?.requestedProfession ?? defaultTargetCategory;
  const requestIdText: string | undefined = categoryRequest?.requestId;
  const noteText: string | undefined = categoryRequest?.note;

  const {
    mutate: submitProfessionChange,
    isPending: isSubmittingProfessionChange,
  } = useMutation({
    mutationFn: async (target: "counselor" | "psychologist") => {
      const submitRequest = requestProfessionChange as (request: {
        professionalCategory: "counselor" | "psychologist";
      }) => Promise<{ message?: string }>;
      return submitRequest({ professionalCategory: target });
    },
    onSuccess: (res) => {
      toast.success(
        res?.message || "Profession change request submitted successfully"
      );
      setShowProfessionChange(false);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile.current(role || ""),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile.professionRequest as readonly unknown[],
      });
    },
    onError: (err: unknown) => {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to submit profession change request";
      toast.error(errorMsg);
    },
  });

  // Populate form with existing data when profile data is loaded
  useEffect(() => {
    if (profileData?.data) {
      const profile = profileData.data;
      
      // Set form values (removed email)
      setValue("fullName", profile.fullName || "");
      setValue("phoneNumber", profile.phoneNumber || "");
      setValue("bio", profile.bio || "");
      setValue("country", profile.country || "");

      // Set counselor-specific fields if user is counselor
      if (isCounselor) {
        setValue("specialization", profile.specialization || "");
        setValue("experience", profile.experience || 0);
        setValue(
          "gender",
          (profile.gender as "male" | "female" | "non-binary" | "other") || "male"
        );
        if (profile.professionalBodies && Array.isArray(profile.professionalBodies)) {
          setProfessionalBodies(normalizeProfessionalBodies(profile.professionalBodies));
        }
      }

      // Set profile picture if it exists
      if (profile.profilePicture) {
        setInitialProfilePicture(profile.profilePicture);
        setPreviewUrl(profile.profilePicture);
      }
    }
  }, [profileData, setValue, isCounselor]);

  const { mutateAsync: handleProfileUpdate, isPending } = useMutation({
    mutationFn: (data: IProfileUpdateData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return ProfileUpdateApi(
        data,
        { signal: controller.signal },
        role ?? undefined
      );
    },
    onSuccess: async (result) => {
      // Handle case where result is null (cancelled request)
      if (!result) {
        return;
      }

      // Handle case where result.data doesn't exist or is null
      if (!result.data) {
        toast.success(result.message || "Profile updated successfully!", { id: "profile-update" });
        return;
      }

      // Safely destructure data with fallbacks (removed email)
      const {
        fullName,
        bio,
        country,
        specialization,
        experience,
        gender,
        phoneNumber,
        profilePicture,
        token,
      } = result.data;

      // Update form with returned data
      setValue("fullName", fullName);
      setValue("phoneNumber", phoneNumber ?? "");
      setValue("bio", bio);
      setValue("country", country);

      // Set counselor-specific fields if user is counselor
      if (isCounselor) {
        setValue("specialization", specialization ?? "");
        setValue("experience", experience ?? 0);
        setValue(
          "gender",
          (gender as "male" | "female" | "non-binary" | "other") ?? "male"
        );
      }

      // Update profile image preview if returned
      if (profilePicture) {
        setInitialProfilePicture(profilePicture);
        setPreviewUrl(profilePicture);
        setProfileImage(null);
      }

      // Update auth token if provided
      if (token) {
        setAuth({
          role: role || "user",
          token: token,
          id: result.data.id,
          email: result.data.email, // Keep this if it's still needed for auth
        });
      }

      toast.success(result.message || "Profile updated successfully!", { id: "profile-update" });

      // Clear only the new profile image since the form should keep updated values
      setProfileImage(null);
      // Only revoke blob URLs, keep server URLs
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.current(role || '') });
    },
    onError: (error) => {
      // Handle different types of errors
      if (error && typeof error === "object" && "message" in error) {
        toast.error(
          error.message || "Failed to update profile. Please try again."
        );
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    },
  });

  // Delete account mutation
  const { mutateAsync: handleDeleteAccount, isPending: isDeletePending } = useMutation({
    mutationFn: () => {
      const controller = new AbortController();
      deleteAbortControllerRef.current = controller;
      return DeleteAccountApi({ signal: controller.signal });
    },
    onSuccess: (result) => {
      if (!result) {
        return;
      }

      toast.success(result.message || "Account deleted successfully");
      
      // Clear auth store
      setAuth({
        role: "counselor", // Default to counselor or user as needed
        token: "",
        id: "",
        email: "",
      });

      // Redirect to login page
      setTimeout(() => {
        void navigate("/login");
      }, 1000);
    },
    onError: (error) => {
      if (error && typeof error === "object" && "message" in error) {
        toast.error(
          error.message || "Failed to delete account. Please try again."
        );
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
      setShowDeleteModal(false);
    },
  });

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate file type
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
          toast.error(
            "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
          );
          return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          toast.error("Image file must be less than 5MB");
          return;
        }

        setProfileImage(file);

        // Clean up previous blob URL (but not server URLs)
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    },
    [previewUrl]
  );

  const removeImage = useCallback(() => {
    setProfileImage(null);
    // Clean up blob URL
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    // Reset to initial profile picture or null
    setPreviewUrl(initialProfilePicture);
  }, [previewUrl, initialProfilePicture]);

  const onSubmit: SubmitHandler<ProfileFormData> = useCallback(
    (data) => {
      if (isPending || isSubmitting) {
        return;
      }

      if (isCounselor) {
        for (let i = 0; i < professionalBodies.length; i++) {
          const row = professionalBodies[i];
          if (!row.bodyName) {
            toast.error(`Please select a professional body for row #${i + 1}`);
            return;
          }
          if (row.bodyName === "Others") {
            if (!row.otherBodyName?.trim()) {
              toast.error(`Please specify the body name for row #${i + 1}`);
              return;
            }
            if (row.otherBodyName.trim().length > 200) {
              toast.error(`Body name cannot exceed 200 characters for row #${i + 1}`);
              return;
            }
          }
          if (!row.certificationName?.trim()) {
            toast.error(`Please enter a certification name for row #${i + 1}`);
            return;
          }
          if (row.certificationName.trim().length > 200) {
            toast.error(`Certification name cannot exceed 200 characters for row #${i + 1}`);
            return;
          }
        }
      }

      // Prepare update data - removed email
      const updateData: IProfileUpdateData = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        bio: data.bio,
        country: data.country,
        profilePicture: profileImage || undefined,
        // Add counselor-specific fields if user is counselor
        ...(isCounselor && {
          specialization: data.specialization,
          experience: data.experience,
          gender: data.gender,
          professionalBodies: professionalBodies.map((b) => ({
            bodyName: b.bodyName.trim(),
            certificationName: b.certificationName.trim(),
            ...(b.bodyName === "Others" && b.otherBodyName
              ? { otherBodyName: b.otherBodyName.trim() }
              : {}),
          })),
        }),
      };

      void handleProfileUpdate(updateData);
    },
    [handleProfileUpdate, isPending, isSubmitting, profileImage, isCounselor, professionalBodies]
  );

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      abortControllerRef.current?.abort();
      deleteAbortControllerRef.current?.abort();
      // Only clean up blob URLs, not server URLs
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const inputStyle =
    "w-full max-w-full md:max-w-md px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const formGroupStyle =
    "flex flex-col md:flex-row md:items-center gap-2 md:gap-4";
  const labelStyle = "w-full md:w-48 font-medium";

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <div className="bg-white p-4 md:p-6 space-y-6 w-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-10 bg-gray-200 rounded w-full max-w-md"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      className="bg-white p-4 md:p-6 space-y-6 w-full"
    >
      <h2 className="text-xl font-semibold text-gray-800 capitalize">
        {isCounselor
          ? `${currentProfession} Profile Details`
          : "User Profile Details"}
      </h2>

      {/* Profile Image Section */}
      <div className="space-y-2">
        <label className="block font-medium text-gray-700">
          Profile Picture
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <CameraIcon className="text-gray-400 w-8 h-8" />
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="cursor-pointer text-blue-600 font-medium">
              {previewUrl ? "Change Image" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isPending || isSubmitting}
                className="hidden"
              />
            </label>
            {(profileImage || previewUrl) && (
              <button
                type="button"
                onClick={removeImage}
                disabled={isPending || isSubmitting}
                className="text-red-600 font-medium inline-flex items-center gap-1 disabled:opacity-50"
              >
                <FaTrash className="w-4 h-4" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Name */}
      <div className={formGroupStyle}>
        <label htmlFor="fullName" className={labelStyle}>
          Full Name
        </label>
        <div className="flex flex-col w-full max-w-full md:max-w-md">
          <input
            id="fullName"
            type="text"
            placeholder="Enter full name"
            {...register("fullName")}
            disabled={isPending || isSubmitting}
            className={inputStyle}
          />
          {errors.fullName && (
            <p className="text-red-600 text-sm mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>
      </div>

      {/* Phone Number */}
      <div className={formGroupStyle}>
        <label htmlFor="phoneNumber" className={labelStyle}>
          Phone Number
        </label>
        <div className="flex flex-col w-full max-w-full md:max-w-md">
          <input
            id="phoneNumber"
            type="tel"
            placeholder="Enter phone number"
            {...register("phoneNumber")}
            disabled={isPending || isSubmitting}
            className={inputStyle}
          />
          {errors.phoneNumber && (
            <p className="text-red-600 text-sm mt-1">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className={formGroupStyle}>
        <label htmlFor="bio" className={labelStyle}>
          Bio
        </label>
        <div className="flex flex-col w-full max-w-full md:max-w-md">
          <textarea
            id="bio"
            placeholder="Tell us about yourself"
            {...register("bio")}
            disabled={isPending || isSubmitting}
            className={`${inputStyle} resize-none`}
            rows={4}
          />
          {errors.bio && (
            <p className="text-red-600 text-sm mt-1">{errors.bio.message}</p>
          )}
        </div>
      </div>

      {/* Country */}
      <div className={formGroupStyle}>
        <label htmlFor="country" className={labelStyle}>
          Country
        </label>
        <div className="flex flex-col w-full max-w-full md:max-w-md">
          <input
            id="country"
            type="text"
            placeholder="Enter country"
            {...register("country")}
            disabled={isPending || isSubmitting}
            className={inputStyle}
          />
          {errors.country && (
            <p className="text-red-600 text-sm mt-1">
              {errors.country.message}
            </p>
          )}
        </div>
      </div>

      {/* Counselor-specific fields */}
      {isCounselor && (
        <div className="space-y-6">
          {/* Area of Specialization */}
          <div className={formGroupStyle}>
            <label htmlFor="specialization" className={labelStyle}>
              Area of Specialization
            </label>
            <div className="flex flex-col w-full max-w-full md:max-w-md">
              <input
                id="specialization"
                type="text"
                placeholder="Enter area of specialization"
                {...register("specialization")}
                disabled={isPending || isSubmitting}
                className={inputStyle}
              />
              {isCounselor && errors.specialization && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.specialization.message}
                </p>
              )}
            </div>
          </div>

          {/* Years of Experience */}
          <div className={formGroupStyle}>
            <label htmlFor="experience" className={labelStyle}>
              Years of Experience
            </label>
            <div className="flex flex-col w-full max-w-full md:max-w-md">
              <input
                id="experience"
                type="number"
                min="0"
                placeholder="Enter years of experience"
                {...register("experience", { valueAsNumber: true })}
                disabled={isPending || isSubmitting}
                className={inputStyle}
              />
              {isCounselor && errors.experience && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.experience.message}
                </p>
              )}
            </div>
          </div>

          {/* Gender */}
          <div className={formGroupStyle}>
            <label htmlFor="gender" className={labelStyle}>
              Gender
            </label>
            <div className="flex flex-col w-full max-w-full md:max-w-md">
              <select
                id="gender"
                {...register("gender")}
                disabled={isPending || isSubmitting}
                className={inputStyle}
              >
                {genderOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {isCounselor && errors.gender && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>

          {/* Professional Bodies & Certifications */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-darkerb">
                  Professional Bodies & Certifications
                </h3>
                <p className="text-xs text-neutral">
                  Add your memberships and qualifications. Select 'Others' if your body is not listed.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBody}
                disabled={isPending || isSubmitting || isLoadingBodies}
                className="w-fit text-sm font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
              >
                + Add Another
              </button>
            </div>

            {professionalBodies.length === 0 ? (
              <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-sm text-neutral mb-2">
                  No professional bodies or certifications added yet.
                </p>
                <button
                  type="button"
                  onClick={handleAddBody}
                  disabled={isPending || isSubmitting || isLoadingBodies}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  + Add Professional Body
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {professionalBodies.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral uppercase tracking-wider">
                        Certification #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBody(index)}
                        disabled={isPending || isSubmitting}
                        className="text-red-600 hover:text-red-700 text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        title="Remove certification"
                      >
                        <FaTrash className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Professional Body <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.bodyName}
                          onChange={(e) =>
                            handleUpdateBody(index, "bodyName", e.target.value)
                          }
                          disabled={isPending || isSubmitting || isLoadingBodies}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="">Select Professional Body</option>
                          {availableBodies.map((body) => (
                            <option key={body} value={body}>
                              {body}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Certification / Qualification Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={200}
                          placeholder="e.g. QA Certificate"
                          value={item.certificationName}
                          onChange={(e) =>
                            handleUpdateBody(index, "certificationName", e.target.value)
                          }
                          disabled={isPending || isSubmitting}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {item.bodyName === "Others" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Specify Organization / Body Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={200}
                          placeholder="Enter organization / body name"
                          value={item.otherBodyName || ""}
                          onChange={(e) =>
                            handleUpdateBody(index, "otherBodyName", e.target.value)
                          }
                          disabled={isPending || isSubmitting}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Profession & Profession Change Request (Item 8) */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs uppercase font-semibold text-neutral tracking-wider">
                  Current Profession
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold text-darkerb capitalize">
                    {currentProfession}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Active
                  </span>
                </div>
              </div>

              {!isPendingProfessionRequest && !showProfessionChange && (
                <button
                  type="button"
                  onClick={() => setShowProfessionChange(true)}
                  disabled={isPending || isSubmitting}
                  className="w-fit text-sm font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Request Profession Change</span>
                </button>
              )}
            </div>

            {/* Pending Alert */}
            {isPendingProfessionRequest && (
              <div className="p-3 bg-amber-50 rounded-md text-amber-900 text-sm space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Profession Change Pending Review</span>
                </div>
                <p className="text-xs text-amber-800">
                  You requested to switch your profession to{" "}
                  <strong className="capitalize">{requestedProfession}</strong>.
                  {requestIdText && (
                    <span className="ml-1 text-amber-700">
                      (Request ID: {requestIdText})
                    </span>
                  )}
                </p>
                <p className="text-xs text-amber-700">
                  Your current profession ({currentProfession}) remains active until an administrator reviews and approves your request.
                </p>
              </div>
            )}

            {/* Rejected Alert */}
            {isRejectedProfessionRequest && !showProfessionChange && (
              <div className="p-3 bg-red-50 rounded-md text-red-900 text-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Previous Profession Change Request Rejected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProfessionChange(true)}
                    className="text-xs font-semibold text-red-700 underline hover:text-red-800 cursor-pointer shrink-0"
                  >
                    Submit New Request
                  </button>
                </div>
                {noteText && (
                  <p className="text-xs text-red-800">
                    <span className="font-medium">Reason from admin:</span>{" "}
                    {noteText}
                  </p>
                )}
              </div>
            )}

            {/* Change Request Form */}
            {showProfessionChange && !isPendingProfessionRequest && (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-darkerb">
                    Request Change to Another Profession
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowProfessionChange(false)}
                    disabled={isSubmittingProfessionChange}
                    className="text-xs text-neutral hover:text-darkerb cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-neutral">
                  Select the profession you want to switch to. Admin review is required before changes take effect.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select
                    value={selectedTargetCategory}
                    onChange={(e) =>
                      setSelectedTargetCategory(
                        e.target.value as "counselor" | "psychologist"
                      )
                    }
                    disabled={isSubmittingProfessionChange}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
                  >
                    <option value="psychologist">Psychologist</option>
                    <option value="counselor">Counselor</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => submitProfessionChange(selectedTargetCategory)}
                    disabled={
                      isSubmittingProfessionChange ||
                      selectedTargetCategory === currentProfession
                    }
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingProfessionChange ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
                {selectedTargetCategory === currentProfession && (
                  <p className="text-xs text-amber-600">
                    Please select a profession different from your current one ({currentProfession}).
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isPending}
          className="bg-primary hover:bg-blue-700 text-white font-medium px-6 py-2 rounded w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting || isPending ? "Updating..." : "Update Profile"}
        </button>
      </div>

      {/* Delete Account Section */}
      <div className="mt-12 pt-8 border-t border-red-200">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          <p className="text-sm text-gray-600">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeletePending}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isDeletePending ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-150 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Delete Account?
              </h2>
              <p className="text-gray-600 text-sm">
                This action cannot be undone. Deleting your account will:
              </p>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Permanently delete your profile and personal information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Cancel all active appointments and bookings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Remove all chat history and messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Delete your wallet and transaction history</span>
              </li>
            </ul>

            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm font-medium text-red-800">
                Are you absolutely sure? click "DELETE" to confirm.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletePending}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDeleteAccount();
                }}
                disabled={isDeletePending}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isDeletePending ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ProfileForm;
