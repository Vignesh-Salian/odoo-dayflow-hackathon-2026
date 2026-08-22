/**
 * OWNER: Prajwal (Person D)
 * Modal dialog — portaled to body so it always stacks above layout (sidebar/header).
 */
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/55 backdrop-blur-[3px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={`relative z-10 m-3 flex max-h-[min(92vh,900px)] w-full flex-col animate-[modal-in_180ms_ease-out] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
