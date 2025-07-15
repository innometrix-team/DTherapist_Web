import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { FaTrash, FaUpload, FaCheck } from "react-icons/fa";
import { 
  uploadCVApi, 
  uploadCertificationApi, 
  saveCredentialsApi
} from "../../api/Credential.api";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { PdfIcon } from "../../assets/icons";
import type { SubmitHandler } from "react-hook-form";

// Define Role type (add this to your types file if it doesn't exist)
type Role = "client" | "therapist" | "user" | "counselor";

// Zod schema for credential validation
const credentialSchema = z.object({
  resume: z
    .any()
    .refine(
      (file) => !file || file instanceof File,
      "Resume must be a valid file"
    )
    .refine(
      (file) => !file || file.type === "application/pdf",
      "Resume must be a PDF file"
    )
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024, // 5MB limit
      "Resume file size must be less than 5MB"
    ),
  certification: z
    .any()
    .refine(
      (file) => !file || file instanceof File,
      "Certification must be a valid file"
    )
    .refine(
      (file) => !file || file.type === "application/pdf",
      "Certification must be a PDF file"
    )
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024, // 5MB limit
      "Certification file size must be less than 5MB"
    ),
});

type CredentialFormData = z.infer<typeof credentialSchema>;

interface UploadedFile {
  name: string;
  url: string;
  uploaded: boolean;
}

// Type guard to check if user is therapist
const isTherapistRole = (role: Role | null): role is "therapist" | "counselor" => {
  return role === "therapist" || role === "counselor";
};

const CredentialForm: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    resume: UploadedFile | null;
    certification: UploadedFile | null;
  }>({
    resume: null,
    certification: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const certificationInputRef = useRef<HTMLInputElement>(null);
  
  const auth = useAuthStore((state) => state);

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      resume: null,
      certification: null,
    },
  });

  const resumeFile = watch("resume");
  const certificationFile = watch("certification");

  // Check if user is therapist/counselor using type guard
  const isTherapist = isTherapistRole(auth?.role);

  // Upload CV mutation
  const { mutateAsync: handleCVUpload, isPending: isUploadingCV } = useMutation({
    mutationFn: (file: File) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return uploadCVApi(file, { signal: controller.signal });
    },
    onSuccess: (result) => {
      if (!result) return;
      
      const url = result.data?.cvUrl;
      
      if (!url) {
        toast.error("Upload successful but URL not received. Please try again.");
        console.error("CV Upload response:", result);
        return;
      }
      
      setUploadedFiles(prev => ({
        ...prev,
        resume: {
          name: resumeFile?.name || "CV",
          url: url,
          uploaded: true,
        },
      }));
      
      toast.success(result.message || "CV uploaded successfully!");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to upload CV. Please try again.";
      toast.error(message);
    },
  });

  // Upload Certification mutation
  const { mutateAsync: handleCertificationUpload, isPending: isUploadingCertification } = useMutation({
    mutationFn: (file: File) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return uploadCertificationApi(file, { signal: controller.signal });
    },
    onSuccess: (result) => {
      if (!result) return;
      
      const url = result.data?.certUrl;
      
      if (!url) {
        toast.error("Upload successful but URL not received. Please try again.");
        console.error("Certification Upload response:", result);
        return;
      }
      
      setUploadedFiles(prev => ({
        ...prev,
        certification: {
          name: certificationFile?.name || "Certification",
          url: url,
          uploaded: true,
        },
      }));
      
      toast.success(result.message || "Certification uploaded successfully!");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to upload certification. Please try again.";
      toast.error(message);
    },
  });

  // Save credentials mutation
  const { mutateAsync: handleSaveCredentials, isPending: isSaving } = useMutation({
    mutationFn: (data: { cvUrl: string; certificationUrl: string }) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return saveCredentialsApi(data, { signal: controller.signal });
    },
    onSuccess: (result) => {
      if (!result) return;
      toast.success(result.message || "Credentials saved successfully!");
      // Reset form and uploaded files after successful save
      reset();
      setUploadedFiles({
        resume: null,
        certification: null,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to save credentials. Please try again.";
      toast.error(message);
    },
  });

  // Handle file change and immediate upload
  const handleFileChange = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: "resume" | "certification"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValue(type, file);
    
    try {
      if (type === "resume") {
        await handleCVUpload(file);
      } else {
        await handleCertificationUpload(file);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
      toast.error(message);
    }
  }, [handleCVUpload, handleCertificationUpload, setValue]);

  const onSubmit: SubmitHandler<CredentialFormData> = useCallback(async () => {
    if (!uploadedFiles.resume?.uploaded || !uploadedFiles.certification?.uploaded) {
      toast.error("Please upload both CV and certification files before saving.");
      return;
    }
    
    if (!uploadedFiles.resume.url || !uploadedFiles.certification.url) {
      toast.error("File URLs are missing. Please try uploading the files again.");
      return;
    }
    
    await handleSaveCredentials({
      cvUrl: uploadedFiles.resume.url,
      certificationUrl: uploadedFiles.certification.url,
    });
  }, [uploadedFiles, handleSaveCredentials]);

  
  const handleRemoveFile = useCallback((type: "resume" | "certification") => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: null,
    }));
    
    setValue(type, null);
    
    if (type === "resume" && resumeInputRef.current) {
      resumeInputRef.current.value = "";
    } else if (type === "certification" && certificationInputRef.current) {
      certificationInputRef.current.value = "";
    }
    
    toast.success(`${type === "resume" ? "CV" : "Certification"} removed successfully!`);
  }, [setValue]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Show message if not therapist
  if (!isTherapist) {
    return (
      <div className="bg-white p-4 md:p-6 space-y-6 w-full">
        <h2 className="text-xl font-semibold text-gray-800">Credential Upload</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            Credential upload is only available for therapists and counselors.
          </p>
        </div>
      </div>
    );
  }

  const isSubmitting = isUploadingCV || isUploadingCertification || isSaving;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 md:p-6 space-y-6 w-full">
      <h2 className="text-xl font-semibold text-gray-800">Credential Upload</h2>

      {/* Resume Upload Field */}
      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
        <label className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0 md:pt-2">
          Upload Resume/CV
        </label>
        <div className="flex-1 max-w-full md:max-w-md">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={resumeInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, "resume")}
                disabled={isSubmitting}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className={`flex items-center gap-2 bg-gray-100 border px-3 py-2 rounded-md ${
                errors.resume ? "border-red-500" : "border-gray-300"
              } ${isSubmitting ? "opacity-50" : ""}`}>
                <PdfIcon />
                <span className="text-sm text-gray-600 flex-1">
                  {uploadedFiles.resume?.uploaded 
                    ? uploadedFiles.resume.name
                    : "Choose resume/CV"}
                </span>
                {isUploadingCV && (
                  <FaUpload className="text-blue-500 animate-spin" />
                )}
                {uploadedFiles.resume?.uploaded && (
                  <FaCheck className="text-green-500" />
                )}
              </div>
            </div>
            
            {uploadedFiles.resume?.uploaded && (
              <button
                type="button"
                onClick={() => handleRemoveFile("resume")}
                disabled={isSubmitting}
                className="flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50 rounded-md transition-colors duration-200"
                title="Remove CV"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
          
          {errors.resume && (
            <p className="text-red-500 text-xs mt-1">
              {typeof errors.resume.message === 'string' 
                ? errors.resume.message 
                : 'Invalid file'}
            </p>
          )}
        </div>
      </div>

      {/* Certification Upload Field */}
      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
        <label className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0 md:pt-2">
          Upload Certification
        </label>
        <div className="flex-1 max-w-full md:max-w-md">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={certificationInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, "certification")}
                disabled={isSubmitting}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className={`flex items-center gap-2 bg-gray-100 border px-3 py-2 rounded-md ${
                errors.certification ? "border-red-500" : "border-gray-300"
              } ${isSubmitting ? "opacity-50" : ""}`}>
                <PdfIcon />
                <span className="text-sm text-gray-600 flex-1">
                  {uploadedFiles.certification?.uploaded 
                    ? uploadedFiles.certification.name
                    : "Choose certification"}
                </span>
                {isUploadingCertification && (
                  <FaUpload className="text-blue-500 animate-spin" />
                )}
                {uploadedFiles.certification?.uploaded && (
                  <FaCheck className="text-green-500" />
                )}
              </div>
            </div>
            
            {uploadedFiles.certification?.uploaded && (
              <button
                type="button"
                onClick={() => handleRemoveFile("certification")}
                disabled={isSubmitting}
                className="flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50 rounded-md transition-colors duration-200"
                title="Remove Certification"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
          
          {errors.certification && (
            <p className="text-red-500 text-xs mt-1">
              {typeof errors.certification.message === 'string' 
                ? errors.certification.message 
                : 'Invalid file'}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !uploadedFiles.resume?.uploaded || !uploadedFiles.certification?.uploaded}
          className="bg-primary hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSaving ? "Saving..." : "Save Credentials"}
        </button>
      </div>
    </form>
  );
};

export default CredentialForm;