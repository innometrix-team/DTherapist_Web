import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import RegisterApi, { IRequestData } from "../../api/Register.api";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/auth/useAuthStore";

const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full Name is required")
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: "Please enter your full name",
    }),
  email: z.string().email("Invalid email address"),
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
        id: responseData?.id ,
      });
      navigate(
        `/auth/verify-email?email=${encodeURIComponent(variables.email)}`
      );
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
      <p className="text-gray-500 text-sm">
        Lorem ipsum dolor sit amet consectetur. Mauris purus vulpuLore
      </p>
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
            {...register("email")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            {...register("password")}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
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
            <option value="therapist">Therapist</option>
          </select>
          {errors.role && (
            <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <input type="checkbox" {...register("agreeTerms")} className="mt-1" />
          <p className="text-sm">
            I agree to the{" "}
            <Link to="/terms-and-conditions" className="text-blue-700 font-semibold">
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
