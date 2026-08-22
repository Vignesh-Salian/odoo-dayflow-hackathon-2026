/**
 * OWNER: Prajwal (Person D) — shared form primitives (polished).
 */
import type { FormEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const controlClass = (error?: string, className = "") =>
  `w-full rounded-md border bg-[var(--color-surface)] px-3 py-2.5 outline-none transition focus:border-[var(--color-accent)] ${
    error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
  } ${className}`;

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({ label, error, id, className = "", ...rest }: FormFieldProps) {
  const fieldId = id ?? rest.name;
  return (
    <label className="block space-y-1.5" htmlFor={fieldId}>
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <input id={fieldId} className={controlClass(error, className)} {...rest} />
      {error ? <span className="block text-xs text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
};

export function SelectField({
  label,
  error,
  id,
  className = "",
  children,
  ...rest
}: SelectFieldProps) {
  const fieldId = id ?? rest.name;
  return (
    <label className="block space-y-1.5" htmlFor={fieldId}>
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <select id={fieldId} className={controlClass(error, className)} {...rest}>
        {children}
      </select>
      {error ? <span className="block text-xs text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function TextAreaField({
  label,
  error,
  id,
  className = "",
  ...rest
}: TextAreaFieldProps) {
  const fieldId = id ?? rest.name;
  return (
    <label className="block space-y-1.5" htmlFor={fieldId}>
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <textarea id={fieldId} className={controlClass(error, `resize-y ${className}`)} {...rest} />
      {error ? <span className="block text-xs text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  onSubmit,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="mb-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Dayflow
        </p>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {children}
        </form>
        {footer ? <div className="mt-6 text-sm text-[var(--color-muted)]">{footer}</div> : null}
      </div>
    </div>
  );
}
