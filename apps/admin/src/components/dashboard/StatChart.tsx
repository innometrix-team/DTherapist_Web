import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import AdminDashboardApi from "../../api/AdminDashboard.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

// Mock API function for non-admin users - replace with your actual API


interface ChartData {
  month: string;
  deposits: number;
  withdrawals: number;
}

interface StatisticsData {
  year: number;
  data: ChartData[];
}

const StatChart: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { role } = useAuthStore();

  const years = [2023, 2024, 2025];
  const isAdmin = role === "admin";

  // Query to fetch admin dashboard data
  const {
    data: adminDashboardData,
    isLoading: isLoadingAdmin,
  } = useQuery({
    queryKey: ["admin-dashboard-chart"],
    queryFn: async () => {
      const response = await AdminDashboardApi();
      
      if (!response?.data) {
        throw new Error("No admin dashboard data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: isAdmin, // Only run for admin users
  });

  useEffect(() => {
    const loadData = async () => {
      if (isAdmin && adminDashboardData) {
        // Transform admin data to chart format
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const chartData: ChartData[] = monthNames.map((month, index) => ({
          month,
          deposits: adminDashboardData.trends.deposits[index] || 0,
          withdrawals: adminDashboardData.trends.withdrawals[index] || 0,
        }));

        setStatisticsData({
          year: selectedYear,
          data: chartData
        });
        setLoading(false);
      }
    };

    if (isAdmin) {
      setLoading(isLoadingAdmin);
      if (!isLoadingAdmin) {
        loadData();
      }
    } else {
      loadData();
    }
  }, [selectedYear, isAdmin, adminDashboardData, isLoadingAdmin]);

  const getBarHeight = (value: number, maxValue: number) => {
    return Math.max((value / maxValue) * 200, 8); // Minimum height of 8px
  };

  const maxValue = statisticsData ? Math.max(
    ...statisticsData.data.flatMap(item => [item.deposits, item.withdrawals])
  ) : 300000;

  const formatCurrency = (amount: number) => {
    const currency = isAdmin ? 'USD' : 'NGN';
    const symbol = isAdmin ? '$' : '₦';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(/[$₦]/, symbol);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setIsYearDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="flex items-end space-x-6 h-64">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex items-end space-x-1">
                <div className="w-full bg-gray-200 rounded-t" style={{ height: `${Math.random() * 150 + 50}px` }}></div>
                <div className="w-full bg-gray-200 rounded-t" style={{ height: `${Math.random() * 150 + 50}px` }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate legend values based on data
  const avgDeposits = statisticsData ? 
    Math.round(statisticsData.data.reduce((sum, item) => sum + item.deposits, 0) / 12) : 0;
  
  const avgWithdrawals = statisticsData ? 
    Math.round(statisticsData.data.reduce((sum, item) => sum + item.withdrawals, 0) / 12) : 0;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Statistics</h2>
          <p className="text-gray-500 text-sm">Deposits & Withdrawals</p>
        </div>
        
        {/* Year Selector */}
        <div className="relative">
          <button
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 font-medium">{selectedYear}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          
          {isYearDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    year === selectedYear ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  } ${year === years[0] ? 'rounded-t-lg' : ''} ${
                    year === years[years.length - 1] ? 'rounded-b-lg' : ''
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
          <span className="text-sm text-gray-600">
            Deposits: {formatCurrency(avgDeposits)} avg
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
          <span className="text-sm text-gray-600">
            Withdrawals: {formatCurrency(avgWithdrawals)} avg
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between space-x-3 h-64 mb-4">
          {statisticsData?.data.map((item, index) => (
            <div key={index} className="flex-1 flex items-end justify-center space-x-1 group">
              {/* Deposits Bar */}
              <div className="relative flex-1 max-w-[20px]">
                <div
                  className="bg-blue-600 rounded-t-sm transition-all duration-300 hover:bg-blue-700 cursor-pointer"
                  style={{ height: `${getBarHeight(item.deposits, maxValue)}px` }}
                  title={`Deposits: ${formatCurrency(item.deposits)}`}
                ></div>
              </div>
              
              {/* Withdrawals Bar */}
              <div className="relative flex-1 max-w-[20px]">
                <div
                  className="bg-green-500 rounded-t-sm transition-all duration-300 hover:bg-green-600 cursor-pointer"
                  style={{ height: `${getBarHeight(item.withdrawals, maxValue)}px` }}
                  title={`Withdrawals: ${formatCurrency(item.withdrawals)}`}
                ></div>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Deposits: {formatCurrency(item.deposits)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Withdrawals: {formatCurrency(item.withdrawals)}</span>
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Month Labels */}
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          {statisticsData?.data.map((item, index) => (
            <div key={index} className="flex-1 text-center">
              <span className="block transform -rotate-0 origin-center">
                {item.month.slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatChart;