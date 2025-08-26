import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import ForgotPasswordApi, { IForgotPasswordRequestData } from "../../api/ForgotPassword.api";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const abortControllerRef = useRef<AbortController>(null);
  const navigate = useNavigate();

  const { mutateAsync: handleForgotPassword, isPending } = useMutation({
    mutationFn: (data: IForgotPasswordRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return ForgotPasswordApi(data, { signal: controller.signal });
    },
    onSuccess: (data, variables) => {
      const responseData = data?.data;
      if (!responseData) {
        return;
      }
      toast.success("OTP sent to your email successfully!");
      // Navigate to email verification with email and token for password reset flow
      navigate(`/auth/verify-email?email=${encodeURIComponent(variables.email)}&token=${responseData.token}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormData> = useCallback(
    (data) => {
      if (isPending || isSubmitting) {
        return;
      }

      handleForgotPassword({
        email: data.email,
      });
    },
    [handleForgotPassword, isPending, isSubmitting]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Forgot Password</h2>
      <p className="text-gray-500 text-sm">
        Enter the email address associated with your account.
      </p>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input
            type="email"
            placeholder="Email Address"
            {...register("email")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || isPending}
          className="w-fit bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
        >
          {isSubmitting || isPending ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;