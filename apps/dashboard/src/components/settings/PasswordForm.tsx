import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PasswordChangeApi, { IPasswordChangeData } from "../../api/password.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import type { SubmitHandler } from "react-hook-form";

// Zod schema for password validation
const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const PasswordForm: React.FC = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const abortControllerRef = useRef<AbortController>(null);
  
   const setAuth = useAuthStore((state) => state.setAuth);
  const auth = useAuthStore((state) => state);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  // Use mutation for password change with proper authentication
  const { mutateAsync: handlePasswordChange, isPending: isSubmitting } = useMutation({
    mutationFn: (data: IPasswordChangeData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      
      
      return PasswordChangeApi(data, { signal: controller.signal }, auth?.role ?? undefined);
    },
    onSuccess: (result) => {
      // Handle case where result is null (cancelled request)
      if (!result) {
        return;
      }

      // Handle case where result.data doesn't exist or is null
      if (!result.data) {
        toast.success(result.message || "Password updated successfully!");
        reset();
        return;
      }

      // Safely destructure user and token with fallbacks
      const { user, token } = result.data;
      
      // Only update auth if we have valid user data
      if (user && user.role) {
        // Handle role mapping - keep consistent with backend response
        const mappedRole = user.role === "client" ? "user" : 
                          user.role === "therapist" ? "counselor" : 
                          user.role; // Keep as is if already mapped
        
        setAuth({
          role: mappedRole,
          token: token ?? null,
        });
      }
      
      toast.success(result.message || "Password updated successfully!");
      reset();
    },
    onError: (error) => {
      // Handle different types of errors
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(error.message || "Failed to update password. Please try again.");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    },
  });

  const onSubmit: SubmitHandler<PasswordFormData> = useCallback(
    (data) => {
      handlePasswordChange({
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
    },
    [handlePasswordChange]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 md:p-6 space-y-6 w-full">
      <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>

      {/* New Password Field */}
      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
        <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0 md:pt-2">
          New Password
        </label>
        <div className="flex-1 max-w-full md:max-w-md">
          <div className="relative">
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              {...register("newPassword")}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.newPassword ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
          )}
          {/* Password strength indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="text-xs text-gray-600 mb-1">Password strength:</div>
              <div className="flex space-x-1">
                {Array.from({ length: 4 }).map((_, i) => {
                  const strength = getPasswordStrength(newPassword);
                  return (
                    <div
                      key={i}
                      className={`h-1 w-full rounded ${
                        i < strength
                          ? strength === 1
                            ? "bg-red-500"
                            : strength === 2
                            ? "bg-yellow-500"
                            : strength === 3
                            ? "bg-blue-500"
                            : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0 md:pt-2">
          Confirm Password
        </label>
        <div className="flex-1 max-w-full md:max-w-md">
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              {...register("confirmPassword")}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
};

// Helper function to calculate password strength
const getPasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  return strength;
};

export default PasswordForm;