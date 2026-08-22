/**
 * OWNER: Prasanna (Person A) — company branding (logo for navbar / payslips).
 */
import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { authApi } from "../../api/auth.ts";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { mediaUrl } from "../../utils/format.ts";

export function CompanySettingsPage() {
  const { user, refreshMe } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user?.role !== "ADMIN") {
    return <Navigate to="/employees" replace />;
  }

  const logoSrc = mediaUrl(user.company?.logoUrl ?? null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a logo image first");
      return;
    }
    setPending(true);
    setError(null);
    setOk(null);
    try {
      await authApi.updateCompanyLogo(file);
      await refreshMe();
      setOk("Logo updated — it will appear in the navbar and on payslip PDFs.");
      setFile(null);
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Company settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Upload a logo stored locally under <code>backend/uploads</code> (Neon stores only the URL path).
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {logoSrc ? (
          <img src={logoSrc} alt="Company logo" className="h-16 w-16 rounded object-contain" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded bg-[var(--color-bg)] text-xs text-[var(--color-muted)]">
            No logo
          </div>
        )}
        <div>
          <p className="font-medium">{user.company?.name}</p>
          <p className="text-sm text-[var(--color-muted)]">Code {user.company?.code}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--color-muted)]">New logo (PNG/JPG/WebP)</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-bg)] file:px-3 file:py-1.5"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        {ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        <button
          type="submit"
          disabled={pending || !file}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Save logo"}
        </button>
      </form>
    </section>
  );
}
