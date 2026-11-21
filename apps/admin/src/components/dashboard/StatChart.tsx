import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { IAdminOverviewData } from "../../api/AdminDashboard.api";
import { useAuthStore } from "../../store/auth/useAuthStore";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface StatChartProps {
  overviewData?: IAdminOverviewData;
  overviewLoading?: boolean;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

type ChartView = "appointments" | "signups";

const StatChart: React.FC<StatChartProps> = ({
  overviewData,
  overviewLoading,
  selectedYear,
  onYearChange,
}) => {
  const currentYear = new Date().getFullYear();
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [chartView, setChartView] = useState<ChartView>("appointments");
  const role = useAuthStore((s) => s.role);

  const years = [
    currentYear - 4,
    currentYear - 3,
    currentYear - 2,
    currentYear - 1,
    currentYear,
  ];
  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">
            Admin access required to view chart data
          </p>
        </div>
      </div>
    );
  }

  if (overviewLoading && !overviewData) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
          <div className="flex items-end space-x-6 h-64">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex items-end space-x-1">
                <div className="w-full bg-gray-200 rounded-t h-24" />
                <div className="w-full bg-gray-200 rounded-t h-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">Failed to load overview analytics</p>
          <p className="text-red-500 text-xs mt-1">Please refresh the page</p>
        </div>
      </div>
    );
  }

  const monthly = MONTH_NAMES.map((label, idx) => {
    const entry = overviewData.monthly.find((m) => m.month === idx + 1);
    return {
      label,
      clientSignups: entry?.clientSignups ?? 0,
      therapistSignups: entry?.therapistSignups ?? 0,
      appointments: entry?.appointments ?? 0,
      completedAppointments: entry?.completedAppointments ?? 0,
    };
  });

  const maxValue = Math.max(
    1,
    ...monthly.flatMap((m) =>
      chartView === "appointments"
        ? [m.appointments, m.completedAppointments]
        : [m.clientSignups, m.therapistSignups]
    )
  );

  const getBarHeight = (value: number) =>
    value <= 0 ? 4 : Math.max((value / maxValue) * 200, 8);

  const primaryLabel =
    chartView === "appointments" ? "Total Appointments" : "Client Signups";
  const secondaryLabel =
    chartView === "appointments" ? "Completed Appointments" : "Therapist Signups";

  const totalPrimary = monthly.reduce(
    (sum, m) =>
      sum + (chartView === "appointments" ? m.appointments : m.clientSignups),
    0
  );
  const totalSecondary = monthly.reduce(
    (sum, m) =>
      sum +
      (chartView === "appointments" ? m.completedAppointments : m.therapistSignups),
    0
  );

  return (
    <div className="bg-white rounded-lg p-6 border border-stone-200">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Overview Analytics ({overviewData.year})
          </h2>
          <p className="text-gray-500 text-sm">
            Monthly breakdown · Timezone: {overviewData.timezone}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric Toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setChartView("appointments")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                chartView === "appointments"
                  ? "bg-white text-primary shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Appointments
            </button>
            <button
              type="button"
              onClick={() => setChartView("signups")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                chartView === "signups"
                  ? "bg-white text-primary shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Signups
            </button>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                    type="button"
                    onClick={() => {
                      onYearChange(year);
                      setIsYearDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                      year === selectedYear
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-sm" />
          <span className="text-sm text-gray-600">
            {primaryLabel}: {totalPrimary.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-sm" />
          <span className="text-sm text-gray-600">
            {secondaryLabel}: {totalSecondary.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between space-x-2 sm:space-x-3 h-64 mb-4">
          {monthly.map((item) => {
            const val1 =
              chartView === "appointments" ? item.appointments : item.clientSignups;
            const val2 =
              chartView === "appointments"
                ? item.completedAppointments
                : item.therapistSignups;
            return (
              <div
                key={item.label}
                className="relative flex-1 flex items-end justify-center space-x-1 group"
              >
                <div className="relative flex-1 max-w-[20px]">
                  <div
                    className="bg-blue-600 rounded-t-sm transition-all duration-300 hover:bg-blue-700 cursor-pointer"
                    style={{ height: `${getBarHeight(val1)}px` }}
                    title={`${primaryLabel}: ${val1}`}
                  />
                </div>
                <div className="relative flex-1 max-w-[20px]">
                  <div
                    className="bg-green-500 rounded-t-sm transition-all duration-300 hover:bg-green-600 cursor-pointer"
                    style={{ height: `${getBarHeight(val2)}px` }}
                    title={`${secondaryLabel}: ${val2}`}
                  />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                  <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap space-y-1">
                    <div className="font-semibold text-gray-200">{item.label}</div>
                    <div>Appointments: {item.appointments}</div>
                    <div>Completed: {item.completedAppointments}</div>
                    <div>Client signups: {item.clientSignups}</div>
                    <div>Therapist signups: {item.therapistSignups}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Month Labels */}
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          {monthly.map((item) => (
            <div key={item.label} className="flex-1 text-center">
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatChart;
