// /components/Settings/TransactionHistoryTable.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getTransactionHistoryApi,
  ITransactionQueryParams,
  ITransaction,
  formatCurrency,
  formatDate,
  getStatusColor,
  getTypeColor,
} from "../../api/Transactions.api";

interface TransactionHistoryTableProps {
  className?: string;
}

const ITEMS_PER_PAGE = 10;

const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ITransactionQueryParams>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch transaction history
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return getTransactionHistoryApi(filters, { signal: controller.signal });
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });

  // FIXED: Handle the nested data structure correctly
  // transactionData.data contains the actual API response
  const actualData = transactionData?.data;
  const transactions = actualData?.transactions || [];
  const totalTransactions = actualData?.total || 0;

  // Debug logging
  console.log('Raw transaction data:', transactionData);
  console.log('Actual API data:', actualData);
  console.log('Extracted transactions:', transactions);
  console.log('Total transactions:', totalTransactions);
  
  const totalPages = Math.ceil(totalTransactions / (filters.limit || ITEMS_PER_PAGE));

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ITransactionQueryParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
    setCurrentPage(1);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error("Failed to load transaction history. Please try again.");
    }
  }, [error]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 sm:px-3 py-1 mx-0.5 sm:mx-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
      </button>
    );

    // Page numbers - show fewer on mobile
    const mobileMaxPages = 3;
    const currentMaxPages = window.innerWidth < 640 ? mobileMaxPages : maxVisiblePages;
    const mobileStartPage = Math.max(1, currentPage - Math.floor(currentMaxPages / 2));
    const mobileEndPage = Math.min(totalPages, mobileStartPage + currentMaxPages - 1);

    for (let i = mobileStartPage; i <= mobileEndPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2 sm:px-3 py-1 mx-0.5 sm:mx-1 text-xs sm:text-sm border rounded ${
            i === currentPage
              ? "bg-primary text-white border-primary"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 sm:px-3 py-1 mx-0.5 sm:mx-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden">Next</span>
      </button>
    );

    return <div className="flex justify-center mt-4 sm:mt-6">{pages}</div>;
  };

  // Mobile card view for transactions
  const renderMobileCard = (transaction: ITransaction) => (
    <div key={transaction._id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            Ref: {transaction.reference}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`text-xs font-medium capitalize ${getTypeColor(
                transaction.type
              )}`}
            >
              {transaction.type}
            </span>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                transaction.status
              )}`}
            >
              {transaction.status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(transaction.amount)}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(transaction.createdAt)}
          </div>
        </div>
      </div>
      {transaction.note && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
          <span className="font-medium text-gray-700">Note: </span>
          {transaction.note}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Transaction History
        </h2>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-3 sm:px-4 py-2 rounded text-sm disabled:opacity-50 w-full sm:w-auto"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status || ""}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange({ 
                status: value ? (value as "success" | "pending" | "failed" | "cancelled") : undefined 
              });
            }}
            className="w-full border border-gray-300 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.type || ""}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange({ 
                type: value ? (value as "deposit" | "withdrawal" | "payment" | "refund") : undefined 
              });
            }}
            className="w-full border border-gray-300 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="payment">Payment</option>
            <option value="refund">Refund</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Items per page
          </label>
          <select
            value={filters.limit || ITEMS_PER_PAGE}
            onChange={(e) =>
              handleFilterChange({ limit: parseInt(e.target.value) })
            }
            className="w-full border border-gray-300 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm sm:text-base text-gray-600">
              Loading transactions...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-red-600 mb-4 text-sm sm:text-base">
              Failed to load transactions
            </p>
            <button
              onClick={() => refetch()}
              className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-gray-500 text-sm sm:text-base">
              No transactions found
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="block lg:hidden space-y-4">
              {transactions.map(renderMobileCard)}
            </div>

            {/* Desktop/Tablet View - Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Reference
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Type
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Amount
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Status
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Date
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-3 xl:px-4 py-3 text-xs xl:text-sm text-gray-900 border-b">
                        <span className="font-mono text-xs">
                          {transaction.reference}
                        </span>
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-xs xl:text-sm border-b">
                        <span
                          className={`font-medium capitalize ${getTypeColor(
                            transaction.type
                          )}`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-xs xl:text-sm font-medium text-gray-900 border-b">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-xs xl:text-sm border-b">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-xs xl:text-sm text-gray-500 border-b">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-xs xl:text-sm text-gray-600 border-b max-w-xs">
                        <div className="truncate" title={transaction.note}>
                          {transaction.note || "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination and Summary */}
      {!isLoading && !error && transactions.length > 0 && (
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Showing {((currentPage - 1) * (filters.limit || ITEMS_PER_PAGE)) + 1} to{" "}
            {Math.min(currentPage * (filters.limit || ITEMS_PER_PAGE), totalTransactions)} of{" "}
            {totalTransactions} transactions
          </div>
          {renderPagination()}
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryTable;