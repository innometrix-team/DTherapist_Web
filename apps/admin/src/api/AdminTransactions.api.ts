import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

export interface IAdminTransaction {
  transactionId: string;
  customer: {
    _id: string;
    fullName: string | null;
    email: string;
  } | null; // Updated to allow null
  date: string;
  type: "deposit" | "withdrawal" | "payment" | "refund";
  amount: number;
  status: "success" | "pending" | "failed" | "cancelled";
}

export interface IAdminTransactionHistoryData {
  transactions: IAdminTransaction[];
  total: number;
  page: number;
  limit: number;
}

interface APIResponse {
  status: string;
  message: string;
  data: IAdminTransaction[];
}

interface APIErrorResponse {
  code: number;
  status: string;
  message: string;
  data: undefined;
}

export interface IAdminTransactionQueryParams {
  page?: number;
  limit?: number;
  status?: "success" | "pending" | "failed" | "cancelled";
  type?: "deposit" | "withdrawal" | "payment" | "refund";
  search?: string; // For searching transaction ID
  startDate?: string;
  endDate?: string;
}

// Get Admin Transaction History
export async function getAdminTransactionHistoryApi(
  params?: IAdminTransactionQueryParams,
  config?: AxiosRequestConfig
): Promise<IAPIResult<IAdminTransactionHistoryData> | null> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/api/admin/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await Api.get<APIResponse>(url, {
      ...config,
    });
    
    // TEMPORARY CLIENT-SIDE PAGINATION FIX
    // (Remove this once your backend implements proper pagination)
    let filteredTransactions = response.data.data;
    
    // Apply client-side filtering
    if (params?.status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === params.status);
    }
    
    if (params?.type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === params.type);
    }
    
    if (params?.search) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.transactionId.toLowerCase().includes(params.search!.toLowerCase()) ||
        t.customer?.fullName?.toLowerCase().includes(params.search!.toLowerCase()) ||
        t.customer?.email?.toLowerCase().includes(params.search!.toLowerCase())
      );
    }
    
    // Apply client-side pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Transform the response to match our expected structure
    const transformedData: IAdminTransactionHistoryData = {
      transactions: paginatedTransactions,
      total: filteredTransactions.length, // Total after filtering
      page: page,
      limit: limit,
    };
    
    return Promise.resolve({
      code: response.status,
      status: response.data.status,
      message: response.data.message,
      data: transformedData
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const error = e as AxiosError<IAPIResult>;
    const statusCode = error.response?.status || 0;
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch admin transaction history";
    const status = error.response?.data?.status || "error";
    
    return Promise.reject<APIErrorResponse>({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Helper function to format currency (using Naira as shown in image)
export function formatAdminCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format date (matching the "Thur, May 18th, 2025" format from image)
export function formatAdminDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  };
  
  const formatted = date.toLocaleDateString('en-US', options);
  // Add ordinal suffix to day
  const day = date.getDate();
  const ordinalSuffix = getOrdinalSuffix(day);
  
  return formatted.replace(/\d+/, `${day}${ordinalSuffix}`);
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Helper function to get status badge color (matching image colors)
export function getAdminStatusColor(status: IAdminTransaction['status']): string {
  switch (status) {
    case 'success':
      return 'bg-blue-100 text-blue-800'; // Completed - blue as shown in image
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'; // Pending - yellow/orange
    case 'failed':
      return 'bg-red-100 text-red-800'; // Failed - red
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'; // Cancelled - gray
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get status display text
export function getAdminStatusText(status: IAdminTransaction['status']): string {
  switch (status) {
    case 'success':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

// Helper function to get type color
export function getAdminTypeColor(type: IAdminTransaction['type']): string {
  switch (type) {
    case 'deposit':
      return 'text-green-600';
    case 'withdrawal':
      return 'text-red-600';
    case 'payment':
      return 'text-blue-600';
    case 'refund':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}