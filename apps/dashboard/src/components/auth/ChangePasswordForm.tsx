import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import ResetPasswordApi, { IResetPasswordRequestData } from "../../api/ResetPassword.api";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
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
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

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
          <input
            type="password"
            placeholder="New Password"
            {...register("newPassword")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          {errors.newPassword && (
            <p className="text-red-600 text-sm mt-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm New Password"
            {...register("confirmPassword")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
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