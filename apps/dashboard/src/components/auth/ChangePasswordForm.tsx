import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import ResetPasswordApi, { IResetPasswordRequestData } from "../../api/ResetPassword.api";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

// Password strength checker
const calculatePasswordStrength = (password: string): { score: number; level: "weak" | "fair" | "good" | "strong"; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  else feedback.push("Use at least 8 characters");

  if (password.length >= 12) score++;
  else if (password.length >= 8) feedback.push("Longer passwords are stronger");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Add uppercase letters");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Add numbers");

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push("Add special characters (!@#$%^&*)");

  const levels: ("weak" | "fair" | "good" | "strong")[] = ["weak", "weak", "fair", "good", "strong", "strong"];
  return {
    score,
    level: levels[Math.min(score, 5)],
    feedback: feedback.slice(0, 2),
  };
};

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").refine(
  (password) => /[a-z]/.test(password),
  "Password must contain lowercase letters"
).refine(
  (password) => /[A-Z]/.test(password),
  "Password must contain uppercase letters"
).refine(
  (password) => /[0-9]/.test(password),
  "Password must contain numbers"
);

const changePasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const ChangePasswordForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });
  const newPassword = watch("newPassword");
  const newPasswordStrength = newPassword ? calculatePasswordStrength(newPassword) : null;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const abortControllerRef = useRef<AbortController>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { mutateAsync: handleChangePassword, isPending } = useMutation({
    mutationFn: (data: IResetPasswordRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return ResetPasswordApi(data, { signal: controller.signal });
    },
    onSuccess: (data) => {
      const responseData = data?.status;
      if (!responseData) {
        return;
      }
      toast.success("Password changed successfully!");
      void navigate("/auth/login");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<ChangePasswordFormData> = useCallback(
    (data) => {
      if (isPending || isSubmitting) {
        return;
      }

      if (!token) {
        toast.error("Invalid or missing reset token");
        return;
      }

      void handleChangePassword({
        token: token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
    },
    [handleChangePassword, isPending, isSubmitting, token]
  );

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      void navigate("/auth/forgot-password");
    }
  }, [token, navigate]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (!token) {
    return (
      <div className="w-full">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <h2 className="text-xl font-bold text-red-900">Invalid or Expired Link</h2>
          <p className="text-red-700 text-sm mt-2">
            The password reset link is invalid or has expired. Please request a new reset link.
          </p>
          <div className="mt-4">
            <Link
              to="/auth/forgot-password"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-darkerb transition-colors"
            >
              Request New Reset
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Create new password
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Your new password must be at least 8 characters and contain letters and numbers.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
      >
        <div>
          <label
            htmlFor="newPassword"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              {...register("newPassword")}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-11"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && newPasswordStrength && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i < newPasswordStrength.score
                        ? newPasswordStrength.level === "weak"
                          ? "bg-red-500"
                          : newPasswordStrength.level === "fair"
                            ? "bg-yellow-500"
                            : newPasswordStrength.level === "good"
                              ? "bg-blue-500"
                              : "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-500">
                  Strength:{" "}
                  <span className={
                    newPasswordStrength.level === "weak"
                      ? "text-red-600 font-semibold capitalize"
                      : newPasswordStrength.level === "fair"
                        ? "text-yellow-600 font-semibold capitalize"
                        : newPasswordStrength.level === "good"
                          ? "text-blue-600 font-semibold capitalize"
                          : "text-green-600 font-semibold capitalize"
                  }>
                    {newPasswordStrength.level}
                  </span>
                </span>
              </div>
              
              {newPasswordStrength.feedback.length > 0 && (
                <div className="space-y-0.5">
                  {newPasswordStrength.feedback.map((tip, idx) => (
                    <p key={idx} className="text-[11px] text-gray-500 flex items-center gap-1">
                      <span>•</span> {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {errors.newPassword && (
            <p className="text-red-600 text-xs mt-1.5">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              {...register("confirmPassword")}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-11"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1.5">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isPending}
          className="w-full py-3.5 px-4 bg-primary hover:bg-darkerb text-white font-semibold rounded-lg text-sm sm:text-base transition-colors shadow-xs cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {isSubmitting || isPending ? "Updating password..." : "Update Password"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-darkerb transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to log in</span>
        </Link>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
