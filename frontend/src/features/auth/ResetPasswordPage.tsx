import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth.ts";
import { getApiError } from "../../api/client.ts";
import { AuthShell, FormField } from "../../components/FormField.tsx";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing reset token.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await authApi.resetPassword(token, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your Dayflow account."
      onSubmit={onSubmit}
      footer={
        <p className="text-center">
          <Link className="font-bold text-[#2563eb] hover:underline dark:text-[#60a5fa]" to="/login">
            Back to sign in
          </Link>
        </p>
      }
    >
      {!token ? (
        <p className="text-sm text-[var(--color-danger)]">This reset link is invalid or incomplete.</p>
      ) : (
        <>
          <FormField
            label="New password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <FormField
            label="Confirm password"
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="df-btn df-btn-primary w-full py-2.5 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Update password"}
          </button>
        </>
      )}
    </AuthShell>
  );
}
