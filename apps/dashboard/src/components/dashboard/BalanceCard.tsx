import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { BalanceConfig } from "../../pages/dashboard/types";
import { TopUpIcon, WithdrawIcon, TimerIcon } from "../../assets/icons";
import FundWalletApi, { 
  IFundWalletRequest, 
  getBanksApi, 
  withdrawFundsApi,
  IBank,
  IWithdrawRequest 
} from "../../api/FundWallet.api";
import DashboardApi from "../../api/Dashboard.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

const BalanceCard: React.FC<BalanceConfig> = ({ amount, actions }) => {
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<IBank | null>(null);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { role, email } = useAuthStore(); // Get email directly from auth store

  // Determine user type based on role
  const userType = role === "counselor" ? "service-provider" : "user";

  // Query to fetch banks list
  const {
    data: banksData,
    isLoading: isLoadingBanks,
  } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await getBanksApi({ signal: controller.signal });
      return response?.data || [];
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - banks don't change often
    enabled: role === "counselor", // Only fetch banks for counselors
  });

  // Filter banks based on search term
  const filteredBanks = banksData?.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase())
  ) || [];

  // Query to fetch current balance
  const {
    data: dashboardData,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["dashboard", userType],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await DashboardApi(userType, { 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No dashboard data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
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

  // Mutation for withdrawal
  const { mutateAsync: handleWithdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: (data: IWithdrawRequest) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return withdrawFundsApi(data, { signal: controller.signal });
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Withdrawal request submitted successfully");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setAccountNumber("");
      setSelectedBank(null);
      setBankSearchTerm("");
      refetchBalance(); // Refresh balance
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
      toast.error("Please enter a valid account number");
      return;
    }

    if (!selectedBank) {
      toast.error("Please select a bank");
      return;
    }

    if (isWithdrawing) {
      return;
    }

    try {
      await handleWithdraw({
        amount: Number(withdrawAmount),
        accountNumber: accountNumber,
        bankCode: selectedBank.code,
      });
    } catch {
      // Error is handled in onError callback
    }
  }, [withdrawAmount, accountNumber, selectedBank, isWithdrawing, handleWithdraw]);

  const handleTopUpClick = useCallback(() => {
    if (actions.includes("topUp")) {
      // Check if user email is available from auth store
      if (!email) {
        toast.error("User email not found. Please login again.");
        return;
      }
      setShowTopUpModal(true);
    }
  }, [actions, email]);

  const handleWithdrawClick = useCallback(() => {
    if (actions.includes("withdraw") && role === "counselor") {
      setShowWithdrawModal(true);
    }
  }, [actions, role]);

  const handleBankSelect = useCallback((bank: IBank) => {
    setSelectedBank(bank);
    setBankSearchTerm(bank.name);
    setShowBankDropdown(false);
  }, []);

  const closeTopUpModal = useCallback(() => {
    setShowTopUpModal(false);
    setTopUpAmount("");
  }, []);

  const closeWithdrawModal = useCallback(() => {
    setShowWithdrawModal(false);
    setWithdrawAmount("");
    setAccountNumber("");
    setSelectedBank(null);
    setBankSearchTerm("");
    setShowBankDropdown(false);
  }, []);

  // Check for payment success and refetch balance
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success("Payment successful! Your wallet has been funded.");
      refetchBalance();
      // Close the modal if it's open
      setShowTopUpModal(false);
      setTopUpAmount("");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('paymentReference');
    }
  }, [refetchBalance]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Use live balance from API or fallback to prop
  const currentBalance = dashboardData 
    ? `₦${dashboardData.balance.toLocaleString()}` 
    : amount;

  return (
    <>
      <div className="bg-primary px-6 py-7 rounded-lg text-white bg-[url(/src/assets/images/bg-balance.png)] relative">
        <div className="space-y-3">
          <div className="font-light">Current Balance</div>
          <div className="text-2xl font-bold">
            {isLoadingBalance ? "Loading..." : currentBalance}
          </div>

          <div className="space-x-4 space-y-2">
            {actions.includes("topUp") && (
              <button 
                onClick={handleTopUpClick}
                disabled={isFunding || isLoadingBalance}
                className="bg-success border border-success px-5 py-2 rounded-lg text-xs inline-flex items-center space-x-2 font-bold disabled:opacity-50"
              >
                <TopUpIcon />
                <span>{isFunding ? "Processing..." : "Top-up"}</span>
              </button>
            )}
            {/* Only show withdraw button for counselors */}
            {actions.includes("withdraw") && role === "counselor" && (
              <button 
                onClick={handleWithdrawClick}
                disabled={isLoadingBalance || isWithdrawing}
                className="border border-white px-5 py-2 rounded-lg text-xs inline-flex items-center space-x-2 font-bold disabled:opacity-50"
              >
                <WithdrawIcon />
                <span>{isWithdrawing ? "Processing..." : "Withdraw"}</span>
              </button>
            )}
          </div>
        </div>
        <div className="absolute top-1/2 transform -translate-y-1/2 right-4 w-12 h-12 bg-[#E2EBF61A] grid place-items-center rounded-full">
          <TimerIcon className="h-6 w-6" />
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
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

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-80">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Withdraw Funds</h3>
            <div className="space-y-4">
              {/* Withdrawal Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter withdrawal amount"
                  className="w-full border border-gray-300 rounded px-4 py-2"
                  min="1"
                  autoFocus
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
                  onChange={(e) => setAccountNumber(e.target.value)}
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
                <div className="relative">
                  <input
                    type="text"
                    value={bankSearchTerm}
                    onChange={(e) => {
                      setBankSearchTerm(e.target.value);
                      setShowBankDropdown(true);
                      if (!e.target.value) {
                        setSelectedBank(null);
                      }
                    }}
                    onFocus={() => setShowBankDropdown(true)}
                    placeholder="Search for a bank..."
                    className="w-full border border-gray-300 rounded px-4 py-2 pr-8"
                    disabled={isLoadingBanks}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Bank Dropdown */}
                {showBankDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {isLoadingBanks ? (
                      <div className="px-4 py-2 text-gray-500">Loading banks...</div>
                    ) : filteredBanks.length > 0 ? (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => handleBankSelect(bank)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <div className="font-medium">{bank.name}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        {bankSearchTerm ? "No banks found" : "Start typing to search banks"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Bank Display */}
              {selectedBank && (
                <div className="bg-gray-50 border border-gray-200 rounded px-4 py-2">
                  <div className="text-sm font-medium text-gray-700">Selected Bank:</div>
                  <div className="font-medium">{selectedBank.name}</div>
                  <div className="text-sm text-gray-500">{accountNumber}</div>
                </div>
              )}

              <div className="flex space-x-4 pt-2">
                <button
                  onClick={handleWithdrawSubmit}
                  disabled={
                    isWithdrawing || 
                    !withdrawAmount || 
                    !accountNumber || 
                    !selectedBank ||
                    accountNumber.length < 10
                  }
                  className="flex-1 bg-primary text-white py-2 px-4 rounded font-medium disabled:opacity-50"
                >
                  {isWithdrawing ? "Processing..." : "Submit Withdrawal"}
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

      {/* Click outside to close bank dropdown */}
      {showBankDropdown && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowBankDropdown(false)}
        />
      )}
    </>
  );
};

export default BalanceCard;