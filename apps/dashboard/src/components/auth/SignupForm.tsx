import { Eye, EyeOff } from "lucide-react";
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

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push("Add special characters (!@#$%^&*)");

  const levels: ("weak" | "fair" | "good" | "strong")[] = ["weak", "weak", "fair", "good", "strong", "strong"];
  return {
    score,
    level: levels[Math.min(score, 5)],
    feedback: feedback.slice(0, 2),
  };
};

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .refine((value) => {
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    return hasUppercase && hasLowercase && hasDigit && hasSpecialChar;
  }, "Password must contain uppercase, lowercase,\ndigit and special character");

const signupSchema = z
  .object({
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
    professionalCategory: z.enum(["counselor", "psychologist"]).optional(),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms & Conditions" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.role === "therapist" && !data.professionalCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["professionalCategory"],
        message: "Please select your profession (Counselor or Psychologist)",
      });
    }
  });

type SignupFormData = z.infer<typeof signupSchema>;

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const password = watch("password");
  const selectedRole = watch("role");
  const passwordStrength = password ? calculatePasswordStrength(password) : null;
  
  const abortControllerRef = useRef<AbortController>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  // Clear professionalCategory if switching away from therapist
  useEffect(() => {
    if (selectedRole !== "therapist") {
      setValue("professionalCategory", undefined);
    }
  }, [selectedRole, setValue]);

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
        professionalCategory: variables.professionalCategory,
      });

      // Always navigate to email verification, regardless of role
      // Pass role and fullName as URL params for use after verification
      const searchParams = new URLSearchParams({
        email: variables.email,
        role: variables.role, // Always pass the role
        fullName: variables.fullName, // Always pass the full name
      });

      if (variables.professionalCategory) {
        searchParams.set("professionalCategory", variables.professionalCategory);
      }

      void navigate(`/auth/verify-email?${searchParams.toString()}`);
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

      void handleSignup({
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        role: data.role,
        phoneNumber: data.phoneNumber,
        ...(data.role === "therapist" && data.professionalCategory
          ? { professionalCategory: data.professionalCategory }
          : {}),
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
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Join DTherapist for accessible, confidential support.
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
            htmlFor="fullName"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="e.g. Jane Doe"
            {...register("fullName")}
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {errors.fullName && (
            <p className="text-red-600 text-xs mt-1.5">
              {errors.fullName.message}
            </p>
          )}
        </div>

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
            {...register("email", {
              setValueAs: (value: unknown) =>
                typeof value === "string" ? value.toLowerCase() : "",
            })}
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all lowercase"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 000-0000"
            {...register("phoneNumber")}
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {errors.phoneNumber && (
            <p className="text-red-600 text-xs mt-1.5">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              {...register("password")}
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
          {password && passwordStrength && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i < passwordStrength.score
                        ? passwordStrength.level === "weak"
                          ? "bg-red-500"
                          : passwordStrength.level === "fair"
                            ? "bg-yellow-500"
                            : passwordStrength.level === "good"
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
                    passwordStrength.level === "weak"
                      ? "text-red-600 font-semibold capitalize"
                      : passwordStrength.level === "fair"
                        ? "text-yellow-600 font-semibold capitalize"
                        : passwordStrength.level === "good"
                          ? "text-blue-600 font-semibold capitalize"
                          : "text-green-600 font-semibold capitalize"
                  }>
                    {passwordStrength.level}
                  </span>
                </span>
              </div>
              
              {passwordStrength.feedback.length > 0 && (
                <div className="space-y-0.5">
                  {passwordStrength.feedback.map((tip, idx) => (
                    <p key={idx} className="text-[11px] text-gray-500 flex items-center gap-1">
                      <span>•</span> {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {errors.password && (
            <p className="text-red-600 text-xs mt-1.5 whitespace-pre-line">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            I want to join as
          </label>
          <select
            id="role"
            {...register("role")}
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="">Select your role</option>
            <option value="client">Client</option>
            <option value="therapist">Licensed Professional</option>
          </select>
          {errors.role && (
            <p className="text-red-600 text-xs mt-1.5">{errors.role.message}</p>
          )}
        </div>

        {selectedRole === "therapist" && (
          <div>
            <label
              htmlFor="professionalCategory"
              className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
            >
              Professional Category
            </label>
            <select
              id="professionalCategory"
              {...register("professionalCategory")}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="">Select Category</option>
              <option value="counselor">Counselor</option>
              <option value="psychologist">Psychologist</option>
            </select>
            {errors.professionalCategory && (
              <p className="text-red-600 text-xs mt-1.5">
                {errors.professionalCategory.message}
              </p>
            )}
          </div>
        )}

        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="agreeTerms"
            type="checkbox"
            {...register("agreeTerms")}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary mt-0.5 cursor-pointer"
          />
          <label htmlFor="agreeTerms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link
              to="/terms-and-conditions"
              className="text-primary hover:text-darkerb font-semibold underline transition-colors"
            >
              Terms & Conditions
            </Link>{" "}
            and Privacy Policy of DTherapist.
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-red-600 text-xs">{errors.agreeTerms.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isPending}
          className="w-full py-3.5 px-4 bg-primary hover:bg-darkerb text-white font-semibold rounded-lg text-sm sm:text-base transition-colors shadow-xs cursor-pointer disabled:opacity-50 mt-3 flex items-center justify-center gap-2"
        >
          {isSubmitting || isPending ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="text-primary hover:text-darkerb font-semibold transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUpForm;
