/** Narrow consultation view models for the doctor dashboard. */

export type ConsultationEligibleAppointment = {
  id: string;
  reference: string;
  patientName: string;
  patientReference: string;
  date: string;
  startTime: string;
  serviceName: string | null;
};

export type ConsultationSummary = {
  id: string;
  appointmentId: string | null;
  patientName: string;
  patientReference: string;
  consultedAtLabel: string;
  chiefComplaint: string | null;
  history: string | null;
  examination: string | null;
  assessment: string | null;
  plan: string | null;
  privateNotes: string | null;
  prescriptionId: string | null;
  followUpId: string | null;
};

export type ConsultationsData =
  | {
      status: "ok";
      consultations: ConsultationSummary[];
      eligibleAppointments: ConsultationEligibleAppointment[];
    }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };
