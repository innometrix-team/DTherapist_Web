// /components/Settings/BankDetailsForm.tsx
import React, { useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { getBanksApi, saveBankDetailsApi, IBankDetailsData } from "../../api/BankDetails.api";

type Role = "client" | "therapist" | "user" | "counselor";

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Please select a bank"),
  bankAccount: z.string().min(10, "Account number must be at least 10 digits"),
  accountName: z.string().min(2, "Account name is required"),
});

type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

const BankDetailsForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankName: "",
      bankAccount: "",
      accountName: "",
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const { role } = useAuthStore() as { role: Role }; // Properly type the role from auth store

  // Fetch banks from Paystack
  const {
    data: banks = [],
    isLoading: banksLoading,
    error: banksError,
  } = useQuery({
    queryKey: ["banks"],
    queryFn: () => getBanksApi(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 2,
  });

  // Mutation for saving bank details
  const { mutateAsync: handleSaveBankDetails, isPending } = useMutation({
    mutationFn: (data: IBankDetailsData) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return saveBankDetailsApi(data, role, { signal: controller.signal });
    },
    onSuccess: (data) => {
      if (data?.message) {
        toast.success(data.message);
        reset(); 
      } else {
        toast.success("Bank details updated successfully");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update bank details");
    },
  });

  const onSubmit: SubmitHandler<BankDetailsFormData> = useCallback(
    (data) => {
      if (isPending || isSubmitting) {
        return;
      }

      handleSaveBankDetails({
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        accountName: data.accountName,
      });
    },
    [handleSaveBankDetails, isPending, isSubmitting]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Show error if banks failed to load
  useEffect(() => {
    if (banksError) {
      toast.error("Failed to load banks. Please refresh the page.");
    }
  }, [banksError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 md:p-6 space-y-6 w-full">
      <h2 className="text-xl font-semibold text-gray-800">Bank Details</h2>
      
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label htmlFor="bankName" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Bank Name
        </label>
        <div className="w-full max-w-full md:max-w-md">
          <select
            id="bankName"
            {...register("bankName")}
            disabled={banksLoading}
            className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {banksLoading ? "Loading banks..." : "Select Bank"}
            </option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
          {errors.bankName && (
            <p className="text-red-600 text-sm mt-1">
              {errors.bankName.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label htmlFor="bankAccount" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Account Number
        </label>
        <div className="w-full max-w-full md:max-w-md">
          <input
            id="bankAccount"
            type="text"
            placeholder="Enter account number"
            {...register("bankAccount")}
            className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none"
          />
          {errors.bankAccount && (
            <p className="text-red-600 text-sm mt-1">
              {errors.bankAccount.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label htmlFor="accountName" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Account Name
        </label>
        <div className="w-full max-w-full md:max-w-md">
          <input
            id="accountName"
            type="text"
            placeholder="Enter account name"
            {...register("accountName")}
            className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none"
          />
          {errors.accountName && (
            <p className="text-red-600 text-sm mt-1">
              {errors.accountName.message}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isPending || banksLoading}
          className="bg-primary hover:bg-blue-700 text-white font-medium px-6 py-2 rounded w-full md:w-auto disabled:opacity-50"
        >
          {isSubmitting || isPending ? "Updating..." : "Update"}
        </button>
      </div>
    </form>
  );
};

export default BankDetailsForm;