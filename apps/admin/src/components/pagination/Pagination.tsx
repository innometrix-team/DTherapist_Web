import React from "react";

/**
 * Reusable Pagination component (TailwindCSS + accessible)
 *
 * Features
 * - First/last boundaries with smart ellipses
 * - Configurable sibling & boundary counts
 * - Prev/Next buttons
 * - Optional "Showing X–Y of Z" summary
 * - Works with any list (you control data fetching)
 */
export type PaginationProps = {
  /** Total number of items across all pages */
  total: number;
  /** Current 1-based page index */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Handler called with the next page index */
  onPageChange: (nextPage: number) => void;
  /** Number of pages to show on each side of the current page. Default: 1 */
  siblingCount?: number;
  /** Number of boundary pages to always show at the start & end. Default: 1 */
  boundaryCount?: number;
  /** Show the results summary line. Default: true */
  showSummary?: boolean;
  /** Optional className to customize the container */
  className?: string;
  /** Labels for i18n/customization */
  labels?: {
    prev?: string;
    next?: string;
    of?: string; // used in summary: "of {total} results"
    results?: string; // used in summary: "{total} results"
    showing?: string; // used in summary: "Showing {start} to {end} ..."
  };
};

// A small utility to create a numeric range
const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

// Token used to represent an ellipsis in the page list
const ELLIPSIS = "…" as const;

type PageToken = number | typeof ELLIPSIS;

function usePagination(
  totalPages: number,
  page: number,
  siblingCount: number,
  boundaryCount: number
): PageToken[] {
  // Based on Material UI's pagination logic
  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(
    Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
    totalPages
  );

  const siblingsStart = Math.max(
    Math.min(
      // Natural start
      page - siblingCount,
      // Lower boundary when page is close to the end
      totalPages - boundaryCount - siblingCount * 2 - 1
    ),
    // Lower boundary when page is close to the start
    boundaryCount + 2
  );

  const siblingsEnd = Math.min(
    Math.max(
      // Natural end
      page + siblingCount,
      // Upper boundary when page is close to the start
      boundaryCount + siblingCount * 2 + 2
    ),
    // Upper boundary when page is close to the end
    endPages.length > 0 ? endPages[0] - 2 : totalPages - 1
  );

  const itemList: PageToken[] = [
    ...startPages,
    // Insert start ellipsis if needed
    ...(siblingsStart > boundaryCount + 2
      ? [ELLIPSIS]
      : boundaryCount + 1 < totalPages - boundaryCount
      ? [boundaryCount + 1]
      : []),
    ...range(siblingsStart, siblingsEnd),
    // Insert end ellipsis if needed
    ...(siblingsEnd < totalPages - boundaryCount - 1
      ? [ELLIPSIS]
      : totalPages - boundaryCount > boundaryCount
      ? [totalPages - boundaryCount]
      : []),
    ...endPages,
  ];
  return itemList;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  showSummary = true,
  className,
  labels = {
    prev: "Prev",
    next: "Next",
    showing: "Showing",
    of: "of",
    results: "results",
  },
}) => {
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const tokens = usePagination(
    totalPages,
    currentPage,
    siblingCount,
    boundaryCount
  );

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const btnBase =
    "px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1";

  const neutralBtn = `${btnBase} border-gray-300 hover:bg-gray-50`;
  const activeBtn = `${btnBase} bg-blue-600 text-white border-blue-600`;

  const container =
    "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pb-4 sm:pb-6";

  if (total === 0) return null;

  return (
    <nav
      className={className ? `${container} ${className}` : container}
      role="navigation"
      aria-label="Pagination"
    >
      {showSummary && (
        <div className="text-sm text-gray-500 text-center sm:text-left">
          {labels.showing} {startItem} to {endItem} {labels.of} {total}{" "}
          {labels.results}
        </div>
      )}

      <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={neutralBtn}
          aria-label="Previous page"
        >
          {labels.prev}
        </button>

        {/* Page tokens */}
        <div className="flex items-center space-x-1">
          {tokens.map((token, idx) =>
            token === ELLIPSIS ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 sm:px-2 py-1 text-xs sm:text-sm select-none"
              >
                {ELLIPSIS}
              </span>
            ) : (
              <button
                key={token}
                type="button"
                onClick={() => onPageChange(token)}
                className={token === currentPage ? activeBtn : neutralBtn}
                aria-current={token === currentPage ? "page" : undefined}
                aria-label={`Page ${token}`}
              >
                {token}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={neutralBtn}
          aria-label="Next page"
        >
          {labels.next}
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
