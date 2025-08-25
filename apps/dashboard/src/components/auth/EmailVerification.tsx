import { useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import VerifyOtpApi, { IRequestData } from "../../api/VerifyOTP.api";
import VerifyOTPResetApi, { IVerifyOTPResetRequestData } from "../../api/VerifyOtpReset.api";
import ResendOtpApi, { OTPRequestData } from "../../api/ResendOTP.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const resetToken = searchParams.get("token") || "";
  const isPasswordReset = !!resetToken;
  const [otp, setOtp] = useState("");
  const abortControllerRef = useRef<AbortController>(null);
  const navigate = useNavigate();
  const authToken = useAuthStore((state) => state.token);
  const { setToken } = useAuthStore();

  // Regular OTP verification for registration
  const { mutateAsync: handleVerifyOTP, isPending } = useMutation({
    mutationFn: (data: IRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return VerifyOtpApi(data, { signal: controller.signal });
    },
    onSuccess: (data) => {
      const responseData = data?.data;
      if (!responseData?.token) {
        return;
      }
      setToken(responseData.token);
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // OTP verification for password reset
  const { mutateAsync: handleVerifyOTPReset, isPending: isPendingReset } = useMutation({
    mutationFn: (data: IVerifyOTPResetRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return VerifyOTPResetApi(data, { signal: controller.signal });
    },
    onSuccess: (data, variables) => {
      const responseData = data?.data;
      
      // Get token from response, or fall back to the original reset token if backend doesn't return new one
      const newToken = responseData?.token || variables.token;
      
      if (!newToken) {
        toast.error("Token missing - cannot proceed to password change");
        return;
      }
      
      // Navigate to change password with the token
      navigate(`/auth/change-password?token=${newToken}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutateAsync: handleResendOTP, isPending: isResending } = useMutation({
    mutationFn: (data: OTPRequestData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return ResendOtpApi(data, { signal: controller.signal });
    },
    onSuccess: () => {
      toast.success("OTP has been resent to your email.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend OTP.");
    },
  });

  const handleSubmit = useCallback(async () => {
    if (isPending || isPendingReset) {
      return;
    }

    if (isPasswordReset) {
      // Password reset flow - use the reset token from URL
      if (!resetToken) {
        toast.error("Reset token is missing");
        return;
      }
      handleVerifyOTPReset({
        otp,
        token: resetToken,
      });
    } else {
      // Registration flow - use the auth token from store
      if (!authToken) {
        toast.error("Authentication token is missing");
        return;
      }
      handleVerifyOTP({
        otp,
        token: authToken,
      });
    }
  }, [handleVerifyOTP, handleVerifyOTPReset, isPending, isPendingReset, otp, authToken, resetToken, isPasswordReset]);

  useEffect(() => {
    // Redirect if email is missing
    if (!email) {
      navigate("/auth/login");
      return;
    }

    // For registration flow, check if auth token exists in auth store
    if (!isPasswordReset && !authToken) {
      toast.error("Please complete registration first");
      navigate("/auth/signup");
      return;
    }

    // For password reset flow, check if reset token exists in URL
    if (isPasswordReset && !resetToken) {
      toast.error("Reset token is missing");
      navigate("/auth/forgot-password");
      return;
    }
  }, [email, authToken, resetToken, isPasswordReset, navigate]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const currentIsPending = isPasswordReset ? isPendingReset : isPending;

  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">
        {isPasswordReset ? "Verify Reset Code" : "Verify Your Email"}
      </h2>
      <p className="text-gray-500 text-sm">
        We've sent an OTP to your email:{" "}
        <span className="font-medium">{email}</span>
        {isPasswordReset && (
          <span className="block mt-1">
            Enter the verification code to reset your password.
          </span>
        )}
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        className="w-full border border-gray-300 rounded px-4 py-2 text-center text-lg tracking-widest"
      />
      <button
        onClick={handleSubmit}
        disabled={!otp || otp.length !== 6 || currentIsPending}
        className="w-full bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
      >
        {currentIsPending 
          ? "Verifying..." 
          : isPasswordReset 
            ? "Verify Code" 
            : "Verify Email"
        }
      </button>
      <p className="text-gray-500 text-sm text-center">
        Didn't receive the OTP?{" "}
        <button
          onClick={() => handleResendOTP({ email })}
          disabled={isResending}
          className="text-primary font-medium disabled:opacity-50 hover:underline"
        >
          {isResending ? "Resending..." : "Resend OTP"}
        </button>
      </p>
    </div>
  );
}

export default EmailVerification;