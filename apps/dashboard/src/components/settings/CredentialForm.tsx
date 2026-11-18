import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  RefreshCw,
  X,
  FileCheck2,
} from "lucide-react";
import {
  getCredentialsApi,
  removeProfessionalBodyCertificateApi,
  saveCredentialsApi,
  Role,
} from "../../api/Credential.api";
import { QUERY_KEYS } from "../../configs/queryKeys.config";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { PdfIcon } from "../../assets/icons";

// Validation schema for credentials
const credentialSchema = z.object({
  resume: z
    .custom<File | null | undefined>((val) => val == null || val instanceof File, {
      message: "Resume must be a valid file",
    })
    .refine(
      (file) => !file || file.type === "application/pdf",
      "Resume must be a PDF file"
    )
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "Resume file size must be less than 5MB"
    ),
  certification: z
    .custom<File | null | undefined>((val) => val == null || val instanceof File, {
      message: "Certification must be a valid file",
    })
    .refine(
      (file) => !file || file.type === "application/pdf",
      "Certification must be a PDF file"
    )
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "Certification file size must be less than 5MB"
    ),
  professionalBodyCertificate: z
    .custom<File | null | undefined>((val) => val == null || val instanceof File, {
      message: "Certificate must be a valid file",
    })
    .refine(
      (file) => !file || file.type === "application/pdf",
      "Professional body certificate must be a PDF file"
    )
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "Certificate file size must be less than 5MB"
    ),
});

type CredentialFormData = z.infer<typeof credentialSchema>;

const isTherapistRole = (role: Role | null): role is "therapist" | "counselor" => {
  return role === "therapist" || role === "counselor";
};

// Reusable status badge component
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;
  const normalized = status.toLowerCase();

  if (normalized === "approved" || normalized === "verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Verified
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        Action Required
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3.5 h-3.5 text-amber-600" />
      Pending Review
    </span>
  );
};

// Format date helper
const formatDisplayDate = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
};

// Format file size helper
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Success Modal
const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-darkerb/40 backdrop-blur-xs flex items-center justify-center z-100 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-darkerb">
                Credentials Submitted
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral hover:text-darkerb p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 mb-6 text-sm text-gray-600 leading-relaxed">
            <p>
              Your professional credentials have been received. Our compliance
              team typically completes verification within{" "}
              <strong className="text-darkerb">24–48 business hours</strong>.
            </p>
            <p>
              Once approved, your updated credentials will be reflected on your
              public profile, allowing clients to review your verified qualifications.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CredentialForm: React.FC = () => {
  const queryClient = useQueryClient();
  const auth = useAuthStore((state) => state);
  const isTherapist = isTherapistRole(auth?.role);

  // Staged files locally before uploading to /api/profile/save-credentials
  const [stagedFiles, setStagedFiles] = useState<{
    resume: File | null;
    certification: File | null;
    professionalBodyCertificate: File | null;
  }>({
    resume: null,
    certification: null,
    professionalBodyCertificate: null,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const certificationInputRef = useRef<HTMLInputElement>(null);
  const bodyCertInputRef = useRef<HTMLInputElement>(null);

  // Query server credentials preview
  const {
    data: credentialsResult,
    isLoading: isFetchingCredentials,
    isRefetching: isRefetchingCredentials,
    refetch: refetchCredentials,
  } = useQuery({
    queryKey: QUERY_KEYS.profile.credentials,
    queryFn: () => getCredentialsApi(),
    enabled: isTherapist,
  });

  const serverData = credentialsResult?.data;

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      resume: null,
      certification: null,
      professionalBodyCertificate: null,
    },
  });

  // Save all 3 credentials mutation (POST /api/profile/save-credentials multipart/form-data)
  const { mutateAsync: handleSaveCredentials, isPending: isSaving } = useMutation({
    mutationFn: (payload: {
      cv?: File | null;
      certification?: File | null;
      professionalBodyCertificate?: File | null;
    }) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return saveCredentialsApi(payload, { signal: controller.signal });
    },
    onSuccess: (result) => {
      if (!result) return;
      reset();
      setStagedFiles({
        resume: null,
        certification: null,
        professionalBodyCertificate: null,
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.credentials });
      setShowSuccessModal(true);
      toast.success(result.message || "Credentials uploaded successfully!", { id: "credentials-save" });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to save credentials.";
      toast.error(message, { id: "credentials-save" });
    },
  });

  // Remove Professional Body Certificate mutation
  const { mutateAsync: mutateRemoveBodyCert, isPending: isRemovingBodyCert } = useMutation({
    mutationFn: () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return removeProfessionalBodyCertificateApi({ signal: controller.signal });
    },
    onSuccess: () => {
      setStagedFiles((prev) => ({
        ...prev,
        professionalBodyCertificate: null,
      }));
      setValue("professionalBodyCertificate", null);
      if (bodyCertInputRef.current) bodyCertInputRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.credentials });
      toast.success("Professional body certificate removed successfully.", { id: "body-cert-remove" });
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : "Failed to remove certificate.";
      toast.error(msg, { id: "body-cert-remove" });
    },
  });

  // Handle local file selection
  const handleFileSelect = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      type: "resume" | "certification" | "professionalBodyCertificate"
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file.", { id: `${type}-type-err` });
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB.", { id: `${type}-size-err` });
        e.target.value = "";
        return;
      }

      setValue(type, file, { shouldValidate: true });
      setStagedFiles((prev) => ({ ...prev, [type]: file }));
      e.target.value = "";
    },
    [setValue]
  );

  // Clear staged file selection
  const handleClearStaged = useCallback(
    (type: "resume" | "certification" | "professionalBodyCertificate") => {
      setStagedFiles((prev) => ({ ...prev, [type]: null }));
      setValue(type, null);
      if (type === "resume" && resumeInputRef.current) resumeInputRef.current.value = "";
      if (type === "certification" && certificationInputRef.current) certificationInputRef.current.value = "";
      if (type === "professionalBodyCertificate" && bodyCertInputRef.current) bodyCertInputRef.current.value = "";
    },
    [setValue]
  );

  // Submit all 3 documents
  const onSubmit: SubmitHandler<CredentialFormData> = useCallback(async () => {
    if (isSubmittingRef.current || isSaving) return;

    const hasResume = !!stagedFiles.resume || !!serverData?.cvUrl;
    const hasCert = !!stagedFiles.certification || !!serverData?.certificationUrl;
    const hasBodyCert = !!stagedFiles.professionalBodyCertificate || !!serverData?.professionalBodyCertificateUrl;

    if (!hasResume || !hasCert || !hasBodyCert) {
      toast.error("Please provide all 3 documents: CV, Certification, and Professional Body Certificate.", {
        id: "credentials-save",
      });
      return;
    }

    const hasNewFiles = !!stagedFiles.resume || !!stagedFiles.certification || !!stagedFiles.professionalBodyCertificate;
    if (!hasNewFiles) {
      toast.error("Please select at least one document to upload.", { id: "credentials-save" });
      return;
    }

    try {
      isSubmittingRef.current = true;
      await handleSaveCredentials({
        cv: stagedFiles.resume,
        certification: stagedFiles.certification,
        professionalBodyCertificate: stagedFiles.professionalBodyCertificate,
      });
    } catch {
      // Error handled by mutation onError
    } finally {
      isSubmittingRef.current = false;
    }
  }, [stagedFiles, serverData, handleSaveCredentials, isSaving]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (!isTherapist) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-darkerb">Credential Upload</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Credential uploads and compliance verification are only accessible to
            registered therapists and counselors.
          </p>
        </div>
      </div>
    );
  }

  const isSubmitting = isSaving || isRemovingBodyCert;
  const hasStagedFiles = !!stagedFiles.resume || !!stagedFiles.certification || !!stagedFiles.professionalBodyCertificate;

  return (
    <>
      <div className="space-y-6">
        {/* Header with Title and Refresh Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-darkerb tracking-tight">
              Professional Credentials
            </h2>
            <p className="text-xs sm:text-sm text-neutral mt-0.5">
              Upload and manage your CV, degree certification, and professional body certificate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetchCredentials()}
            disabled={isRefetchingCredentials || isFetchingCredentials}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral hover:text-darkerb self-start sm:self-auto px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh credential status"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefetchingCredentials || isFetchingCredentials ? "animate-spin text-primary" : ""
              }`}
            />
            <span>Sync Status</span>
          </button>
        </div>

        {/* Sleek Loading State for initial fetch */}
        {isFetchingCredentials ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-3 border-primary/15 border-t-primary animate-spin" />
              <ShieldCheck className="w-5 h-5 text-primary absolute" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-darkerb">
                Loading your credential records
              </p>
              <p className="text-xs text-neutral mt-0.5">
                Fetching document records and verification status...
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {/* Compliance & Provisional Timeline Card */}
            {(serverData?.compliance || serverData?.provisionalDeadline) && (
              <div className="p-4 sm:p-5 rounded-xl border border-divider bg-offwhite/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-darkerb">
                      Compliance & Practice Status
                    </span>
                  </div>
                  {serverData.compliance?.status && (
                    <StatusBadge status={serverData.compliance.status} />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-xs">
                  {serverData.compliance?.canAcceptNewBookings !== undefined && (
                    <div className="p-2.5 bg-white rounded-lg border border-gray-100">
                      <span className="text-neutral block mb-1">Booking Availability</span>
                      <span
                        className={`font-semibold ${
                          serverData.compliance.canAcceptNewBookings
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {serverData.compliance.canAcceptNewBookings
                          ? "✓ Accepting Bookings"
                          : "Intake Paused"}
                      </span>
                    </div>
                  )}

                  {serverData.provisionalDeadline && (
                    <div className="p-2.5 bg-white rounded-lg border border-gray-100">
                      <span className="text-neutral block mb-1">Provisional Deadline</span>
                      <span className="font-semibold text-darkerb">
                        {formatDisplayDate(serverData.provisionalDeadline)}
                      </span>
                    </div>
                  )}

                  {serverData.provisionalStartedAt && (
                    <div className="p-2.5 bg-white rounded-lg border border-gray-100">
                      <span className="text-neutral block mb-1">Provisional Started</span>
                      <span className="font-medium text-darkerb">
                        {formatDisplayDate(serverData.provisionalStartedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {serverData.compliance?.transitionNoticePending && (
                  <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      A transition notice is pending for your account. Please ensure all documents are up to date.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Document Fields Container */}
            <div className="space-y-5">
              {/* 1. Resume / CV */}
              <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <label className="text-sm font-semibold text-darkerb block">
                      1. Curriculum Vitae (CV) / Resume
                    </label>
                    <span className="text-xs text-neutral">
                      Upload your comprehensive professional resume in PDF format (Max 5MB).
                    </span>
                  </div>
                  {serverData?.cvStatus && !stagedFiles.resume && (
                    <StatusBadge status={serverData.cvStatus} />
                  )}
                  {stagedFiles.resume && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-primary border border-blue-200">
                      Ready to upload
                    </span>
                  )}
                </div>

                {/* Upload Box / Document Preview */}
                <div className="relative mt-2">
                  <div
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border ${
                      errors.resume
                        ? "border-red-400 bg-red-50/20"
                        : stagedFiles.resume
                        ? "border-primary/40 bg-primary/5"
                        : serverData?.cvUrl
                        ? "border-gray-200 bg-offwhite/40"
                        : "border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <PdfIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-darkerb truncate">
                          {stagedFiles.resume?.name ||
                            (serverData?.cvUrl ? "Verified_CV_Document.pdf" : "Choose Resume / CV")}
                        </p>
                        <p className="text-xs text-neutral">
                          {stagedFiles.resume
                            ? `${formatFileSize(stagedFiles.resume.size)} · Staged for upload`
                            : serverData?.cvUrl
                            ? "Document on record"
                            : "PDF format · Max 5MB"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      {serverData?.cvUrl && !stagedFiles.resume && (
                        <a
                          href={serverData.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </a>
                      )}

                      <label
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          stagedFiles.resume || serverData?.cvUrl
                            ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                            : "bg-primary text-white hover:bg-primary/90"
                        } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{stagedFiles.resume || serverData?.cvUrl ? "Replace" : "Select File"}</span>
                        <input
                          ref={resumeInputRef}
                          type="file"
                          accept="application/pdf"
                          disabled={isSubmitting}
                          onChange={(e) => handleFileSelect(e, "resume")}
                          className="sr-only"
                        />
                      </label>

                      {stagedFiles.resume && (
                        <button
                          type="button"
                          onClick={() => handleClearStaged("resume")}
                          disabled={isSubmitting}
                          className="p-1.5 text-neutral hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Cancel staged file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {serverData?.cvNote && (
                  <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Reviewer Note: </span>
                      {serverData.cvNote}
                    </div>
                  </div>
                )}

                {errors.resume?.message && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.resume.message}</p>
                )}
              </div>

              {/* 2. Educational / Practice Certification */}
              <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <label className="text-sm font-semibold text-darkerb block">
                      2. Educational / Practice Certification
                    </label>
                    <span className="text-xs text-neutral">
                      Upload your primary degree or core clinical counseling certification in PDF (Max 5MB).
                    </span>
                  </div>
                  {serverData?.certificationStatus && !stagedFiles.certification && (
                    <StatusBadge status={serverData.certificationStatus} />
                  )}
                  {stagedFiles.certification && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-primary border border-blue-200">
                      Ready to upload
                    </span>
                  )}
                </div>

                <div className="relative mt-2">
                  <div
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border ${
                      errors.certification
                        ? "border-red-400 bg-red-50/20"
                        : stagedFiles.certification
                        ? "border-primary/40 bg-primary/5"
                        : serverData?.certificationUrl
                        ? "border-gray-200 bg-offwhite/40"
                        : "border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <PdfIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-darkerb truncate">
                          {stagedFiles.certification?.name ||
                            (serverData?.certificationUrl
                              ? "Educational_Certification.pdf"
                              : "Choose Certification")}
                        </p>
                        <p className="text-xs text-neutral">
                          {stagedFiles.certification
                            ? `${formatFileSize(stagedFiles.certification.size)} · Staged for upload`
                            : serverData?.certificationUrl
                            ? "Document on record"
                            : "PDF format · Max 5MB"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      {serverData?.certificationUrl && !stagedFiles.certification && (
                        <a
                          href={serverData.certificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </a>
                      )}

                      <label
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          stagedFiles.certification || serverData?.certificationUrl
                            ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                            : "bg-primary text-white hover:bg-primary/90"
                        } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{stagedFiles.certification || serverData?.certificationUrl ? "Replace" : "Select File"}</span>
                        <input
                          ref={certificationInputRef}
                          type="file"
                          accept="application/pdf"
                          disabled={isSubmitting}
                          onChange={(e) => handleFileSelect(e, "certification")}
                          className="sr-only"
                        />
                      </label>

                      {stagedFiles.certification && (
                        <button
                          type="button"
                          onClick={() => handleClearStaged("certification")}
                          disabled={isSubmitting}
                          className="p-1.5 text-neutral hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Cancel staged file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {serverData?.certificationNote && (
                  <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Reviewer Note: </span>
                      {serverData.certificationNote}
                    </div>
                  </div>
                )}

                {errors.certification?.message && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.certification.message}</p>
                )}
              </div>

              {/* 3. Professional Body Certificate */}
              <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <label className="text-sm font-semibold text-darkerb block">
                      3. Professional Body Certificate
                    </label>
                    <span className="text-xs text-neutral">
                      Upload proof of active licensing or registration with your recognized professional board (Max 5MB).
                    </span>
                  </div>
                  {serverData?.professionalBodyCertificateStatus && !stagedFiles.professionalBodyCertificate && (
                    <StatusBadge status={serverData.professionalBodyCertificateStatus} />
                  )}
                  {stagedFiles.professionalBodyCertificate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-primary border border-blue-200">
                      Ready to upload
                    </span>
                  )}
                </div>

                <div className="relative mt-2">
                  <div
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border ${
                      errors.professionalBodyCertificate
                        ? "border-red-400 bg-red-50/20"
                        : stagedFiles.professionalBodyCertificate
                        ? "border-primary/40 bg-primary/5"
                        : serverData?.professionalBodyCertificateUrl
                        ? "border-gray-200 bg-offwhite/40"
                        : "border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <PdfIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-darkerb truncate">
                          {stagedFiles.professionalBodyCertificate?.name ||
                            (serverData?.professionalBodyCertificateUrl
                              ? "Professional_Body_Certificate.pdf"
                              : "Choose Professional Body Certificate")}
                        </p>
                        <p className="text-xs text-neutral">
                          {stagedFiles.professionalBodyCertificate
                            ? `${formatFileSize(stagedFiles.professionalBodyCertificate.size)} · Staged for upload`
                            : isRemovingBodyCert
                            ? "Removing certificate..."
                            : serverData?.professionalBodyCertificateUrl
                            ? "Document on record"
                            : "PDF format · Max 5MB"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      {serverData?.professionalBodyCertificateUrl && !stagedFiles.professionalBodyCertificate && (
                        <a
                          href={serverData.professionalBodyCertificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </a>
                      )}

                      <label
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          stagedFiles.professionalBodyCertificate || serverData?.professionalBodyCertificateUrl
                            ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                            : "bg-primary text-white hover:bg-primary/90"
                        } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{stagedFiles.professionalBodyCertificate || serverData?.professionalBodyCertificateUrl ? "Replace" : "Select File"}</span>
                        <input
                          ref={bodyCertInputRef}
                          type="file"
                          accept="application/pdf"
                          disabled={isSubmitting}
                          onChange={(e) => handleFileSelect(e, "professionalBodyCertificate")}
                          className="sr-only"
                        />
                      </label>

                      {stagedFiles.professionalBodyCertificate && (
                        <button
                          type="button"
                          onClick={() => handleClearStaged("professionalBodyCertificate")}
                          disabled={isSubmitting}
                          className="p-1.5 text-neutral hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Cancel staged file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {serverData?.professionalBodyCertificateUrl && !stagedFiles.professionalBodyCertificate && (
                        <button
                          type="button"
                          onClick={() => void mutateRemoveBodyCert()}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                          title="Remove professional body certificate"
                        >
                          {isRemovingBodyCert ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {serverData?.professionalBodyCertificateNote && (
                  <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Reviewer Note: </span>
                      {serverData.professionalBodyCertificateNote}
                    </div>
                  </div>
                )}

                {errors.professionalBodyCertificate?.message && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.professionalBodyCertificate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
              <p className="text-xs text-neutral">
                {hasStagedFiles
                  ? "Click Save Credentials below to upload your selected documents."
                  : "Select replacement files above if you need to update any document."}
              </p>
              <button
                type="submit"
                disabled={isSubmitting || !hasStagedFiles}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Uploading Credentials...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4" />
                    <span>Save Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </>
  );
};

export default CredentialForm;
