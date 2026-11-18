import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
      void navigate(`/auth/verify-email?email=${encodeURIComponent(variables.email)}&token=${responseData.token}`);
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

      void handleForgotPassword({
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
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter the email associated with your account and we&apos;ll send you a verification code.
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
            htmlFor="email"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoCorrect="off"
            {...register("email")}
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all lowercase"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isPending}
          className="w-full py-3.5 px-4 bg-primary hover:bg-darkerb text-white font-semibold rounded-lg text-sm sm:text-base transition-colors shadow-xs cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {isSubmitting || isPending ? "Sending code..." : "Send Reset Code"}
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
}

export default ForgotPassword;
