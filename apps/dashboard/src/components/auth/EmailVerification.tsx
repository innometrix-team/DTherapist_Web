import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import VerifyOtpApi, { IRequestData } from "../../api/VerifyOTP.api";
import VerifyOTPResetApi, { IVerifyOTPResetRequestData } from "../../api/VerifyOTPReset.api";
import ResendOtpApi, { OTPRequestData } from "../../api/ResendOTP.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import CounselorWelcomeModal from "./CounselorWelcomeModal";

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const resetToken = searchParams.get("token") || "";
  const role = searchParams.get("role") || "";
  const fullName = searchParams.get("fullName") || "";
  const professionalCategory = searchParams.get("professionalCategory") || "";
  const isPasswordReset = !!resetToken;
  const isTherapistSignup = role === "therapist" && !isPasswordReset;
  const isClientSignup = role === "client" && !isPasswordReset;
  
  const [otp, setOtp] = useState("");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const abortControllerRef = useRef<AbortController>(null);
  const navigate = useNavigate();
  const authToken = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);

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
      
      // Show modal for both therapist and client signup, otherwise navigate to home
      if (isTherapistSignup || isClientSignup) {
        setShowWelcomeModal(true);
      } else {
        void navigate("/");
      }
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
      void navigate(`/auth/change-password?token=${newToken}`);
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

  const handleSubmit = useCallback(() => {
    if (isPending || isPendingReset) {
      return;
    }

    if (isPasswordReset) {
      if (!resetToken) {
        toast.error("Reset token is missing");
        return;
      }
      void handleVerifyOTPReset({
        otp,
        token: resetToken,
      });
    } else {
      if (!authToken) {
        toast.error("Authentication token is missing");
        return;
      }
      void handleVerifyOTP({
        otp,
        token: authToken,
      });
    }
  }, [handleVerifyOTP, handleVerifyOTPReset, isPending, isPendingReset, otp, authToken, resetToken, isPasswordReset]);

  // Handle modal actions
  const handleModalContinue = useCallback(() => {
    setShowWelcomeModal(false);
    void navigate("/settings");
  }, [navigate]);

  const handleModalClose = useCallback(() => {
    setShowWelcomeModal(false);
    void navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (!email) {
      void navigate("/auth/login");
      return;
    }

    if (!isPasswordReset && !authToken) {
      toast.error("Please complete registration first");
      void navigate("/auth/signup");
      return;
    }

    if (isPasswordReset && !resetToken) {
      toast.error("Reset token is missing");
      void navigate("/auth/forgot-password");
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
    <>
      <div className="w-full">
        <div className="mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {isPasswordReset ? "Verify reset code" : "Verify your email"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-gray-800">{email}</span>.
            {isPasswordReset
              ? " Enter the code to continue resetting your password."
              : " Enter the code below to activate your account."}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
            >
              6-Digit Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xl tracking-[0.5em] font-mono text-center text-gray-900 placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!otp || otp.length !== 6 || currentIsPending}
            className="w-full py-3.5 px-4 bg-primary hover:bg-darkerb text-white font-semibold rounded-lg text-sm sm:text-base transition-colors shadow-xs cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {currentIsPending
              ? "Verifying..."
              : isPasswordReset
                ? "Verify Code"
                : "Verify Email"}
          </button>

          <p className="text-xs text-gray-500 text-center pt-2">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={() => {
                void handleResendOTP({ email });
              }}
              disabled={isResending}
              className="text-primary hover:text-darkerb font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isResending ? "Resending..." : "Resend Code"}
            </button>
          </p>
        </div>

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

      <CounselorWelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleModalClose}
        onContinue={handleModalContinue}
        userName={fullName}
        userRole={role}
        professionalCategory={professionalCategory}
      />
    </>
  );
}

export default EmailVerification;
