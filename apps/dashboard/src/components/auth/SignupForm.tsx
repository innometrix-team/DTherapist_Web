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
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9+\-\s()]+$/, "Phone number contains invalid characters"),
  password: passwordSchema,
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
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const password = watch("password");
  const passwordStrength = password ? calculatePasswordStrength(password) : null;
  
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
        phoneNumber: data.phoneNumber,
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
        <div>
          <input
            type="tel"
            placeholder="Phone Number"
            {...register("phoneNumber")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          {errors.phoneNumber && (
            <p className="text-red-600 text-sm mt-1">{errors.phoneNumber.message}</p>
          )}
        </div>
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password")}
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
          {password && (
            <div className="mt-2 space-y-2">
              {/* Strength Bar */}
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded ${
                      i < passwordStrength!.score
                        ? passwordStrength!.level === "weak"
                          ? "bg-red-500"
                          : passwordStrength!.level === "fair"
                            ? "bg-yellow-500"
                            : passwordStrength!.level === "good"
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
                    passwordStrength!.level === "weak"
                      ? "text-red-600"
                      : passwordStrength!.level === "fair"
                        ? "text-yellow-600"
                        : passwordStrength!.level === "good"
                          ? "text-blue-600"
                          : "text-green-600"
                  }>
                    {passwordStrength!.level}
                  </span>
                </span>
                {passwordStrength!.level === "strong" && (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              {/* Feedback Tips */}
              {passwordStrength!.feedback.length > 0 && (
                <div className="space-y-1">
                  {passwordStrength!.feedback.map((tip, idx) => (
                    <p key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                      <span>•</span> {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          
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
            <option value="client">User</option>
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
