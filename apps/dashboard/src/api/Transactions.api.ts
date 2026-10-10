import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest } from "./Api";

export interface ITransaction {
  _id: string;
  type: "deposit" | "withdrawal" | "payment" | "refund";
  amount: number;
  status: "success" | "pending" | "failed" | "cancelled";
  reference: string;
  note: string;
  createdAt: string;
}

export interface ITransactionHistoryData {
  total: number;
  page: number;
  limit: number;
  transactions: ITransaction[];
}

export interface ITransactionQueryParams {
  page?: number;
  limit?: number;
  status?: "success" | "pending" | "failed" | "cancelled";
  type?: "deposit" | "withdrawal" | "payment" | "refund";
  startDate?: string;
  endDate?: string;
}

// Get Transaction History
export const getTransactionHistoryApi = (
  params?: ITransactionQueryParams,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ITransactionHistoryData> | null> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `/api/paystack/transactions${queryString ? `?${queryString}` : ''}`;

  return handleApiRequest<ITransactionHistoryData>(() =>
    Api.get<ITransactionHistoryData>(url, config)
  );
};

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper function to format date
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

// Helper function to get status badge color
export function getStatusColor(status: ITransaction['status']): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get type color
export function getTypeColor(type: ITransaction['type']): string {
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