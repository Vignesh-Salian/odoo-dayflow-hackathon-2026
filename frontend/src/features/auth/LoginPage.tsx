import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "./AuthContext.tsx";
import { AuthShell, FormField } from "../../components/FormField.tsx";
import { homePathFor } from "../../routes/guards.tsx";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    setPending(true);
    try {
      const user = await login(identifier, password);
      navigate(homePathFor(user));
    } catch (err) {
      const apiErr = getApiError(err);
      setError(apiErr.message);
      if (apiErr.fields) setFields(apiErr.fields);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your login ID or email to continue."
      onSubmit={onSubmit}
      footer={
        <p className="text-center">
          New company?{" "}
          <Link
            className="ml-1 inline-flex cursor-pointer items-center rounded-lg bg-[var(--color-accent)] px-2.5 py-1 font-semibold !text-white shadow-sm transition hover:bg-[var(--color-accent-hover)] hover:!text-white"
            to="/signup"
          >
            Create a company
          </Link>
        </p>
      }
    >
      <FormField
        label="Login ID or email"
        name="identifier"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoComplete="username"
        error={fields.identifier}
        required
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        error={fields.password}
        required
      />
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="df-btn df-btn-primary w-full py-2.5 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </AuthShell>
  );
}
