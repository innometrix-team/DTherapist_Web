// /types/settings.types.ts

export interface ProfileDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  profile: string;
  specialization: string;
  yearsOfExperience: number;
  country: string;
}

export interface CredentialDetails {
  resume: File | null;
  certification: File | null;
}

export interface PasswordDetails {
  newPassword: string;
  confirmPassword: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}
