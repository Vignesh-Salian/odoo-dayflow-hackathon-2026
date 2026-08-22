import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth.ts";
import { getApiError } from "../../api/client.ts";
import { AuthShell } from "../../components/FormField.tsx";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await authApi.verifyEmail(token);
        if (!cancelled) {
          setStatus("ok");
          setMessage("Email verified. You can sign in now.");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(getApiError(err).message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell
      title="Email verification"
      subtitle="Confirming the link from your inbox."
      onSubmit={(e) => e.preventDefault()}
      footer={
        <p className="text-center">
          <Link className="font-bold text-[#2563eb] hover:underline dark:text-[#60a5fa]" to="/login">
            Back to sign in
          </Link>
        </p>
      }
    >
      <p
        className={`text-sm ${
          status === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-muted)]"
        }`}
      >
        {message}
      </p>
      {status === "ok" ? (
        <Link to="/login" className="df-btn df-btn-primary inline-flex justify-center py-2.5">
          Sign in
        </Link>
      ) : null}
    </AuthShell>
  );
}
