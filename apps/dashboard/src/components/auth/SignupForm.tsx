import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import RegisterApi, { IRequestData } from "../../api/Register.api";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/auth/useAuthStore";

const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full Name is required")
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: "Please enter your full name",
    }),
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["client", "therapist"], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms & Conditions" }),
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const abortControllerRef = useRef<AbortController>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { mutateAsync: handleSignup, isPending } = useMutation({
    mutationFn: (data: IRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return RegisterApi(data, { signal: controller.signal });
    },
    onSuccess: (data, variables) => {
      const responseData = data?.data;
      if (!responseData) {
        return;
      }
      setAuth({
        role: variables.role === "client" ? "user" : "counselor",
        token: responseData?.token,
        name: variables.fullName,
        id: responseData?.id,
        email: variables.email,
      });

      // Always navigate to email verification, regardless of role
      // Pass role and fullName as URL params for use after verification
      const searchParams = new URLSearchParams({
        email: variables.email,
        role: variables.role, // Always pass the role
        fullName: variables.fullName, // Always pass the full name
      });

      navigate(`/auth/verify-email?${searchParams.toString()}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<SignupFormData> = useCallback(
    (data) => {
      if (isPending || isSubmitting) {
        return;
      }

      handleSignup({
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        role: data.role,
        phoneNumber: "0900000000",
      });
    },
    [handleSignup, isPending, isSubmitting]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Create free account</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input
            type="text"
            placeholder="Full Name"
            {...register("fullName")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          {errors.fullName && (
            <p className="text-red-600 text-sm mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email Address"
            autoCapitalize="none"
            autoCorrect="off"
            {...register("email", {
              setValueAs: (value) =>
                typeof value === "string" ? value.toLowerCase() : value,
            })}
            className="w-full border border-gray-300 rounded px-4 py-2 lowercase"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            {...register("password")}
            className="w-full border border-gray-300 rounded px-4 py-2 pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        <div>
          <select
            {...register("role")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          >
            <option value="">Register as</option>
            <option value="client">Client</option>
            <option value="therapist">Counselor</option>
          </select>
          {errors.role && (
            <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <input type="checkbox" {...register("agreeTerms")} className="mt-1" />
          <p className="text-sm">
            I agree to the{" "}
            <Link
              to="/terms-and-conditions"
              className="text-blue-700 font-semibold"
            >
              Terms & Conditions
            </Link>{" "}
            of Dtherapist.
          </p>
        </div>
        {errors.agreeTerms && (
          <p className="text-red-600 text-sm">{errors.agreeTerms.message}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-fit bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
        >
          {isSubmitting || isPending ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="text-sm text-gray-600 text-center">
        I already have an account?{" "}
        <Link to="/auth/login" className="text-blue-700 font-semibold">
          Login
        </Link>
      </p>
    </div>
  );
}

export default SignUpForm;
