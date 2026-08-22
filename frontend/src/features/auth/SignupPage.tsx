import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "./AuthContext.tsx";
import { AuthShell, FormField } from "../../components/FormField.tsx";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    country: "",
    adminFirstName: "",
    adminLastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    setPending(true);
    try {
      await signup({
        companyName: form.companyName,
        country: form.country || undefined,
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        email: form.email,
        password: form.password,
      });
      navigate("/employees");
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
      title="Create your company"
      subtitle="Public sign-up creates the company and first admin only."
      onSubmit={onSubmit}
      footer={
        <>
          Already have an account?{" "}
          <Link className="text-[var(--color-accent)] hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <FormField
        label="Company name"
        name="companyName"
        value={form.companyName}
        onChange={(e) => set("companyName", e.target.value)}
        error={fields.companyName}
        required
      />
      <FormField
        label="Country"
        name="country"
        value={form.country}
        onChange={(e) => set("country", e.target.value)}
        error={fields.country}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="First name"
          name="adminFirstName"
          value={form.adminFirstName}
          onChange={(e) => set("adminFirstName", e.target.value)}
          error={fields.adminFirstName}
          required
        />
        <FormField
          label="Last name"
          name="adminLastName"
          value={form.adminLastName}
          onChange={(e) => set("adminLastName", e.target.value)}
          error={fields.adminLastName}
          required
        />
      </div>
      <FormField
        label="Admin email"
        name="email"
        type="email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        error={fields.email}
        required
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        error={fields.password}
        required
      />
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[var(--color-accent)] py-2.5 font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create company"}
      </button>
    </AuthShell>
  );
}
