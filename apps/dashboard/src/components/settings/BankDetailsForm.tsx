// /components/Settings/TransactionHistoryTable.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getTransactionHistoryApi,
  ITransactionQueryParams,
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
        className="px-3 py-1 mx-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 text-sm border rounded ${
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
        className="px-3 py-1 mx-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    );

    return <div className="flex justify-center mt-6">{pages}</div>;
  };

  return (
    <div className={`bg-white p-4 md:p-6 space-y-6 w-full ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="payment">Payment</option>
            <option value="refund">Refund</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Items per page
          </label>
          <select
            value={filters.limit || ITEMS_PER_PAGE}
            onChange={(e) =>
              handleFilterChange({ limit: parseInt(e.target.value) })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load transactions</p>
            <button
              onClick={() => refetch()}
              className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    <span className="font-mono text-xs">
                      {transaction.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <span
                      className={`font-medium capitalize ${getTypeColor(
                        transaction.type
                      )}`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 border-b">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b max-w-xs">
                    <div className="truncate" title={transaction.note}>
                      {transaction.note || "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination and Summary */}
      {!isLoading && !error && transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500">
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