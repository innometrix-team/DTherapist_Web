import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import LoginApi, { IRequestData } from "../../api/Login.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { from?: string } | null;
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  // Navigate back to origin route or default to dashboard
  const from = locationState?.from || "/";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });
  const abortControllerRef = useRef<AbortController>(null);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setValue("email", savedEmail);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  const { mutateAsync: handleLogin, isPending: isSubmitting } = useMutation({
    mutationFn: (data: IRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return LoginApi(data, { signal: controller.signal });
    },
    onSuccess: (result, variables) => {
      if (!result?.data) {
        return;
      }
      const { user, token } = result.data;
      setAuth({
        id: user.id,
        role: user.role === "client" ? "user" : "counselor",
        name: user.name,
        token: token ?? null,
        email: user.email ?? null,
        professionalCategory: user.professionalCategory,
      });

      // Handle remember me functionality
      const formData = variables as IRequestData & { rememberMe?: boolean };
      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      // Show success message
      toast.success(`Welcome back, ${user.name}!`);

      // Navigate to the intended page or dashboard
      void navigate(from, { replace: true });
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = useCallback(
    (data) => {
      void handleLogin({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      } as IRequestData & { rememberMe?: boolean });
    },
    [handleLogin]
  );

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="text-center sm:text-left space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-darkerb tracking-tight">
          Log in to your account
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          Welcome back! Enter your registered details to continue.
        </p>
      </div>

      <form
        className="space-y-4.5"
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
      >
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            {...register("email")}
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-semibold text-primary hover:text-darkerb transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              autoComplete="current-password"
              {...register("password")}
              className="w-full px-4 py-3 pr-11 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-600 text-xs mt-1.5 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center py-0.5">
          <input
            type="checkbox"
            id="rememberMe"
            {...register("rememberMe")}
            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
          />
          <label htmlFor="rememberMe" className="ml-2 text-xs text-gray-600 cursor-pointer select-none">
            Remember my email
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-primary hover:bg-darkerb text-white font-semibold rounded-lg text-sm sm:text-base transition-colors shadow-xs cursor-pointer disabled:opacity-50 mt-2"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>

        <div className="pt-4 text-center text-xs sm:text-sm text-gray-600">
          New to DTherapist?{" "}
          <Link
            to="/auth/signup"
            state={{ from: locationState?.from }}
            className="font-bold text-primary hover:text-darkerb transition-colors"
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
