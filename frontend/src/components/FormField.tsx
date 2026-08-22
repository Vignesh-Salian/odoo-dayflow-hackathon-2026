/**
 * OWNER: Prajwal (Person D) — shared form primitives (polished).
 */
import type {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../features/theme/ThemeContext.tsx";

const controlClass = (error?: string, className = "") =>
  `df-input ${error ? "!border-[var(--color-danger)]" : ""} ${className}`;

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({ label, error, id, className = "", ...rest }: FormFieldProps) {
  const fieldId = id ?? rest.name;
  return (
    <label className="block space-y-1.5" htmlFor={fieldId}>
      <span className="text-sm font-medium text-[var(--color-muted)]">{label}</span>
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
      <span className="text-sm font-medium text-[var(--color-muted)]">{label}</span>
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
      <span className="text-sm font-medium text-[var(--color-muted)]">{label}</span>
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
  wide,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] shadow-[var(--shadow-card)] transition hover:text-[var(--color-text)]"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to night mode"}
      >
        {theme === "dark" ? (
          <>
            <Sun className="h-4 w-4 text-[var(--color-warning)]" />
            Light
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-[var(--color-accent)]" />
            Night
          </>
        )}
      </button>

      <div
        className={`df-card w-full animate-fade-up p-7 sm:p-8 ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <p className="mb-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-accent)]">
          Dayflow
        </p>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {children}
        </form>
        {footer ? (
          <div className="mt-6 text-sm text-[var(--color-muted)]">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
