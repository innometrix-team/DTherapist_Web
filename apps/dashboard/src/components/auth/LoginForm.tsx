import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import LoginApi, { IRequestData } from "../../api/Login.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { toast } from "react-hot-toast";
import { useCallback, useEffect, useRef } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const abortControllerRef = useRef<AbortController>(null);

  const { mutateAsync: handleLogin, isPending: isSubmitting } = useMutation({
    mutationFn: (data: IRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return LoginApi(data, { signal: controller.signal });
    },
    onSuccess: (result) => {
      if (!result?.data) {
        return;
      }
      const { user, token } = result.data;
      setAuth({
        id: user.id,
        role: user.role === "client" ? "user" : "counselor",
        token: token ?? null,
        email: user.email ?? null,
      });
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = useCallback(
    (data) => {
      handleLogin({ email: data.email, password: data.password });
    },
    [handleLogin]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Login to account</h2>
      <p className="text-gray-500 text-sm">
        Lorem ipsum dolor sit amet consectetur. Mauris purus vulpuLore
      </p>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input
          type="email"
          placeholder="Email Address"
          {...register("email")}
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
        <input
          type="password"
          placeholder="Password"
          {...register("password")}
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        {errors.password && (
          <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-fit bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        <p className="text-sm text-gray-600 text-center">
          Don’t have an account?{" "}
          <Link to="/auth/signup" className="text-blue-700 font-semibold">
            Signup
          </Link>
        </p>
        <p className="text-sm text-center mt-2">
          Forgot Password?{" "}
          <Link
            to="/auth/forgot-password"
            className="text-blue-700 font-semibold"
          >
            Reset
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;
