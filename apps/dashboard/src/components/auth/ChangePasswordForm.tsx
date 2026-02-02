import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
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
    level: levels[Math.min(score, 5)] as "weak" | "fair" | "good" | "strong",
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
      navigate("/auth/login");
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

      handleChangePassword({
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
      navigate("/auth/forgot-password");
    }
  }, [token, navigate]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (!token) {
    return (
      <div className="max-w-md w-full mx-auto space-y-4">
        <h2 className="text-3xl font-bold">Invalid Token</h2>
        <p className="text-red-600 text-sm">
          The reset token is invalid or missing. Please request a new password reset.
        </p>
        <Link to="/auth/forgot-password" className="text-blue-700 font-semibold">
          Request New Reset
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Change Password</h2>
      <p className="text-gray-500 text-sm">
        Update your account password to keep your account secure.
      </p>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              {...register("newPassword")}
              className="w-full border border-gray-300 rounded px-4 py-2 pr-12"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.02-2.76 2.86-5.05 5.14-6.53" />
                  <path d="M1 1l22 22" />
                  <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                  <path d="M16.24 7.76A10.94 10.94 0 0 1 23 12c-.47 1.27-1.14 2.45-1.98 3.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="mt-2 space-y-2">
              {/* Strength Bar */}
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded ${
                      i < newPasswordStrength!.score
                        ? newPasswordStrength!.level === "weak"
                          ? "bg-red-500"
                          : newPasswordStrength!.level === "fair"
                            ? "bg-yellow-500"
                            : newPasswordStrength!.level === "good"
                              ? "bg-blue-500"
                              : "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              
              {/* Strength Label */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium capitalize">
                  Strength: <span className={
                    newPasswordStrength!.level === "weak"
                      ? "text-red-600"
                      : newPasswordStrength!.level === "fair"
                        ? "text-yellow-600"
                        : newPasswordStrength!.level === "good"
                          ? "text-blue-600"
                          : "text-green-600"
                  }>
                    {newPasswordStrength!.level}
                  </span>
                </span>
                {newPasswordStrength!.level === "strong" && (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              {/* Feedback Tips */}
              {newPasswordStrength!.feedback.length > 0 && (
                <div className="space-y-1">
                  {newPasswordStrength!.feedback.map((tip, idx) => (
                    <p key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                      <span>•</span> {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {errors.newPassword && (
            <p className="text-red-600 text-sm mt-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              {...register("confirmPassword")}
              className="w-full border border-gray-300 rounded px-4 py-2 pr-12"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.02-2.76 2.86-5.05 5.14-6.53" />
                  <path d="M1 1l22 22" />
                  <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                  <path d="M16.24 7.76A10.94 10.94 0 0 1 23 12c-.47 1.27-1.14 2.45-1.98 3.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || isPending}
          className="w-fit bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
        >
          {isSubmitting || isPending ? "Changing..." : "Change Password"}
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        <Link to="/auth/login" className="text-blue-700 font-semibold">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ChangePasswordForm;