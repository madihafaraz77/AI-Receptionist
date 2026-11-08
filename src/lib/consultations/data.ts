import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

import type {
  ConsultationEligibleAppointment,
  ConsultationSummary,
  ConsultationsData,
} from "./types";

type ConsultationRow = {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  consulted_at: string;
  chief_complaint: string | null;
  history: string | null;
  examination: string | null;
  assessment: string | null;
  plan: string | null;
  private_notes: string | null;
};

type AppointmentRow = {
  id: string;
  reference: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  service_id: string;
};

type QueryProblem = { status: "needs_migration" } | { status: "error" };

function classifyError(
  error: { code?: string; message?: string } | null,
): QueryProblem | null {
  if (!error) return null;

  const message = error.message ?? "";

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|does not exist/i.test(message)
  ) {
    return { status: "needs_migration" };
  }

  console.error("[consultations] Supabase query failed", {
    code: error.code,
    message,
  });

  return { status: "error" };
}

function formatDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  }

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatTime(value: string): string {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Loads consultation history and recent appointments for creation. */
export async function getConsultationsData(): Promise<ConsultationsData> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const [consultationsResult, appointmentsResult] = await Promise.all([
    supabase
      .from("consultations")
      .select(
        "id, appointment_id, patient_id, consulted_at, chief_complaint, history, examination, assessment, plan, private_notes",
      )
      .order("consulted_at", { ascending: false })
      .limit(100),
    supabase
      .from("appointments")
      .select("id, reference, patient_id, appointment_date, start_time, status, service_id")
      .in("status", ["confirmed", "completed"])
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(50),
  ]);

  const queryError = classifyError(
    consultationsResult.error ?? appointmentsResult.error,
  );
  if (queryError) return queryError;

  const consultationRows = (consultationsResult.data ?? []) as ConsultationRow[];
  const appointmentRows = (appointmentsResult.data ?? []) as AppointmentRow[];
  const patientIds = Array.from(
    new Set([
      ...consultationRows.map((row) => row.patient_id),
      ...appointmentRows.map((row) => row.patient_id),
    ]),
  );

  let patients: Array<{ id: string; full_name: string; reference: string }> = [];

  if (patientIds.length > 0) {
    const patientsResult = await supabase
      .from("patients")
      .select("id, full_name, reference")
      .in("id", patientIds);

    const patientsError = classifyError(patientsResult.error);
    if (patientsError) return patientsError;

    patients = (patientsResult.data ?? []) as typeof patients;
  }

  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

  const serviceIds = Array.from(
    new Set(appointmentRows.map((row) => row.service_id)),
  );
  let services: Array<{ id: string; name: string }> = [];

  if (serviceIds.length > 0) {
    const servicesResult = await supabase
      .from("services")
      .select("id, name")
      .in("id", serviceIds);

    const servicesError = classifyError(servicesResult.error);
    if (servicesError) return servicesError;

    services = (servicesResult.data ?? []) as typeof services;
  }

  const serviceMap = new Map(services.map((service) => [service.id, service]));

  const eligibleAppointments: ConsultationEligibleAppointment[] =
    appointmentRows.map((row) => {
      const patient = patientMap.get(row.patient_id);
      const service = serviceMap.get(row.service_id);

      return {
        id: row.id,
        reference: row.reference,
        patientName: patient?.full_name ?? "Patient record unavailable",
        patientReference: patient?.reference ?? "Patient reference unavailable",
        date: formatDate(row.appointment_date),
        startTime: formatTime(row.start_time),
        serviceName: service?.name ?? null,
      };
    });

  const consultationIds = consultationRows.map((row) => row.id);
  let prescriptions: Array<{ id: string; consultation_id: string }> = [];
  let followUps: Array<{ id: string; consultation_id: string | null }> = [];

  if (consultationIds.length > 0) {
    const [prescriptionsResult, followUpsResult] = await Promise.all([
      supabase
        .from("prescriptions")
        .select("id, consultation_id")
        .in("consultation_id", consultationIds),
      supabase
        .from("follow_ups")
        .select("id, consultation_id")
        .in("consultation_id", consultationIds),
    ]);

    const notesError = classifyError(
      prescriptionsResult.error ?? followUpsResult.error,
    );
    if (notesError) return notesError;

    prescriptions = (prescriptionsResult.data ?? []) as typeof prescriptions;
    followUps = (followUpsResult.data ?? []) as typeof followUps;
  }

  const prescriptionMap = new Map(
    prescriptions.map((row) => [row.consultation_id, row.id]),
  );
  const followUpMap = new Map(
    followUps.map((row) => [row.consultation_id, row.id]),
  );

  const consultations: ConsultationSummary[] = consultationRows.map((row) => {
    const patient = patientMap.get(row.patient_id);

    return {
      id: row.id,
      appointmentId: row.appointment_id,
      patientName: patient?.full_name ?? "Patient record unavailable",
      patientReference: patient?.reference ?? "Patient reference unavailable",
      consultedAtLabel: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(new Date(row.consulted_at)),
      chiefComplaint: row.chief_complaint,
      history: row.history,
      examination: row.examination,
      assessment: row.assessment,
      plan: row.plan,
      privateNotes: row.private_notes,
      prescriptionId: prescriptionMap.get(row.id) ?? null,
      followUpId: followUpMap.get(row.id) ?? null,
    };
  });

  return {
    status: "ok",
    consultations,
    eligibleAppointments,
  };
}
