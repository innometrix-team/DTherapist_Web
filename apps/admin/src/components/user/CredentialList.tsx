import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, Loader2, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ICertificate } from "../../api/GetUsers.api";
import { ReviewCertificationApi, ReviewCVApi } from "../../api/Profile.api";

export type UserDocumentStatus = "pending" | "approved" | "rejected";

export type CredentialsData = ICertificate;

export type CredentialListProps = {
  /** the data returned from GetUserCertificationsApi(userId) */
  credentialsData?: CredentialsData | null;
  isLoading?: boolean;
  role: "counselor" | "client";
  /** Needed by the review endpoint */
  userId?: string;
};

/** A tiny pill to show status */
function StatusPill({ status }: { status?: UserDocumentStatus }) {
  if (!status) return null;
  const map: Record<UserDocumentStatus, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  const label = status[0].toUpperCase() + status.slice(1);
  return (
    <span className={`text-xs px-2 py-1 rounded-full ring-1 ${map[status]}`}>
      {label}
    </span>
  );
}

function RejectDialog({
  open,
  onClose,
  onConfirm,
  defaultNote,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  defaultNote?: string;
}) {
  const [note, setNote] = useState(defaultNote || "");

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-semibold">Reject document</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Add a note explaining why you are rejecting this document. The user
          will be notified.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Certification is blurry. Please upload a clearer image."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note.trim())}
            className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-rose-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/** Card used for CV and Certification */
function DocRow({
  title,
  doc,
  status,
  note,
  onView,
  onApprove,
  onReject,
  busy,
}: {
  title: string;
  doc?: string;
  note?: string;
  status: UserDocumentStatus;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-md p-3">
      <div className="flex items-start sm:items-center gap-3">
        <div
          onClick={doc ? onView : undefined}
          className={`flex items-start sm:items-center gap-2 cursor-pointer select-none ${
            !doc ? "cursor-not-allowed opacity-60" : ""
          }`}
          title={title}
        >
          <FileText className="w-6 h-6 text-gray-500" />
          <div className="leading-tight">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[280px]">
              {doc || "No file uploaded"}
            </div>
          </div>
        </div>
        {status && <StatusPill status={status} />}
        {status === "rejected" && note && (
          <span className="text-xs text-rose-600" title={note}>
            • {note}
          </span>
        )}
      </div>

      <div className="block sm:hidden h-px bg-gray-200" />

      <div className="flex items-center gap-2 sm:justify-end w-full sm:w-auto">
        <button
          onClick={onReject}
          disabled={!doc || busy}
          className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}{" "}
          Reject
        </button>
        <button
          onClick={onApprove}
          disabled={!doc || busy}
          className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm border rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}{" "}
          Approve
        </button>
      </div>
    </div>
  );
}
export default function CredentialList({
  credentialsData,
  isLoading,
  role,
  userId,
}: CredentialListProps) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState<null | { kind: "cv" | "cert" }>(
    null
  );

  const hasCounselorRole = role === "counselor";

  // Separate mutations for Certification and CV
  const { mutate: reviewCertification, isPending: approvingCert } = useMutation(
    {
      mutationFn: async (vars: {
        status: "approved" | "rejected";
        note?: string;
      }) => {
        if (!userId) throw new Error("Missing userId");
        return ReviewCertificationApi({
          userId,
          status: vars.status,
          note: vars.note,
        });
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["user-credentials", userId] });
      },
    }
  );

  const { mutate: reviewCV, isPending: approvingCV } = useMutation({
    mutationFn: async (vars: {
      status: "approved" | "rejected";
      note?: string;
    }) => {
      if (!userId) throw new Error("Missing userId");
      return ReviewCVApi({ userId, status: vars.status, note: vars.note });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-credentials", userId] });
    },
  });

  const approving = approvingCert || approvingCV;

  const approveDoc = (kind: "cv" | "cert") =>
    kind === "cv"
      ? reviewCV({ status: "approved" })
      : reviewCertification({ status: "approved" });

  const rejectDoc = (kind: "cv" | "cert", note?: string) =>
    kind === "cv"
      ? reviewCV({ status: "rejected", note })
      : reviewCertification({ status: "rejected", note });

  const items = useMemo(
    () => [
      {
        key: "cv" as const,
        title: "CV/Resume",
        doc: credentialsData?.cvUrl,
        status: credentialsData?.cvStatus ?? "pending",
        note: credentialsData?.note,
      },
      // Only show certification row for counselors/therapists
      ...(hasCounselorRole
        ? [
            {
              key: "cert" as const,
              title: "Certification (PDF or JPG)",
              doc: credentialsData?.certificationUrl,
              status: credentialsData?.certificationStatus ?? "pending",
              note: credentialsData?.certificationNote,
            },
          ]
        : []),
    ],
    [credentialsData, hasCounselorRole]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading documents…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((row) => (
        <DocRow
          key={row.key}
          title={row.title}
          doc={row.doc}
          status={row.status as UserDocumentStatus}
          busy={approving}
          onView={() => {
            if (!row.doc) return;
            // Open in a new tab to view PDF/image inline (browser viewer will handle PDFs without forcing download)
            window.open(row.doc, "_blank", "noopener,noreferrer");
          }}
          onApprove={() => approveDoc(row.key)}
          onReject={() => setRejectOpen({ kind: row.key })}
        />
      ))}

      <RejectDialog
        open={!!rejectOpen}
        onClose={() => setRejectOpen(null)}
        onConfirm={(note) => {
          if (!rejectOpen) return;
          rejectDoc(rejectOpen.kind, note);
          setRejectOpen(null);
        }}
      />

      <p className="text-xs text-gray-500 mt-2">
        Tip: click the file name to preview it in your browser. PDFs open in a
        built‑in viewer.
      </p>
    </div>
  );
}
