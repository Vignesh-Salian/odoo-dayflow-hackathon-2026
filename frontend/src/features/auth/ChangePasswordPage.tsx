import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiError } from "../../api/client.ts";
import { authApi } from "../../api/auth.ts";
import { useAuth } from "./AuthContext.tsx";
import { AuthShell, FormField } from "../../components/FormField.tsx";
import { homePathFor } from "../../routes/guards.tsx";

export function ChangePasswordPage() {
  const { setSession, user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    setPending(true);
    try {
      const { data } = await authApi.changePassword(currentPassword, newPassword);
      setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
      navigate(homePathFor(data.data.user));
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
      title="Change password"
      subtitle={
        user?.mustChangePassword
          ? "You must set a new password before continuing."
          : "Update your account password."
      }
      onSubmit={onSubmit}
    >
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
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[var(--color-accent)] py-2.5 font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </AuthShell>
  );
}
