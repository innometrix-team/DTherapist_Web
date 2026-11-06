import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, Loader2, ShieldAlert, X } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { ICertificate } from "../../api/GetUsers.api";
import { ReviewCertificationApi, ReviewCVApi, ReviewProfessionalBodyCertificateApi } from "../../api/Profile.api";

// Lazy-load so pdf.js is only downloaded when a PDF is actually previewed.
const PdfPreview = lazy(() => import("./PdfPreview"));

export type UserDocumentStatus = "pending" | "approved" | "rejected";

export type CredentialsData = ICertificate;

export type CredentialListProps = {
  credentialsData?: CredentialsData | null;
  isLoading?: boolean;
  role: "counselor" | "client";
  userId?: string;
};

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
  userId,
}: CredentialListProps) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState<null | {
    kind: "cv" | "cert" | "profCert";
  }>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        void qc.invalidateQueries({ queryKey: ["user-credentials", userId] });
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
      void qc.invalidateQueries({ queryKey: ["user-credentials", userId] });
    },
  });

  const { mutate: reviewProfCert, isPending: approvingProfCert } = useMutation({
    mutationFn: async (vars: {
      status: "approved" | "rejected";
      note?: string;
    }) => {
      if (!userId) throw new Error("Missing userId");
      return ReviewProfessionalBodyCertificateApi({
        userId,
        status: vars.status,
        note: vars.note,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-credentials", userId] });
    },
  });

  const approving = approvingCert || approvingCV || approvingProfCert;

  const approveDoc = (kind: "cv" | "cert" | "profCert") => {
    if (kind === "cv") {
      reviewCV({ status: "approved" });
    } else if (kind === "cert") {
      reviewCertification({ status: "approved" });
    } else {
      reviewProfCert({ status: "approved" });
    }
  };

  const rejectDoc = (kind: "cv" | "cert" | "profCert", note?: string) => {
    if (kind === "cv") {
      reviewCV({ status: "rejected", note });
    } else if (kind === "cert") {
      reviewCertification({ status: "rejected", note });
    } else {
      reviewProfCert({ status: "rejected", note });
    }
  };

  const items = useMemo(
    () => [
      {
        key: "cv" as const,
        title: "CV / Resume",
        doc: credentialsData?.cvUrl,
        status: credentialsData?.cvStatus ?? "pending",
        note: credentialsData?.cvNote,
      },

      {
        key: "cert" as const,
        title: "Certification (PDF or JPG)",
        doc: credentialsData?.certificationUrl,
        status: credentialsData?.certificationStatus ?? "pending",
        note: credentialsData?.certificationNote,
      },

      {
        key: "profCert" as const,
        title: "Professional Body Certificate",
        doc: credentialsData?.professionalBodyCertificateUrl,
        status:
          credentialsData?.professionalBodyCertificateStatus ?? "pending",
        note: credentialsData?.professionalBodyCertificateNote,
      },
    ],
    [credentialsData]
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
      {credentialsData?.compliance && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Compliance Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full ring-1 font-medium capitalize ${
                credentialsData.compliance.status === "approved" ||
                credentialsData.compliance.status === "compliant"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : credentialsData.compliance.status === "rejected"
                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {credentialsData.compliance.status || "Pending"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <span>
              Bookings:{" "}
              <strong
                className={
                  credentialsData.compliance.canAcceptNewBookings
                    ? "text-emerald-600"
                    : "text-amber-600"
                }
              >
                {credentialsData.compliance.canAcceptNewBookings
                  ? "Active"
                  : "Disabled"}
              </strong>
            </span>
            {credentialsData.compliance.provisionalDeadline && (
              <span>
                Deadline:{" "}
                <strong>
                  {new Date(
                    credentialsData.compliance.provisionalDeadline
                  ).toLocaleDateString()}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}
      {items.map((row) => (
        <DocRow
          key={row.key}
          title={row.title}
          doc={row.doc}
          status={row.status as UserDocumentStatus}
          busy={approving}
          onView={() => {
            if (!row.doc) return;
            setPreviewUrl(row.doc);
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

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="absolute inset-4 sm:inset-10 bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-sm sm:text-base font-semibold truncate">
                Document preview
              </h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {/\.(png|jpe?g|gif|webp|svg)$/i.test(previewUrl) ? (
                <div className="w-full h-full overflow-auto flex items-center justify-center bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Document"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-full">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-neutral">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading viewer…
                      </div>
                    }
                  >
                    <PdfPreview fileUrl={previewUrl} />
                  </Suspense>
                </div>
              )}
            </div>
            <div className="border-t p-2 sm:p-3 text-right">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Tip: click the file name to preview it in-app. If a file can’t be
        displayed (host blocks embedding or CORS), use “Open in new tab”.
      </p>
    </div>
  );
}
