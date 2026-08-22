/**
 * Shared pagination footer for list pages.
 */
type PaginationControlsProps = {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ page, limit, total, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
      <span>
        Showing <strong className="text-[var(--color-text)]">{from}</strong>–
        <strong className="text-[var(--color-text)]">{to}</strong> of{" "}
        <strong className="text-[var(--color-text)]">{total}</strong>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
