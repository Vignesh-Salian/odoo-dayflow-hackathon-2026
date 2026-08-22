import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "./AuthContext.tsx";
import { AuthShell, FormField } from "../../components/FormField.tsx";

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
      navigate(user.mustChangePassword ? "/change-password" : "/employees");
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
        <>
          New company?{" "}
          <Link className="text-[var(--color-accent)] hover:underline" to="/signup">
            Create company account
          </Link>
        </>
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
        className="w-full rounded-md bg-[var(--color-accent)] py-2.5 font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </AuthShell>
  );
}
