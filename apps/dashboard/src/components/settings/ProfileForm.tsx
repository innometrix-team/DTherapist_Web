import React, { useState, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { genderOptions } from "../../constant/settings.constants";
import { FaTrash } from "react-icons/fa";
import { CameraIcon } from "../../assets/icons";
import ProfileUpdateApi, {
  IProfileUpdateData,
} from "../../api/ProfileUpdate.api";
import ProfileApi from "../../api/Profile.api"; // Import the profile fetching API
import { useAuthStore } from "../../store/auth/useAuthStore";

// Base schema for common fields (removed email)
const baseSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full Name is required")
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: "Please enter your full name",
    }),
  country: z.string().min(2, "Country is required"),
});

// User-specific schema
const userSchema = baseSchema.extend({
  bio: z.string().min(10, "Bio must be at least 10 characters"),
});

// Counselor-specific schema
const counselorSchema = baseSchema.extend({
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  specialization: z.string().min(2, "Specialization is required"),
  experience: z.number().min(0, "Years of experience must be 0 or greater"),
  gender: z.enum(["male", "female", "non-binary", "other"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
});

type UserFormData = z.infer<typeof userSchema>;
type CounselorFormData = z.infer<typeof counselorSchema>;
type ProfileFormData = UserFormData | CounselorFormData;

const ProfileForm: React.FC = () => {
  const { role, setAuth } = useAuthStore();
  const auth = useAuthStore((state) => state);
  const isCounselor = role === "counselor";

  // Use appropriate schema based on role
  const schema = isCounselor ? counselorSchema : userSchema;

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
          bio: "",
          specialization: "",
          experience: 0,
          country: "",
          gender: "male",
        }
      : {
          fullName: "",
          bio: "",
          country: "",
        },
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initialProfilePicture, setInitialProfilePicture] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch existing profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', role],
    queryFn: () => ProfileApi(role as "user" | "counselor"),
    enabled: !!role,
    retry: 1,
  });

  // Populate form with existing data when profile data is loaded
  useEffect(() => {
    if (profileData?.data) {
      const profile = profileData.data;
      
      // Set form values (removed email)
      setValue("fullName", profile.fullName || "");
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
        auth?.role ?? undefined
      );
    },
    onSuccess: (result) => {
      // Handle case where result is null (cancelled request)
      if (!result) {
        return;
      }

      // Handle case where result.data doesn't exist or is null
      if (!result.data) {
        toast.success(result.message || "Profile updated successfully!");
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
        profilePicture,
        token,
      } = result.data;

      // Update form with returned data
      setValue("fullName", fullName);
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
          role: auth?.role || "user",
          token: token,
          id: result.data.id,
          email: result.data.email, // Keep this if it's still needed for auth
        });
      }

      toast.success(result.message || "Profile updated successfully!");

      // Clear only the new profile image since the form should keep updated values
      setProfileImage(null);
      // Only revoke blob URLs, keep server URLs
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
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

      // Prepare update data - removed email
      const updateData: IProfileUpdateData = {
        fullName: data.fullName,
        bio: data.bio,
        country: data.country,
        profilePicture: profileImage || undefined,
        // Add counselor-specific fields if user is counselor
        ...(isCounselor &&
          "specialization" in data && {
            specialization: data.specialization,
            experience: data.experience,
            gender: data.gender,
          }),
      };

      handleProfileUpdate(updateData);
    },
    [handleProfileUpdate, isPending, isSubmitting, profileImage, isCounselor]
  );

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      abortControllerRef.current?.abort();
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
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-4 md:p-6 space-y-6 w-full"
    >
      <h2 className="text-xl font-semibold text-gray-800">
        {isCounselor ? "Counselor Profile Details" : "User Profile Details"}
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
        <>
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
              {isCounselor &&
                "specialization" in errors &&
                errors.specialization && (
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
              {"experience" in errors && errors.experience && (
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
              {isCounselor && "gender" in errors && errors.gender && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>
        </>
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
    </form>
  );
};

export default ProfileForm;