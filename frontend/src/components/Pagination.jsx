/**
 * Builds the page list for a first/last + sliding-window pager, e.g. for
 * page 5 of 24: [1, "...", 4, 5, 6, "...", 24].
 *
 * The first and last pages are always shown so the ends stay reachable; the
 * window covers the current page and its immediate neighbours. Clamping the
 * window to 2..totalPages-1 is what keeps the ends from being emitted twice.
 */
function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  // Window bounds are clamped inside the ends, which are pushed separately.
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  pages.push(1);
  // An ellipsis is only meaningful when the window skips at least one page.
  // windowStart === 2 means page 2 is next in line, so there is nothing to hide.
  if (windowStart > 2) pages.push("...");
  for (let page = windowStart; page <= windowEnd; page++) pages.push(page);
  if (windowEnd < totalPages - 1) pages.push("...");
  // Guard against a single-page list rendering "1" twice.
  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination-button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      {getPageNumbers(currentPage, totalPages).map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="pagination-ellipsis">
            ...
          </span>
        ) : (
          <button
            type="button"
            key={page}
            className={
              page === currentPage
                ? "pagination-button pagination-active"
                : "pagination-button"
            }
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination-button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </nav>
  );
}
