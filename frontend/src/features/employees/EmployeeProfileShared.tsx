/**
 * OWNER: Nidhish (Person B) — shared profile header + editable tab panels.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Briefcase,
  Building2,
  Camera,
  FileText,
  Heart,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { employeesApi } from "../../api/employees.ts";
import { getApiError } from "../../api/client.ts";
import { FormField, TextAreaField } from "../../components/FormField.tsx";
import { mediaUrl } from "../../utils/format.ts";

export type ProfileEmp = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  jobPosition?: string | null;
  workLocation?: string | null;
  residingAddress?: string | null;
  personalEmail?: string | null;
  dateOfJoining?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  managerId?: string | null;
  department?: { name: string } | null;
  manager?: { id?: string; firstName: string; lastName: string } | null;
  user?: { loginId: string; email: string; role?: string };
  skills?: { id: string; name: string }[];
  certifications?: {
    id: string;
    name: string;
    issuedBy?: string | null;
    year?: number | null;
    fileUrl?: string | null;
  }[];
  documents?: { id: string; docType: string; fileUrl: string }[];
  bankDetails?: {
    accountHolderName?: string | null;
    accountNumber: string;
    bankName: string;
    branchName?: string | null;
    ifscCode: string;
    panNo: string;
    uanNo?: string;
    empCode?: string;
  } | null;
  resume?: {
    about?: string | null;
    loveAboutJob?: string | null;
    interestsHobbies?: string | null;
  } | null;
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--color-border)] py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[var(--color-text)]">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="df-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              {icon}
            </span>
          ) : null}
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ProfileHeader({
  emp,
  companyName,
  title,
  trailing,
  canEditAvatar = false,
  queryKey,
}: {
  emp: ProfileEmp;
  companyName?: string | null;
  title?: string;
  trailing?: ReactNode;
  canEditAvatar?: boolean;
  queryKey?: unknown[];
}) {
  const qc = useQueryClient();
  const avatar = mediaUrl(emp.avatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const uploadMut = useMutation({
    mutationFn: (file: File) => employeesApi.uploadAvatar(emp.id, file),
    onSuccess: async () => {
      setAvatarError(null);
      if (queryKey) await qc.invalidateQueries({ queryKey });
      await qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) => setAvatarError(getApiError(err).message),
  });

  return (
    <div className="df-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-5">
          <div className="relative shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="h-[5.5rem] w-[5.5rem] rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-2xl font-bold text-[var(--color-accent)]">
                {emp.firstName?.[0]}
                {emp.lastName?.[0]}
              </div>
            )}
            {canEditAvatar ? (
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm transition hover:bg-[var(--color-accent)] hover:text-white">
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={uploadMut.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMut.mutate(file);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            {title ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                {title}
              </p>
            ) : null}
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-bold leading-tight tracking-tight sm:text-3xl">
                {emp.firstName} {emp.lastName}
              </h1>
              {emp.jobPosition ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
                  <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {emp.jobPosition}
                </p>
              ) : null}
              {uploadMut.isPending ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">Uploading photo…</p>
              ) : null}
              {avatarError ? (
                <p className="mt-1 text-xs text-[var(--color-danger)]">{avatarError}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {emp.user?.loginId ? (
                <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                  ID {emp.user.loginId}
                </span>
              ) : null}
              {emp.department?.name ? (
                <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                  {emp.department.name}
                </span>
              ) : null}
              {emp.user?.role ? (
                <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                  {emp.user.role}
                </span>
              ) : null}
            </div>

            <div className="grid gap-x-10 gap-y-2 pt-1 text-sm sm:grid-cols-2">
              <p className="flex min-w-0 items-center gap-2 text-[var(--color-muted)]">
                <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate text-[var(--color-text)]">{emp.user?.email ?? "—"}</span>
              </p>
              <p className="flex items-center gap-2 text-[var(--color-muted)]">
                <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="text-[var(--color-text)]">{emp.phone?.trim() || "—"}</span>
              </p>
              <p className="flex min-w-0 items-center gap-2 text-[var(--color-muted)]">
                <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate text-[var(--color-text)]">{companyName ?? "—"}</span>
              </p>
              <p className="flex min-w-0 items-center gap-2 text-[var(--color-muted)]">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate text-[var(--color-text)]">
                  {emp.workLocation?.trim() || "—"}
                </span>
              </p>
              <p className="flex items-center gap-2 text-[var(--color-muted)] sm:col-span-2">
                <UserRound className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="text-[var(--color-text)]">
                  Manager:{" "}
                  {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : "—"}
                </span>
              </p>
            </div>
          </div>
        </div>
        {trailing}
      </div>
    </div>
  );
}

export function ResumeTab({
  emp,
  canEdit = false,
  queryKey,
}: {
  emp: ProfileEmp;
  canEdit?: boolean;
  queryKey: unknown[];
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState(emp.resume?.about ?? "");
  const [loveAboutJob, setLoveAboutJob] = useState(emp.resume?.loveAboutJob ?? "");
  const [interestsHobbies, setInterestsHobbies] = useState(emp.resume?.interestsHobbies ?? "");
  const [skillName, setSkillName] = useState("");
  const [certForm, setCertForm] = useState({
    name: "",
    issuedBy: "",
    year: "",
    file: null as File | null,
  });
  const [error, setError] = useState<string | null>(null);

  const saveResume = useMutation({
    mutationFn: () =>
      employeesApi.putResume(emp.id, {
        about: about.trim() || null,
        loveAboutJob: loveAboutJob.trim() || null,
        interestsHobbies: interestsHobbies.trim() || null,
      }),
    onSuccess: async () => {
      setEditing(false);
      setError(null);
      await qc.invalidateQueries({ queryKey });
    },
    onError: (err) => setError(getApiError(err).message),
  });

  const addSkill = useMutation({
    mutationFn: () => employeesApi.addSkill(emp.id, skillName.trim()),
    onSuccess: async () => {
      setSkillName("");
      await qc.invalidateQueries({ queryKey });
    },
    onError: (err) => setError(getApiError(err).message),
  });

  const addCert = useMutation({
    mutationFn: () =>
      employeesApi.addCertification(emp.id, {
        name: certForm.name.trim(),
        issuedBy: certForm.issuedBy.trim() || undefined,
        year: certForm.year ? Number(certForm.year) : undefined,
        file: certForm.file,
      }),
    onSuccess: async () => {
      setCertForm({ name: "", issuedBy: "", year: "", file: null });
      await qc.invalidateQueries({ queryKey });
    },
    onError: (err) => setError(getApiError(err).message),
  });

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionCard
            title="About"
            icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
            action={
              canEdit && !editing ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                  onClick={() => {
                    setAbout(emp.resume?.about ?? "");
                    setLoveAboutJob(emp.resume?.loveAboutJob ?? "");
                    setInterestsHobbies(emp.resume?.interestsHobbies ?? "");
                    setEditing(true);
                  }}
                >
                  Edit
                </button>
              ) : null
            }
          >
            {editing ? (
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  saveResume.mutate();
                }}
              >
                <TextAreaField
                  label="About"
                  name="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={3}
                />
                <TextAreaField
                  label="What I love about my job"
                  name="loveAboutJob"
                  value={loveAboutJob}
                  onChange={(e) => setLoveAboutJob(e.target.value)}
                  rows={3}
                />
                <TextAreaField
                  label="Interests & hobbies"
                  name="interestsHobbies"
                  value={interestsHobbies}
                  onChange={(e) => setInterestsHobbies(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="df-btn border border-[var(--color-border)]"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveResume.isPending}
                    className="df-btn df-btn-primary disabled:opacity-50"
                  >
                    {saveResume.isPending ? "Saving…" : "Save resume"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm leading-relaxed text-[var(--color-muted)]">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                    Bio
                  </p>
                  <p>{emp.resume?.about?.trim() || "No bio added yet."}</p>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                    <Heart className="h-3 w-3" /> Love about job
                  </p>
                  <p>{emp.resume?.loveAboutJob?.trim() || "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                    Interests
                  </p>
                  <p>{emp.resume?.interestsHobbies?.trim() || "—"}</p>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Skills" icon={<Award className="h-4 w-4" strokeWidth={1.75} />}>
            <div className="flex flex-wrap gap-2">
              {(emp.skills ?? []).length === 0 ? (
                <span className="text-sm text-[var(--color-muted)]">No skills listed</span>
              ) : (
                emp.skills!.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium"
                  >
                    {s.name}
                  </span>
                ))
              )}
            </div>
            {canEdit ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!skillName.trim()) return;
                  addSkill.mutate();
                }}
              >
                <input
                  className="df-input flex-1 py-2 text-sm"
                  placeholder="Add a skill…"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={addSkill.isPending || !skillName.trim()}
                  className="df-btn df-btn-primary disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Certifications"
            icon={<Award className="h-4 w-4" strokeWidth={1.75} />}
          >
            {(emp.certifications ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No certifications</p>
            ) : (
              <ul className="space-y-2">
                {emp.certifications!.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                          {[c.issuedBy, c.year].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      {c.fileUrl ? (
                        <a
                          href={mediaUrl(c.fileUrl) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          File
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {canEdit ? (
              <form
                className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!certForm.name.trim()) return;
                  addCert.mutate();
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Add certification
                </p>
                <FormField
                  label="Name"
                  name="certName"
                  value={certForm.name}
                  onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField
                    label="Issued by"
                    name="issuedBy"
                    value={certForm.issuedBy}
                    onChange={(e) => setCertForm((f) => ({ ...f, issuedBy: e.target.value }))}
                  />
                  <FormField
                    label="Year"
                    name="year"
                    type="number"
                    value={certForm.year}
                    onChange={(e) => setCertForm((f) => ({ ...f, year: e.target.value }))}
                  />
                </div>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-muted)]">
                    Certificate file
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-1.5"
                    onChange={(e) =>
                      setCertForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))
                    }
                  />
                </label>
                <button
                  type="submit"
                  disabled={addCert.isPending || !certForm.name.trim()}
                  className="df-btn df-btn-primary disabled:opacity-50"
                >
                  {addCert.isPending ? "Adding…" : "Add certification"}
                </button>
              </form>
            ) : null}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export function PrivateInfoTab({
  emp,
  canEdit = false,
  queryKey,
}: {
  emp: ProfileEmp;
  canEdit?: boolean;
  queryKey: unknown[];
}) {
  const qc = useQueryClient();
  const bank = emp.bankDetails;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    accountHolderName: bank?.accountHolderName ?? "",
    accountNumber: bank?.accountNumber ?? "",
    bankName: bank?.bankName ?? "",
    branchName: bank?.branchName ?? "",
    ifscCode: bank?.ifscCode ?? "",
    panNo: bank?.panNo ?? "",
    uanNo: bank?.uanNo ?? "",
    empCode: bank?.empCode ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const saveBank = useMutation({
    mutationFn: () =>
      employeesApi.putBank(emp.id, {
        accountHolderName: form.accountHolderName.trim() || null,
        accountNumber: form.accountNumber.trim(),
        bankName: form.bankName.trim(),
        branchName: form.branchName.trim() || null,
        ifscCode: form.ifscCode.trim(),
        panNo: form.panNo.trim(),
        uanNo: form.uanNo.trim(),
        empCode: form.empCode.trim(),
      }),
    onSuccess: async () => {
      setEditing(false);
      setError(null);
      await qc.invalidateQueries({ queryKey });
    },
    onError: (err) => setError(getApiError(err).message),
  });

  const maskedAcct = bank?.accountNumber
    ? `****${bank.accountNumber.slice(-4)}`
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        title="Personal details"
        icon={<UserRound className="h-4 w-4" strokeWidth={1.75} />}
      >
        <dl>
          <InfoRow label="Date of Birth" value={fmtDate(emp.dateOfBirth)} />
          <InfoRow label="Residing Address" value={emp.residingAddress} />
          <InfoRow label="Nationality" value={emp.nationality} />
          <InfoRow label="Personal Email" value={emp.personalEmail} />
          <InfoRow label="Gender" value={emp.gender} />
          <InfoRow label="Marital Status" value={emp.maritalStatus} />
          <InfoRow label="Date of Joining" value={fmtDate(emp.dateOfJoining)} />
        </dl>
      </SectionCard>

      <SectionCard
        title="Bank details"
        icon={<Landmark className="h-4 w-4" strokeWidth={1.75} />}
        action={
          canEdit && !editing ? (
            <button
              type="button"
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
              onClick={() => {
                setForm({
                  accountHolderName: bank?.accountHolderName ?? "",
                  accountNumber: bank?.accountNumber ?? "",
                  bankName: bank?.bankName ?? "",
                  branchName: bank?.branchName ?? "",
                  ifscCode: bank?.ifscCode ?? "",
                  panNo: bank?.panNo ?? "",
                  uanNo: bank?.uanNo ?? "",
                  empCode: bank?.empCode ?? "",
                });
                setEditing(true);
              }}
            >
              {bank ? "Edit" : "Add"}
            </button>
          ) : null
        }
      >
        {error ? <p className="mb-2 text-sm text-[var(--color-danger)]">{error}</p> : null}
        {editing ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveBank.mutate();
            }}
          >
            <FormField
              label="Account holder name"
              name="accountHolderName"
              value={form.accountHolderName}
              onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
            />
            <FormField
              label="Account number"
              name="accountNumber"
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Bank name"
                name="bankName"
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                required
              />
              <FormField
                label="Branch"
                name="branchName"
                value={form.branchName}
                onChange={(e) => setForm((f) => ({ ...f, branchName: e.target.value }))}
              />
            </div>
            <FormField
              label="IFSC code"
              name="ifscCode"
              value={form.ifscCode}
              onChange={(e) => setForm((f) => ({ ...f, ifscCode: e.target.value }))}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="PAN"
                name="panNo"
                value={form.panNo}
                onChange={(e) => setForm((f) => ({ ...f, panNo: e.target.value }))}
                required
              />
              <FormField
                label="UAN"
                name="uanNo"
                value={form.uanNo}
                onChange={(e) => setForm((f) => ({ ...f, uanNo: e.target.value }))}
                required
              />
            </div>
            <FormField
              label="Employee code"
              name="empCode"
              value={form.empCode}
              onChange={(e) => setForm((f) => ({ ...f, empCode: e.target.value }))}
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="df-btn border border-[var(--color-border)]"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveBank.isPending}
                className="df-btn df-btn-primary disabled:opacity-50"
              >
                {saveBank.isPending ? "Saving…" : "Save bank details"}
              </button>
            </div>
          </form>
        ) : bank ? (
          <dl>
            <InfoRow label="Account holder" value={bank.accountHolderName} />
            <InfoRow label="Account number" value={maskedAcct} />
            <InfoRow label="Bank name" value={bank.bankName} />
            <InfoRow label="Branch" value={bank.branchName} />
            <InfoRow label="IFSC" value={bank.ifscCode} />
            <InfoRow label="PAN" value={bank.panNo} />
            <InfoRow label="UAN" value={bank.uanNo} />
            <InfoRow label="Emp code" value={bank.empCode} />
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No bank details on file.</p>
        )}
      </SectionCard>
    </div>
  );
}
