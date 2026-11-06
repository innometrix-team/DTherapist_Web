import { AxiosRequestConfig } from "axios";
import Api, { IAPIResult, handleApiRequest, ApiResponseEnvelope } from "./Api";

export type Role = "client" | "therapist" | "user" | "counselor";

export type CredentialDocStatus = "pending" | "approved" | "rejected";

export interface IComplianceData {
  status?: CredentialDocStatus;
  canAcceptNewBookings?: boolean;
  provisionalStartedAt?: string;
  provisionalDeadline?: string;
  transitionNoticePending?: boolean;
}

export interface ICredentialsData {
  userId?: string;
  cvUrl?: string;
  cvStatus?: CredentialDocStatus;
  cvNote?: string;
  certificationUrl?: string;
  certificationStatus?: CredentialDocStatus;
  certificationNote?: string;
  professionalBodyCertificateUrl?: string;
  professionalBodyCertificateStatus?: CredentialDocStatus;
  professionalBodyCertificateNote?: string;
  provisionalStartedAt?: string;
  provisionalDeadline?: string;
  compliance?: IComplianceData;
}

export interface ICredentialUploadData {
  resume?: File | null;
  certification?: File | null;
  professionalBodyCertificate?: File | null;
}

export interface IUserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ICredentialResponseData {
  user?: IUserSummary;
  message?: string;
  cvUrl?: string;
  certUrl?: string;
  certificationUrl?: string;
  certificateUrl?: string;
  professionalBodyCertificateUrl?: string;
  credentials?: ICredentialsData;
}

/**
 * Fetch existing credentials preview and compliance status
 * GET /api/profile/credentials
 */
export async function getCredentialsApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialsData> | null> {
  return handleApiRequest<ICredentialsData>(() =>
    Api.get<ApiResponseEnvelope<ICredentialsData>>("/api/profile/credentials", config)
  );
}

/**
 * Upload CV/Resume
 * POST /api/profile/upload-cv
 */
export async function uploadCVApi(
  file: File,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  const formData = new FormData();
  formData.append("cv", file);

  const requestConfig: AxiosRequestConfig = {
    ...config,
  };
  if (requestConfig.headers) {
    delete requestConfig.headers["Content-Type"];
    delete requestConfig.headers["content-type"];
  }

  return handleApiRequest<ICredentialResponseData>(() =>
    Api.post<ApiResponseEnvelope<ICredentialResponseData>>("/api/profile/upload-cv", formData, requestConfig)
  );
}

/**
 * Upload Educational / Practice Certification
 * POST /api/profile/upload-certification
 */
export async function uploadCertificationApi(
  file: File,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  const formData = new FormData();
  formData.append("certification", file);

  const requestConfig: AxiosRequestConfig = {
    ...config,
  };
  if (requestConfig.headers) {
    delete requestConfig.headers["Content-Type"];
    delete requestConfig.headers["content-type"];
  }

  return handleApiRequest<ICredentialResponseData>(() =>
    Api.post<ApiResponseEnvelope<ICredentialResponseData>>(
      "/api/profile/upload-certification",
      formData,
      requestConfig
    )
  );
}

/**
 * Upload Professional Body Certificate
 * POST /api/profile/upload-professional-body-certificate
 */
export async function uploadProfessionalBodyCertificateApi(
  file: File,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  const formData = new FormData();
  formData.append("professionalBodyCertificate", file);

  const requestConfig: AxiosRequestConfig = {
    ...config,
  };
  if (requestConfig.headers) {
    delete requestConfig.headers["Content-Type"];
    delete requestConfig.headers["content-type"];
  }

  return handleApiRequest<ICredentialResponseData>(() =>
    Api.post<ApiResponseEnvelope<ICredentialResponseData>>(
      "/api/profile/upload-professional-body-certificate",
      formData,
      requestConfig
    )
  );
}

/**
 * Remove Professional Body Certificate
 * DELETE /api/profile/remove-professional-body-certificate
 */
export async function removeProfessionalBodyCertificateApi(
  config?: AxiosRequestConfig
): Promise<IAPIResult<unknown> | null> {
  return handleApiRequest<unknown>(() =>
    Api.delete<ApiResponseEnvelope<unknown>>(
      "/api/profile/remove-professional-body-certificate",
      config
    )
  );
}

export interface ISaveCredentialsFiles {
  cv?: File | null;
  certification?: File | null;
  professionalBodyCertificate?: File | null;
}

/**
 * Upload all credential documents together
 * POST /api/profile/save-credentials (multipart/form-data)
 */
export async function saveCredentialsApi(
  data: ISaveCredentialsFiles,
  config?: AxiosRequestConfig
): Promise<IAPIResult<ICredentialResponseData> | null> {
  const formData = new FormData();
  if (data.cv) {
    formData.append("cv", data.cv);
  }
  if (data.certification) {
    formData.append("certification", data.certification);
  }
  if (data.professionalBodyCertificate) {
    formData.append("professionalBodyCertificate", data.professionalBodyCertificate);
  }

  const requestConfig: AxiosRequestConfig = {
    ...config,
  };
  if (requestConfig.headers) {
    delete requestConfig.headers["Content-Type"];
    delete requestConfig.headers["content-type"];
  }

  return handleApiRequest<ICredentialResponseData>(() =>
    Api.post<ApiResponseEnvelope<ICredentialResponseData>>(
      "/api/profile/save-credentials",
      formData,
      requestConfig
    )
  );
}
