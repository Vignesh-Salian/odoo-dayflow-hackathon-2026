/**
 * OWNER: Nidhish (Person B) — shared profile header + tab panels (PDF wireframe).
 */
import type { ReactNode } from "react";
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
  department?: { name: string } | null;
  manager?: { firstName: string; lastName: string } | null;
  user?: { loginId: string; email: string; role?: string };
  skills?: { id: string; name: string }[];
  certifications?: { id: string; name: string; issuedBy?: string | null; year?: number | null }[];
  documents?: { id: string; docType: string; fileUrl: string }[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
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

function DlRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd>{value?.trim() ? value : "—"}</dd>
    </>
  );
}

export function ProfileHeader({
  emp,
  companyName,
  title,
  trailing,
}: {
  emp: ProfileEmp;
  companyName?: string | null;
  title?: string;
  trailing?: ReactNode;
}) {
  const avatar = mediaUrl(emp.avatarUrl);
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-wrap items-start gap-6">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-border)]"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface)] text-2xl font-semibold text-[var(--color-muted)]">
            {emp.firstName?.[0]}
            {emp.lastName?.[0]}
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            {title ? (
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">{title}</h1>
            ) : null}
            <p className={`${title ? "mt-1" : ""} font-[family-name:var(--font-display)] text-2xl font-bold`}>
              {emp.firstName} {emp.lastName}
            </p>
            {emp.jobPosition ? (
              <p className="text-sm text-[var(--color-muted)]">{emp.jobPosition}</p>
            ) : null}
            <dl className="mt-2 grid grid-cols-[6.5rem_1fr] gap-y-1 text-sm">
              <DlRow label="Login ID" value={emp.user?.loginId} />
              <DlRow label="Email" value={emp.user?.email} />
              <DlRow label="Mobile" value={emp.phone} />
            </dl>
          </div>
          <dl className="grid grid-cols-[6.5rem_1fr] gap-y-1 text-sm sm:pt-8">
            <DlRow label="Company" value={companyName} />
            <DlRow label="Department" value={emp.department?.name} />
            <DlRow
              label="Manager"
              value={
                emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null
              }
            />
            <DlRow label="Location" value={emp.workLocation} />
          </dl>
        </div>
      </div>
      {trailing}
    </div>
  );
}

export function ResumeTab({ emp }: { emp: ProfileEmp }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="mb-1 font-semibold text-[var(--color-tab)]">About</h3>
          <p className="text-[var(--color-muted)]">{emp.resume?.about?.trim() || "—"}</p>
        </div>
        <div>
          <h3 className="mb-1 font-semibold text-[var(--color-tab)]">What I love about my job</h3>
          <p className="text-[var(--color-muted)]">{emp.resume?.loveAboutJob?.trim() || "—"}</p>
        </div>
        <div>
          <h3 className="mb-1 font-semibold text-[var(--color-tab)]">My interests and hobbies</h3>
          <p className="text-[var(--color-muted)]">{emp.resume?.interestsHobbies?.trim() || "—"}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold text-[var(--color-tab)]">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {(emp.skills ?? []).length === 0 ? (
              <span className="text-sm text-[var(--color-muted)]">No skills listed</span>
            ) : (
              emp.skills!.map((s) => (
                <span
                  key={s.id}
                  className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs"
                >
                  {s.name}
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-[var(--color-tab)]">Certification</h3>
          {(emp.certifications ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No certifications</p>
          ) : (
            <ul className="space-y-1 text-sm text-[var(--color-muted)]">
              {emp.certifications!.map((c) => (
                <li key={c.id}>
                  {c.name}
                  {c.issuedBy ? ` — ${c.issuedBy}` : ""}
                  {c.year ? ` (${c.year})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        {(emp.documents ?? []).length > 0 ? (
          <div>
            <h3 className="mb-2 font-semibold text-[var(--color-tab)]">Documents</h3>
            <ul className="space-y-1 text-sm">
              {emp.documents!.map((d) => (
                <li key={d.id}>
                  <a
                    className="text-[var(--color-accent)] hover:underline"
                    href={mediaUrl(d.fileUrl) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {d.docType}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PrivateInfoTab({ emp }: { emp: ProfileEmp }) {
  const bank = emp.bankDetails;
  const acct = bank?.accountNumber
    ? `****${bank.accountNumber.slice(-4)}`
    : null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
        <DlRow label="Date of Birth" value={fmtDate(emp.dateOfBirth)} />
        <DlRow label="Residing Address" value={emp.residingAddress} />
        <DlRow label="Nationality" value={emp.nationality} />
        <DlRow label="Personal Email" value={emp.personalEmail} />
        <DlRow label="Gender" value={emp.gender} />
        <DlRow label="Marital Status" value={emp.maritalStatus} />
        <DlRow label="Date of Joining" value={fmtDate(emp.dateOfJoining)} />
      </dl>
      <div>
        <h3 className="mb-2 font-semibold text-[var(--color-tab)]">Bank Details</h3>
        {bank ? (
          <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
            <DlRow label="Account Number" value={acct} />
            <DlRow label="Bank Name" value={bank.bankName} />
            <DlRow label="IFSC Code" value={bank.ifscCode} />
            <DlRow label="PAN No" value={bank.panNo} />
            <DlRow label="UAN NO" value={bank.uanNo} />
            <DlRow label="Emp Code" value={bank.empCode} />
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No bank details on file.</p>
        )}
      </div>
    </div>
  );
}
