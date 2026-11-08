import "server-only";

import { clinicConfig } from "@/config/clinic";
import {
  addDaysToDateKey,
  formatDateKey,
  formatDueLabel,
  formatRelativeTime,
  formatTimeInZone,
} from "@/lib/dashboard/date";
import type {
  AppointmentStatus,
  AppointmentType,
  BookingSource,
  DashboardAppointment,
  DashboardConversation,
  DashboardData,
  DashboardAppointmentsData,
  DashboardFollowUpsData,
  DashboardFollowUp,
  DashboardNotification,
  ManagedAppointment,
  ManagedFollowUp,
  NotificationChannel,
  NotificationStatus,
} from "@/lib/dashboard/types";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseError = { code?: string; message?: string };

type AppointmentRow = {
  id: string;
  reference: string;
  start_time: string;
  mode: string;
  status: string;
  source: string;
  fee_pkr: number;
  patient_id: string;
};

type PatientRow = {
  id: string;
  full_name: string;
  reference: string;
};

type FollowUpRow = {
  id: string;
  due_at: string;
  patient_id: string;
};

type NotificationRow = {
  id: string;
  channel: string;
  status: string;
  template: string;
  payload: unknown;
  created_at: string;
};

type ConversationRow = {
  id: string;
  visitor_name: string | null;
  escalation_reason: string | null;
  last_message_at: string;
};

const ACTIVE_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
];

type QueryProblem =
  | { status: "needs_migration" }
  | { status: "error" };

function classifyError(error: SupabaseError | null): QueryProblem | null {
  if (!error) return null;

  const message = error.message ?? "";

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|does not exist/i.test(message)
  ) {
    return { status: "needs_migration" };
  }

  // Log server-side only. Never show raw database errors in the UI.
  console.error("[dashboard] Supabase query failed", {
    code: error.code,
    message,
  });

  return { status: "error" };
}

function asAppointmentStatus(value: string): AppointmentStatus {
  const allowed: AppointmentStatus[] = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
    "rescheduled",
  ];
  return allowed.includes(value as AppointmentStatus)
    ? (value as AppointmentStatus)
    : "confirmed";
}

function asAppointmentType(value: string): AppointmentType {
  return value === "online" ? "online" : "in_person";
}

function asBookingSource(value: string): BookingSource {
  if (value === "ai_receptionist") return "ai_receptionist";
  if (value === "staff") return "staff";
  return "website";
}

function asNotificationChannel(value: string): NotificationChannel {
  if (value === "email") return "email";
  if (value === "whatsapp") return "whatsapp";
  return "dashboard";
}

function asNotificationStatus(value: string): NotificationStatus {
  const allowed: NotificationStatus[] = [
    "queued",
    "sent",
    "delivered",
    "failed",
    "not_connected",
  ];
  return allowed.includes(value as NotificationStatus)
    ? (value as NotificationStatus)
    : "queued";
}

function humanizeTemplate(template: string): string {
  return template
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function readPayload(payload: unknown): { title?: string; detail?: string } {
  if (!payload || typeof payload !== "object") return {};

  const record = payload as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : undefined,
    detail: typeof record.detail === "string" ? record.detail : undefined,
  };
}

/**
 * Loads the dashboard overview from Supabase.
 *
 * Returns a discriminated union so the page can render an honest setup, error
 * or empty state instead of guessing. No sample records are used.
 */
export async function getDashboardOverview(): Promise<DashboardData> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const now = new Date();

  const settingsResult = await supabase
    .from("clinic_settings")
    .select("timezone, daily_capacity, appointment_duration_minutes")
    .eq("id", true)
    .maybeSingle();

  const settingsError = classifyError(settingsResult.error);
  if (settingsError) return settingsError;

  const settings = settingsResult.data as {
    timezone: string | null;
    daily_capacity: number | null;
    appointment_duration_minutes: number | null;
  } | null;

  const timezone = settings?.timezone ?? "UTC";
  const todayKey = formatDateKey(now, timezone);
  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  const nextWeekKey = addDaysToDateKey(todayKey, 7);

  const [
    todayCountResult,
    upcomingCountResult,
    patientCountResult,
    consultationCountResult,
    pendingFeedbackResult,
    aiAttentionCountResult,
    appointmentsResult,
    followUpsResult,
    notificationsResult,
    conversationsResult,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", todayKey)
      .in("status", ACTIVE_STATUSES),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("appointment_date", tomorrowKey)
      .lte("appointment_date", nextWeekKey)
      .in("status", ["pending", "confirmed"]),
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase.from("consultations").select("*", { count: "exact", head: true }),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("ai_conversations")
      .select("*", { count: "exact", head: true })
      .eq("status", "needs_human"),
    supabase
      .from("appointments")
      .select(
        "id, reference, start_time, mode, status, source, fee_pkr, patient_id",
      )
      .eq("appointment_date", todayKey)
      .in("status", ACTIVE_STATUSES)
      .order("start_time", { ascending: true })
      .limit(50),
    supabase
      .from("follow_ups")
      .select("id, due_at, patient_id")
      .eq("status", "scheduled")
      .gte("due_at", now.toISOString())
      .order("due_at", { ascending: true })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, channel, status, template, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("ai_conversations")
      .select("id, visitor_name, escalation_reason, last_message_at")
      .eq("status", "needs_human")
      .order("last_message_at", { ascending: false })
      .limit(3),
  ]);

  const queryError = classifyError(
    todayCountResult.error ??
      upcomingCountResult.error ??
      patientCountResult.error ??
      consultationCountResult.error ??
      pendingFeedbackResult.error ??
      aiAttentionCountResult.error ??
      appointmentsResult.error ??
      followUpsResult.error ??
      notificationsResult.error ??
      conversationsResult.error,
  );

  if (queryError) return queryError;

  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
  const followUps = (followUpsResult.data ?? []) as FollowUpRow[];

  const patientIds = Array.from(
    new Set(
      [
        ...appointments.map((appointment) => appointment.patient_id),
        ...followUps.map((followUp) => followUp.patient_id),
      ].filter(Boolean),
    ),
  );

  let patients: PatientRow[] = [];

  if (patientIds.length > 0) {
    const patientsResult = await supabase
      .from("patients")
      .select("id, full_name, reference")
      .in("id", patientIds);

    const patientsError = classifyError(patientsResult.error);
    if (patientsError) return patientsError;

    patients = (patientsResult.data ?? []) as PatientRow[];
  }

  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

  const mappedAppointments: DashboardAppointment[] = appointments.map(
    (appointment) => {
      const patient = patientMap.get(appointment.patient_id);

      return {
        id: appointment.id,
        time: appointment.start_time.slice(0, 5),
        patientName: patient?.full_name ?? "Patient record unavailable",
        patientReference: patient?.reference ?? appointment.reference,
        type: asAppointmentType(appointment.mode),
        status: asAppointmentStatus(appointment.status),
        source: asBookingSource(appointment.source),
        feePkr: appointment.fee_pkr,
      };
    },
  );

  const mappedFollowUps: DashboardFollowUp[] = followUps.map((followUp) => {
    const patient = patientMap.get(followUp.patient_id);

    return {
      id: followUp.id,
      patientName: patient?.full_name ?? "Patient record unavailable",
      dueLabel: formatDueLabel(followUp.due_at, timezone, todayKey),
      time: formatTimeInZone(followUp.due_at, timezone),
      reminderStatus: "scheduled",
    };
  });

  const mappedNotifications: DashboardNotification[] = (
    (notificationsResult.data ?? []) as NotificationRow[]
  ).map((notification) => {
    const payload = readPayload(notification.payload);

    return {
      id: notification.id,
      title: payload.title ?? humanizeTemplate(notification.template),
      detail: payload.detail ?? "Clinic notification",
      channel: asNotificationChannel(notification.channel),
      status: asNotificationStatus(notification.status),
      timeLabel: formatRelativeTime(notification.created_at, now),
    };
  });

  const mappedConversations: DashboardConversation[] = (
    (conversationsResult.data ?? []) as ConversationRow[]
  ).map((conversation) => ({
    id: conversation.id,
    patientName: conversation.visitor_name?.trim() || "Website visitor",
    summary:
      conversation.escalation_reason?.trim() ||
      "Visitor requested a member of the clinic team.",
    lastMessageAt: formatRelativeTime(conversation.last_message_at, now),
  }));

  const todayAppointments = todayCountResult.count ?? 0;

  return {
    status: "ok",
    timezone,
    timezoneConfigured: Boolean(settings?.timezone),
    appointmentDurationMinutes:
      settings?.appointment_duration_minutes ??
      clinicConfig.appointmentDurationMinutes,
    stats: {
      todayAppointments,
      upcomingAppointments: upcomingCountResult.count ?? 0,
      registeredPatients: patientCountResult.count ?? 0,
      completedConsultations: consultationCountResult.count ?? 0,
      capacityUsed: todayAppointments,
      capacityTotal: settings?.daily_capacity ?? clinicConfig.dailyCapacity,
      aiConversationsNeedingAttention: aiAttentionCountResult.count ?? 0,
      pendingFeedback: pendingFeedbackResult.count ?? 0,
    },
    appointments: mappedAppointments,
    followUps: mappedFollowUps,
    notifications: mappedNotifications,
    conversations: mappedConversations,
  };
}

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const STATUS_FILTERS: Array<AppointmentStatus | "all"> = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
];

function isDateKey(value: string | undefined): value is string {
  if (!value) return false;

  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function readStatusFilter(value: string | undefined): AppointmentStatus | "all" {
  return STATUS_FILTERS.includes(value as AppointmentStatus | "all")
    ? (value as AppointmentStatus | "all")
    : "all";
}

type ManagedAppointmentRow = {
  id: string;
  reference: string;
  start_time: string;
  end_time: string;
  mode: string;
  status: string;
  source: string;
  fee_pkr: number;
  patient_notes: string | null;
  patient_id: string;
  service_id: string;
};

type ManagedPatientRow = PatientRow & {
  phone: string;
};

type ManagedServiceRow = {
  id: string;
  name: string;
};

/**
 * Loads the appointments workspace for a selected date.
 *
 * Reads are RLS-protected. Writes happen through `set_appointment_status`,
 * never directly from the browser.
 */
export async function getDashboardAppointments(
  options: { date?: string; status?: string } = {},
): Promise<DashboardAppointmentsData> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const now = new Date();

  const settingsResult = await supabase
    .from("clinic_settings")
    .select("timezone, daily_capacity")
    .eq("id", true)
    .maybeSingle();

  const settingsError = classifyError(settingsResult.error);
  if (settingsError) return settingsError;

  const settings = settingsResult.data as {
    timezone: string | null;
    daily_capacity: number | null;
  } | null;

  const timezone = settings?.timezone ?? "UTC";
  const todayKey = formatDateKey(now, timezone);
  const selectedDate = isDateKey(options.date) ? options.date : todayKey;
  const statusFilter = readStatusFilter(options.status);

  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, reference, start_time, end_time, mode, status, source, fee_pkr, patient_notes, patient_id, service_id",
    )
    .eq("appointment_date", selectedDate)
    .order("start_time", { ascending: true })
    .limit(100);

  if (statusFilter !== "all") {
    appointmentsQuery = appointmentsQuery.eq("status", statusFilter);
  }

  const [appointmentsResult, capacityResult] = await Promise.all([
    appointmentsQuery,
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", selectedDate)
      .in("status", ACTIVE_STATUSES),
  ]);

  const queryError = classifyError(
    appointmentsResult.error ?? capacityResult.error,
  );

  if (queryError) return queryError;

  const appointments = (appointmentsResult.data ?? []) as ManagedAppointmentRow[];
  const patientIds = Array.from(
    new Set(appointments.map((appointment) => appointment.patient_id)),
  );
  const serviceIds = Array.from(
    new Set(appointments.map((appointment) => appointment.service_id)),
  );

  let patients: ManagedPatientRow[] = [];
  let services: ManagedServiceRow[] = [];

  if (patientIds.length > 0) {
    const patientsResult = await supabase
      .from("patients")
      .select("id, full_name, reference, phone")
      .in("id", patientIds);

    const patientsError = classifyError(patientsResult.error);
    if (patientsError) return patientsError;

    patients = (patientsResult.data ?? []) as ManagedPatientRow[];
  }

  if (serviceIds.length > 0) {
    const servicesResult = await supabase
      .from("services")
      .select("id, name")
      .in("id", serviceIds);

    const servicesError = classifyError(servicesResult.error);
    if (servicesError) return servicesError;

    services = (servicesResult.data ?? []) as ManagedServiceRow[];
  }

  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const serviceMap = new Map(services.map((service) => [service.id, service]));

  const mappedAppointments: ManagedAppointment[] = appointments.map(
    (appointment) => {
      const patient = patientMap.get(appointment.patient_id);
      const service = serviceMap.get(appointment.service_id);

      return {
        id: appointment.id,
        reference: appointment.reference,
        time: appointment.start_time.slice(0, 5),
        endTime: appointment.end_time.slice(0, 5),
        patientName: patient?.full_name ?? "Patient record unavailable",
        patientReference: patient?.reference ?? appointment.reference,
        patientPhone: patient?.phone ?? "Phone not available",
        serviceName: service?.name ?? null,
        type: asAppointmentType(appointment.mode),
        status: asAppointmentStatus(appointment.status),
        source: asBookingSource(appointment.source),
        feePkr: appointment.fee_pkr,
        notes: appointment.patient_notes,
      };
    },
  );

  return {
    status: "ok",
    timezone,
    timezoneConfigured: Boolean(settings?.timezone),
    selectedDate,
    statusFilter,
    appointments: mappedAppointments,
    capacityUsed: capacityResult.count ?? 0,
    capacityTotal: settings?.daily_capacity ?? clinicConfig.dailyCapacity,
  };
}

const FOLLOW_UP_STATUSES = ["scheduled", "sent", "completed", "cancelled"] as const;
type FollowUpStatusFilter = (typeof FOLLOW_UP_STATUSES)[number] | "all";

function readFollowUpStatusFilter(value: string | undefined): FollowUpStatusFilter {
  return FOLLOW_UP_STATUSES.includes(value as (typeof FOLLOW_UP_STATUSES)[number])
    ? (value as FollowUpStatusFilter)
    : "all";
}

type ManagedFollowUpRow = {
  id: string;
  due_at: string;
  reminder_hours: number;
  status: string;
  notes: string | null;
  patient_id: string;
};

/**
 * Loads follow-ups from Supabase with RLS applied.
 *
 * This intentionally does not let visitors or staff schedule follow-ups from
 * the browser; creation from consultations is a separate clinical workflow.
 */
export async function getDashboardFollowUps(
  options: { status?: string } = {},
): Promise<DashboardFollowUpsData> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const now = new Date();

  const settingsResult = await supabase
    .from("clinic_settings")
    .select("timezone")
    .eq("id", true)
    .maybeSingle();

  const settingsError = classifyError(settingsResult.error);
  if (settingsError) return settingsError;

  const settings = settingsResult.data as { timezone: string | null } | null;
  const timezone = settings?.timezone ?? "UTC";
  const statusFilter = readFollowUpStatusFilter(options.status);

  let followUpsQuery = supabase
    .from("follow_ups")
    .select("id, due_at, reminder_hours, status, notes, patient_id")
    .order("due_at", { ascending: true })
    .limit(100);

  if (statusFilter !== "all") {
    followUpsQuery = followUpsQuery.eq("status", statusFilter);
  }

  const followUpsResult = await followUpsQuery;

  const queryError = classifyError(followUpsResult.error);
  if (queryError) return queryError;

  const rows = (followUpsResult.data ?? []) as ManagedFollowUpRow[];
  const patientIds = Array.from(new Set(rows.map((row) => row.patient_id)));

  let patients: ManagedPatientRow[] = [];

  if (patientIds.length > 0) {
    const patientsResult = await supabase
      .from("patients")
      .select("id, full_name, reference, phone")
      .in("id", patientIds);

    const patientsError = classifyError(patientsResult.error);
    if (patientsError) return patientsError;

    patients = (patientsResult.data ?? []) as ManagedPatientRow[];
  }

  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const dueDateTimeLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  });

  const followUps: ManagedFollowUp[] = rows.map((row) => {
    const patient = patientMap.get(row.patient_id);
    const dueAt = new Date(row.due_at);
    const status = FOLLOW_UP_STATUSES.includes(row.status as (typeof FOLLOW_UP_STATUSES)[number])
      ? (row.status as ManagedFollowUp["status"])
      : "scheduled";
    const open = status === "scheduled" || status === "sent";

    return {
      id: row.id,
      patientName: patient?.full_name ?? "Patient record unavailable",
      patientReference: patient?.reference ?? "Patient reference unavailable",
      patientPhone: patient?.phone ?? "Phone not available",
      dueAt: row.due_at,
      dueLabel: dueDateTimeLabel.format(dueAt),
      time: formatTimeInZone(row.due_at, timezone),
      reminderHours: row.reminder_hours,
      status,
      notes: row.notes,
      overdue: open && dueAt.getTime() < now.getTime(),
    };
  });

  return {
    status: "ok",
    timezone,
    timezoneConfigured: Boolean(settings?.timezone),
    statusFilter,
    followUps,
  };
}
