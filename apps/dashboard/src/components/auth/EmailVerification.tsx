import { useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import VerifyOtpApi, { IRequestData } from "../../api/VerifyOTP.api";
import ResendOtpApi, { OTPRequestData } from "../../api/ResendOTP.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const abortControllerRef = useRef<AbortController>(null);
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const { setToken } = useAuthStore();

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
    if (!token || isPending) {
      return;
    }
    handleVerifyOTP({
      otp,
      token,
    });
  }, [handleVerifyOTP, isPending, otp, token]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="max-w-md w-full mx-auto space-y-4 text-center">
      <h2 className="text-3xl font-bold">Verify Your Email</h2>
      <p className="text-gray-500 text-sm">
        We’ve sent an OTP to your email:{" "}
        <span className="font-medium">{email}</span>
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full border border-gray-300 rounded px-4 py-2"
      />
      <button
        onClick={handleSubmit}
        disabled={!otp}
        className="bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
      >
        {isPending ? "Verifying..." : " Verify Email "}
      </button>
      <button
        onClick={() => handleResendOTP({ email })}
        disabled={isResending}
        className="bg-transparent text-primary py-2 px-4 rounded font-medium disabled:opacity-50"
      >
        {isResending ? "Resending..." : "Resend OTP"}
      </button>
    </div>
  );
}

export default EmailVerification;
