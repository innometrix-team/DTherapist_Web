import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSearch, Loader2, RefreshCw, RotateCcw, Search } from "lucide-react";
import {
  AuditCategory,
  AuditOutcome,
  getAuditLogsApi,
  IAuditLog,
} from "../../api/AuditLogs.api";
import Pagination from "../../components/pagination/Pagination";

interface AuditFilterState {
  search: string;
  category: AuditCategory | "";
  outcome: AuditOutcome | "";
  fromDate: string;
  toDate: string;
}

const INITIAL_FILTERS: AuditFilterState = {
  search: "",
  category: "",
  outcome: "",
  fromDate: "",
  toDate: "",
};

const OUTCOME_BADGES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failure: "bg-rose-50 text-rose-700 ring-rose-200",
  partial: "bg-amber-50 text-amber-700 ring-amber-200",
};

const CATEGORY_BADGES: Record<string, string> = {
  auth: "bg-blue-50 text-blue-700 ring-blue-200",
  booking: "bg-purple-50 text-purple-700 ring-purple-200",
  payment: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  admin: "bg-gray-100 text-gray-800 ring-gray-200",
};

function formatAuditTimestamp(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function toStartIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function toExclusiveEndIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<AuditFilterState>(INITIAL_FILTERS);
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);

  const updateFilter = <K extends keyof AuditFilterState>(
    key: K,
    value: AuditFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-audit-logs", page, limit, filters],
    queryFn: async ({ signal }) => {
      const res = await getAuditLogsApi(
        {
          page,
          limit,
          search: filters.search,
          category: filters.category,
          outcome: filters.outcome,
          from: toStartIso(filters.fromDate),
          to: toExclusiveEndIso(filters.toDate),
        },
        { signal }
      );
      if (!res?.data) throw new Error("Failed to load audit logs");
      return res.data;
    },
    staleTime: 30_000,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileSearch className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500">
              Newest first · Track logins, bookings, payments, and admin actions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-divider rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </button>
          )}
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-divider rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-divider rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search event text or exact actor/target/user ID..."
              className="w-full pl-9 pr-3 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              updateFilter("category", e.target.value as AuditCategory | "")
            }
            aria-label="Category"
            className="px-3 py-2 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Categories</option>
            <option value="auth">Auth</option>
            <option value="booking">Booking</option>
            <option value="payment">Payment</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={filters.outcome}
            onChange={(e) =>
              updateFilter("outcome", e.target.value as AuditOutcome | "")
            }
            aria-label="Outcome"
            className="px-3 py-2 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Outcomes</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span>From:</span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => updateFilter("fromDate", e.target.value)}
              className="px-2.5 py-1.5 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span>To (inclusive):</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => updateFilter("toDate", e.target.value)}
              className="px-2.5 py-1.5 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 ml-auto">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white border border-divider rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-14 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading audit logs…
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-rose-600 px-4">
            {error instanceof Error ? error.message : "Failed to load audit logs."}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-14 px-4 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-offwhite border border-divider flex items-center justify-center text-gray-400">
              <FileSearch className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-semibold text-gray-900">
                {hasActiveFilters ? "No matching audit logs" : "No audit logs yet"}
              </h3>
              <p className="text-xs text-gray-500">
                {hasActiveFilters
                  ? "No entries matched your current search or filter criteria. Try adjusting or resetting your filters."
                  : "Audit events such as logins, bookings, payments, and admin actions will appear here as they occur."}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-divider hover:bg-gray-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-divider">
              {logs.map((log) => {
                const actorDisplay = log.actorId || log.source || "—";
                return (
                  <div
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="p-4 space-y-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-gray-900 break-all">
                        {log.event}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ring-1 capitalize shrink-0 ${
                          OUTCOME_BADGES[log.outcome] ??
                          "bg-gray-100 text-gray-700 ring-gray-200"
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span
                        className={`px-2 py-0.5 rounded-full ring-1 capitalize ${
                          CATEGORY_BADGES[log.category] ??
                          "bg-gray-100 text-gray-700 ring-gray-200"
                        }`}
                      >
                        {log.category}
                      </span>
                      <span>{formatAuditTimestamp(log.createdAt)}</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div className="truncate">
                        <span className="text-gray-400">Actor: </span>
                        <span className="font-mono">{actorDisplay}</span>
                      </div>
                      {(log.targetType || log.targetId) && (
                        <div className="truncate">
                          <span className="text-gray-400">Target: </span>
                          <span>{log.targetType ? `${log.targetType}: ` : ""}</span>
                          <span className="font-mono">{log.targetId || "—"}</span>
                        </div>
                      )}
                      {log.affectedUserId && (
                        <div className="truncate">
                          <span className="text-gray-400">Affected User: </span>
                          <span className="font-mono">{log.affectedUserId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-offwhite border-b border-divider text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Outcome</th>
                    <th className="px-4 py-3 font-medium">Actor / Source</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Affected User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider text-sm">
                  {logs.map((log) => {
                    const actorDisplay = log.actorId || log.source || "—";
                    return (
                      <tr
                        key={log._id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {formatAuditTimestamp(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                          {log.event}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ring-1 capitalize ${
                              CATEGORY_BADGES[log.category] ??
                              "bg-gray-100 text-gray-700 ring-gray-200"
                            }`}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ring-1 capitalize ${
                              OUTCOME_BADGES[log.outcome] ??
                              "bg-gray-100 text-gray-700 ring-gray-200"
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-[180px] truncate">
                          {actorDisplay}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[200px] truncate">
                          {log.targetType && (
                            <span className="text-gray-500 mr-1 capitalize">
                              {log.targetType}:
                            </span>
                          )}
                          <span className="font-mono">{log.targetId || "—"}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-[180px] truncate">
                          {log.affectedUserId || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-divider">
            <Pagination
              total={pagination.total}
              page={page}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-xl p-5 shadow-xl space-y-4 max-h-[85svh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-divider pb-3">
              <h3 className="text-base font-semibold font-mono text-gray-900">
                {selectedLog.event}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-gray-500">Timestamp</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {formatAuditTimestamp(selectedLog.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Category / Outcome</dt>
                <dd className="font-medium text-gray-900 mt-0.5 capitalize">
                  {selectedLog.category} · {selectedLog.outcome}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  {selectedLog.actorId ? "Actor ID" : "Source"}
                </dt>
                <dd className="font-mono text-gray-900 mt-0.5 break-all">
                  {selectedLog.actorId || selectedLog.source || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  Target {selectedLog.targetType ? `(${selectedLog.targetType})` : ""}
                </dt>
                <dd className="font-mono text-gray-900 mt-0.5 break-all">
                  {selectedLog.targetId || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Affected User ID</dt>
                <dd className="font-mono text-gray-900 mt-0.5 break-all">
                  {selectedLog.affectedUserId || "—"}
                </dd>
              </div>
              {selectedLog.message && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Message</dt>
                  <dd className="text-gray-800 mt-0.5">{selectedLog.message}</dd>
                </div>
              )}
              {selectedLog.metadata && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 mb-1">Metadata</dt>
                  <dd>
                    <pre className="bg-offwhite border border-divider rounded-lg p-3 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
