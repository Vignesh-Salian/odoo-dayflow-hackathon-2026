import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth.ts";
import { getApiError } from "../../api/client.ts";
import { AuthShell, FormField } from "../../components/FormField.tsx";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await authApi.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email a reset link if that address has an account."
      onSubmit={onSubmit}
      footer={
        <p className="text-center">
          <Link className="font-bold text-[#2563eb] hover:underline dark:text-[#60a5fa]" to="/login">
            Back to sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <p className="text-sm text-[var(--color-muted)]">
          If an account exists for that email, a reset link is on its way. Check your inbox (and
          spam).
        </p>
      ) : (
        <>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="df-btn df-btn-primary w-full py-2.5 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </>
      )}
    </AuthShell>
  );
}
