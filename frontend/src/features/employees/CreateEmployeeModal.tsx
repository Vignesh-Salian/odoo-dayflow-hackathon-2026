/**
 * OWNER: Nidhish (Person B) — create employee modal with credentials reveal.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Modal } from "../../components/Modal.tsx";
import { FormField, SelectField } from "../../components/FormField.tsx";
import { employeesApi } from "../../api/employees.ts";
import { getApiError } from "../../api/client.ts";

type Credentials = {
  loginId: string;
  tempPassword: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (employeeId: string) => void;
  onOpenProfile?: (employeeId: string) => void;
};

const today = new Date().toISOString().slice(0, 10);

export function CreateEmployeeModal({ open, onClose, onCreated, onOpenProfile }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfJoining: today,
    role: "EMPLOYEE",
    phone: "",
    jobPosition: "",
    workLocation: "",
  });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      dateOfJoining: today,
      role: "EMPLOYEE",
      phone: "",
      jobPosition: "",
      workLocation: "",
    });
    setFields({});
    setError(null);
    setCredentials(null);
    setCreatedEmployeeId(null);
    setCopied(false);
  }

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await employeesApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        dateOfJoining: form.dateOfJoining,
        role: form.role,
        phone: form.phone.trim() || undefined,
        jobPosition: form.jobPosition.trim() || undefined,
        workLocation: form.workLocation.trim() || undefined,
      });
      return res.data.data as {
        employee: { id: string };
        credentials: Credentials;
      };
    },
    onSuccess: (data) => {
      setCredentials(data.credentials);
      setCreatedEmployeeId(data.employee.id);
      onCreated(data.employee.id);
    },
    onError: (err) => {
      const e = getApiError(err);
      setError(e.message);
      setFields(e.fields ?? {});
    },
  });

  async function copyCreds() {
    if (!credentials) return;
    const text = `Login ID: ${credentials.loginId}\nTemp password: ${credentials.tempPassword}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <Modal
      open={open}
      title={credentials ? "Employee created — save credentials" : "Add employee"}
      wide
      onClose={() => {
        reset();
        onClose();
      }}
      footer={
        credentials ? (
          <>
            <button
              type="button"
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
              onClick={() => void copyCreds()}
            >
              {copied ? "Copied" : "Copy login details"}
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                const id = createdEmployeeId;
                reset();
                onClose();
                if (id) onOpenProfile?.(id);
              }}
            >
              Open profile & set salary
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm text-[var(--color-muted)]"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={createMut.isPending}
              onClick={() => {
                setError(null);
                setFields({});
                createMut.mutate();
              }}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {createMut.isPending ? "Creating…" : "Create employee"}
            </button>
          </>
        )
      }
    >
      {credentials ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">
            Share these once with the employee. They must change the password on first login.
          </p>
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-sm">
            <p>
              <span className="text-[var(--color-muted)]">Login ID:</span> {credentials.loginId}
            </p>
            <p>
              <span className="text-[var(--color-muted)]">Temp password:</span>{" "}
              {credentials.tempPassword}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="First name"
              name="firstName"
              value={form.firstName}
              error={fields.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              required
            />
            <FormField
              label="Last name"
              name="lastName"
              value={form.lastName}
              error={fields.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              required
            />
          </div>
          <FormField
            label="Work email"
            name="email"
            type="email"
            value={form.email}
            error={fields.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Date of joining"
              name="dateOfJoining"
              type="date"
              value={form.dateOfJoining}
              error={fields.dateOfJoining}
              onChange={(e) => set("dateOfJoining", e.target.value)}
              required
            />
            <SelectField
              label="Role"
              name="role"
              value={form.role}
              error={fields.role}
              onChange={(e) => set("role", e.target.value)}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </SelectField>
          </div>
          <FormField
            label="Job position"
            name="jobPosition"
            value={form.jobPosition}
            error={fields.jobPosition}
            onChange={(e) => set("jobPosition", e.target.value)}
            placeholder="Software Engineer"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Phone"
              name="phone"
              value={form.phone}
              error={fields.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91-98765-43210"
            />
            <FormField
              label="Work location"
              name="workLocation"
              value={form.workLocation}
              error={fields.workLocation}
              onChange={(e) => set("workLocation", e.target.value)}
              placeholder="Bengaluru"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
