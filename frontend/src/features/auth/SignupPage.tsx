import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "./AuthContext.tsx";
import { AuthShell, FormField } from "../../components/FormField.tsx";
import { homePathFor } from "../../routes/guards.tsx";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    country: "",
    adminFirstName: "",
    adminLastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
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
    if (form.password !== form.confirmPassword) {
      setFields({ confirmPassword: "Passwords do not match" });
      return;
    }
    setPending(true);
    try {
      const user = await signup({
        companyName: form.companyName,
        country: form.country || undefined,
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        email: form.email,
        password: form.password,
        phone: form.phone.trim() || undefined,
        logo,
      });
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
      title="Create your company"
      subtitle="Sets up the company and first admin. Logo is optional."
      onSubmit={onSubmit}
      wide
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-[var(--color-accent)] hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
          placeholder="India"
        />
      </div>
      <label className="block space-y-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-[var(--color-muted)]">Company logo (optional)</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="w-full cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-1.5"
          onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
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
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={fields.email}
          required
        />
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={fields.phone}
          placeholder="+91-98765-43210"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={fields.password}
          required
        />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          error={fields.confirmPassword}
          required
        />
      </div>
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="df-btn df-btn-primary w-full py-2.5 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Sign Up"}
      </button>
    </AuthShell>
  );
}
