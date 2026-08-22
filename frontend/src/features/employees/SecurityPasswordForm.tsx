/**
 * OWNER: Nidhish (Person B) — Security tab (change password on My Profile).
 */
import { type FormEvent, useState } from "react";
import { FormField } from "../../components/FormField.tsx";
import { authApi } from "../../api/auth.ts";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "../auth/AuthContext.tsx";

export function SecurityPasswordForm() {
  const { setSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    setOk(false);
    if (newPassword !== confirmPassword) {
      setFields({ confirmPassword: "Passwords do not match" });
      return;
    }
    setPending(true);
    try {
      const { data } = await authApi.changePassword(currentPassword, newPassword);
      setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOk(true);
    } catch (err) {
      const apiErr = getApiError(err);
      setError(apiErr.message);
      if (apiErr.fields) setFields(apiErr.fields);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <p className="text-sm text-[var(--color-muted)]">
        Update your account password. Use a strong password (8+ chars, upper, lower, digit).
      </p>
      <FormField
        label="Current password"
        name="currentPassword"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={fields.currentPassword}
        required
      />
      <FormField
        label="New password"
        name="newPassword"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={fields.newPassword}
        required
      />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fields.confirmPassword}
        required
      />
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      {ok ? <p className="text-sm text-[var(--color-success)]">Password updated.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
