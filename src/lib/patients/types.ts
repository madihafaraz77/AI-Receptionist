/** Narrow patient view models for the dashboard. */

export type PatientSummary = {
  id: string;
  reference: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  adminNotes: string | null;
};

export type PatientAttachment = {
  id: string;
  patientId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  signedUrl: string | null;
};

export type PatientsData =
  | {
      status: "ok";
      patients: PatientSummary[];
      attachments: PatientAttachment[];
      query: string;
    }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };
