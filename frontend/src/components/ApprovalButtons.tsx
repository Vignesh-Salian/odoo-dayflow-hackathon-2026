/**
 * OWNER: Prajwal (Person D)
 * Approve (green) / Reject (red) action pair for leave manage.
 */
type ApprovalButtonsProps = {
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function ApprovalButtons({
  onApprove,
  onReject,
  disabled,
  loading,
}: ApprovalButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onApprove}
        className="rounded-md bg-[var(--color-success)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onReject}
        className="rounded-md bg-[var(--color-danger)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
