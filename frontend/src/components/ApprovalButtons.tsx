/**
 * OWNER: Prajwal (Person D)
 * Approve (green) / Reject (red) action pair for leave manage.
 */
import { Check, X } from "lucide-react";

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
        className="df-btn inline-flex items-center gap-1 bg-[var(--color-success)] px-3 py-1.5 text-xs text-white hover:brightness-110 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        Approve
      </button>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onReject}
        className="df-btn inline-flex items-center gap-1 bg-[var(--color-danger)] px-3 py-1.5 text-xs text-white hover:brightness-110 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        Reject
      </button>
    </div>
  );
}
