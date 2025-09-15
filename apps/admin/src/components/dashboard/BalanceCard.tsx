import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { BalanceConfig } from "../../pages/Dashboard/types";
import {  TimerIcon } from "../../assets/icons";
import FundWalletApi, { 
  IFundWalletRequest, 
  getBanksApi, 
  adminWithdrawFundsApi, 
  IBank, 
  IWithdrawRequest 
} from "../../api/FundWallet.api";
import AdminDashboardApi from "../../api/AdminDashboard.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const BalanceCard: React.FC<BalanceConfig> = ({ amount }) => {
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  
  // Withdrawal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [searchBank, setSearchBank] = useState("");
  const [showBanksList, setShowBanksList] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { role, email } = useAuthStore();

  // Determine user type based on role
  const userType = role === "admin" ? "admin" : "admin";

  // Query to fetch current balance for regular users and service providers
  const {
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["dashboard", userType],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
     
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
    enabled: userType !== "admin", // Only run for non-admin users
  });

  // Query to fetch admin dashboard data
  const {
    data: adminDashboardData,
    isLoading: isLoadingAdminBalance,
    refetch: refetchAdminBalance,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await AdminDashboardApi({ 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No admin dashboard data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
    enabled: userType === "admin", // Only run for admin users
  });

  // Query to fetch banks list
  const {
    data: banksData,
    isLoading: isLoadingBanks,
    // refetch: refetchBanks,
  } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await getBanksApi({ 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No banks data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Only fetch when needed
  });

  // Mutation for funding wallet
  const { mutateAsync: handleFundWallet, isPending: isFunding } = useMutation({
    mutationFn: (data: IFundWalletRequest) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return FundWalletApi(data, { signal: controller.signal });
    },
    onSuccess: (data) => {
      const responseData = data?.data;
      if (!responseData) {
        toast.error("Failed to create payment link");
        return;
      }
      // Store reference for payment verification
      localStorage.setItem('paymentReference', responseData.reference);
      // Redirect to Paystack payment page
      window.location.href = responseData.authorization_url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to fund wallet");
    },
  });

  // Mutation for admin withdrawal
  const { mutateAsync: handleWithdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: (data: IWithdrawRequest) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return adminWithdrawFundsApi(data, { signal: controller.signal });
    },
    onSuccess: (response) => {
      const withdrawalData = response?.data;
      const reference = withdrawalData?.reference;
      
      // Show success message with reference if available
      const successMessage = reference 
        ? `Withdrawal request submitted successfully! Reference: ${reference}`
        : "Withdrawal request submitted successfully!";
      
      toast.success(successMessage);
      setShowWithdrawModal(false);
      resetWithdrawForm();
      // Refetch admin balance
      refetchAdminBalance();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to process withdrawal");
    },
  });

  const handleTopUp = useCallback(async () => {
    if (!topUpAmount || isNaN(Number(topUpAmount)) || Number(topUpAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if user email is available from auth store
    if (!email) {
      toast.error("User email not found. Please login again.");
      return;
    }

    if (isFunding) {
      return;
    }

    try {
      await handleFundWallet({
        amount: Number(topUpAmount),
        email: email, // Use email from auth store
        callback_url: `${window.location.origin}/dashboard?payment=success`,
      });
    } catch  {
      // Error is handled in onError callback
    }
  }, [topUpAmount, email, isFunding, handleFundWallet]);

  const handleWithdrawSubmit = useCallback(async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (!accountNumber || accountNumber.length < 10) {
      toast.error("Please enter a valid account number (minimum 10 digits)");
      return;
    }

    if (!selectedBankCode) {
      toast.error("Please select a bank");
      return;
    }

    // Check if withdrawal amount exceeds available balance
    if (adminDashboardData && Number(withdrawAmount) > adminDashboardData.withdrawableBalance) {
      toast.error("Withdrawal amount exceeds available balance");
      return;
    }

    if (isWithdrawing) {
      return;
    }

    try {
      await handleWithdraw({
        amount: Number(withdrawAmount),
        accountNumber: accountNumber.trim(),
        bankCode: selectedBankCode,
      });
    } catch {
      // Error is handled in onError callback
    }
  }, [withdrawAmount, accountNumber, selectedBankCode, isWithdrawing, adminDashboardData, handleWithdraw]);

  const resetWithdrawForm = useCallback(() => {
    setWithdrawAmount("");
    setAccountNumber("");
    setSelectedBankCode("");
    setSearchBank("");
    setShowBanksList(false);
  }, []);

  // const handleTopUpClick = useCallback(() => {
  //   if (actions.includes("topUp")) {
  //     // Check if user email is available from auth store
  //     if (!email) {
  //       toast.error("User email not found. Please login again.");
  //       return;
  //     }
  //     setShowTopUpModal(true);
  //   }
  // }, [actions, email]);

  // const handleWithdrawClick = useCallback(() => {
  //   if (actions.includes("withdraw") && userType === "admin") {
  //     setShowWithdrawModal(true);
  //     // Fetch banks when opening withdraw modal
  //     refetchBanks();
  //   }
  // }, [actions, userType, refetchBanks]);

  const closeTopUpModal = useCallback(() => {
    setShowTopUpModal(false);
    setTopUpAmount("");
  }, []);

  const closeWithdrawModal = useCallback(() => {
    setShowWithdrawModal(false);
    resetWithdrawForm();
  }, [resetWithdrawForm]);

  // Filter banks based on search
  const filteredBanks = banksData?.filter((bank: IBank) => 
    bank.name.toLowerCase().includes(searchBank.toLowerCase())
  ) || [];

  // Get selected bank name
  const selectedBank = banksData?.find((bank: IBank) => bank.code === selectedBankCode);

  // Check for payment success and refetch balance
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success("Payment successful! Your wallet has been funded.");
      if (userType === "admin") {
        refetchAdminBalance();
      } else {
        refetchBalance();
      }
      // Close the modal if it's open
      setShowTopUpModal(false);
      setTopUpAmount("");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('paymentReference');
    }
  }, [refetchBalance, refetchAdminBalance, userType]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Determine current balance and loading state based on user type
  const isLoading = userType === "admin" ? isLoadingAdminBalance : isLoadingBalance;
  const currentBalance = (() => {
    if (userType === "admin" && adminDashboardData) {
      return `₦${adminDashboardData.withdrawableBalance.toLocaleString()}`;
    } 
    return amount;
  })();

  return (
    <>
      <div className="bg-primary px-6 py-7 rounded-lg text-white bg-[url(/src/assets/images/bg-balance.png)] relative">
        <div className="space-y-3">
          <div className="font-light">
            {userType === "admin" ? "Withdrawable Balance" : "Current Balance"}
          </div>
          <div className="text-2xl font-bold">
            {isLoading ? "Loading..." : currentBalance}
          </div>
{/* 
          <div className="space-x-4 space-y-2">
            {actions.includes("topUp") && userType !== "admin" && (
              <button 
                onClick={handleTopUpClick}
                disabled={isFunding || isLoading}
                className="bg-success border border-success px-5 py-2 rounded-lg text-xs inline-flex items-center space-x-2 font-bold disabled:opacity-50"
              >
                <TopUpIcon />
                <span>{isFunding ? "Processing..." : "Top-up"}</span>
              </button>
            )}
            {actions.includes("withdraw") && (
              <button 
                onClick={handleWithdrawClick}
                disabled={isLoading || (userType === "admin" && (!adminDashboardData || adminDashboardData.withdrawableBalance <= 0))}
                className="border border-white px-5 py-2 rounded-lg text-xs inline-flex items-center space-x-2 font-bold disabled:opacity-50"
              >
                <WithdrawIcon />
                <span>Withdraw</span>
              </button>
            )}
          </div> */}
        </div>
        <div className="absolute top-1/2 transform -translate-y-1/2 right-4 w-12 h-12 bg-[#E2EBF61A] grid place-items-center rounded-full">
          <TimerIcon className="h-6 w-6" />
        </div>
      </div>

      {/* Top-up Modal (only for non-admin users) */}
      {showTopUpModal && userType !== "admin" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-80">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Fund Wallet</h3>
            <div className="space-y-4">
              {/* Display user email (read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="w-full border border-gray-200 bg-gray-50 rounded px-4 py-2 text-gray-700">
                  {email || "No email found"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full border border-gray-300 rounded px-4 py-2"
                  min="1"
                  autoFocus
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleTopUp}
                  disabled={isFunding || !topUpAmount || !email}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
                >
                  {isFunding ? "Processing..." : "Proceed to Payment"}
                </button>
                <button
                  onClick={closeTopUpModal}
                  disabled={isFunding}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Withdrawal Modal */}
      {showWithdrawModal && userType === "admin" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-80">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Withdraw Funds</h3>
            <div className="space-y-4">
              {/* Available Balance Display */}
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Available Balance</div>
                <div className="text-lg font-semibold text-blue-600">
                  ₦{adminDashboardData?.withdrawableBalance.toLocaleString() || "0"}
                </div>
              </div>

              {/* Withdrawal Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full border border-gray-300 rounded px-4 py-2"
                  min="1"
                  max={adminDashboardData?.withdrawableBalance || 0}
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter account number"
                  className="w-full border border-gray-300 rounded px-4 py-2"
                  maxLength={10}
                />
              </div>

              {/* Bank Selection */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Select Bank
                </label>
                
                {/* Bank Selection Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoadingBanks) {
                      setShowBanksList(!showBanksList);
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-4 py-2 text-left bg-white hover:bg-gray-50 flex justify-between items-center"
                >
                  <span className={selectedBank ? "text-gray-900" : "text-gray-500"}>
                    {selectedBank ? selectedBank.name : "Select your bank"}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform text-gray-400 ${showBanksList ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Search Input (only shown when dropdown is open) */}
                {showBanksList && (
                  <input
                    type="text"
                    value={searchBank}
                    onChange={(e) => setSearchBank(e.target.value)}
                    placeholder="Search banks..."
                    className="w-full border-l border-r border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                )}

                {/* Banks Dropdown List */}
                {showBanksList && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b shadow-lg max-h-48 overflow-y-auto">
                    {isLoadingBanks ? (
                      <div className="p-4 text-center text-gray-500">Loading banks...</div>
                    ) : filteredBanks.length > 0 ? (
                      filteredBanks.map((bank: IBank) => (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => {
                            setSelectedBankCode(bank.code);
                            setSearchBank("");
                            setShowBanksList(false);
                          }}
                          className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            selectedBankCode === bank.code ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <div className="font-medium">{bank.name}</div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {searchBank ? "No banks found" : "No banks available"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleWithdrawSubmit}
                  disabled={
                    isWithdrawing || 
                    !withdrawAmount || 
                    !accountNumber || 
                    !selectedBankCode ||
                    accountNumber.length < 10
                  }
                  className="flex-1 bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? "Processing..." : "Withdraw Funds"}
                </button>
                <button
                  onClick={closeWithdrawModal}
                  disabled={isWithdrawing}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BalanceCard;