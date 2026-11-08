import {
  clinicConfig,
  type ClinicService,
  type NotificationChannel,
} from "@/config/clinic";

import type { ClinicServiceRecord, ClinicSettings } from "./types";

/** A `public.clinic_settings` row as PostgREST returns it. */
export type ClinicSettingsRow = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  doctor_name: string | null;
  opening_time: string;
  closing_time: string;
  appointment_duration_minutes: number;
  daily_capacity: number;
  working_weekdays: number[];
  booking_approval: "automatic" | "manual";
  walk_ins_enabled: boolean;
  consultation_fee_pkr: number;
  online_consultation_enabled: boolean;
  follow_up_reminder_hours: number;
  ai_escalation_channels: string[];
  notification_channels: string[];
  updated_at: string;
};

/** A `public.services` row as PostgREST returns it. */
export type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_minutes: number;
  fee_pkr: number;
  mode: "in_person" | "online";
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  "dashboard",
  "email",
  "whatsapp",
];

function asChannels(values: string[] | null | undefined): NotificationChannel[] {
  const filtered = (values ?? []).filter((value): value is NotificationChannel =>
    NOTIFICATION_CHANNELS.includes(value as NotificationChannel),
  );

  return filtered.length > 0 ? filtered : [...clinicConfig.notificationChannels];
}

/** Postgres `time` values arrive as `HH:MM:SS`; the UI only needs `HH:MM`. */
function asShortTime(value: string): string {
  return value.slice(0, 5);
}

/** The default settings used when no database value is available. */
export function fallbackClinicSettings(): ClinicSettings {
  return { ...clinicConfig, updatedAt: null };
}

export function mapClinicSettingsRow(row: ClinicSettingsRow): ClinicSettings {
  return {
    // Identity fields that are not stored in the database keep their confirmed
    // defaults from the central config.
    shortName: clinicConfig.shortName,
    description: clinicConfig.description,

    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    timezone: row.timezone,
    doctorName: row.doctor_name,
    openingTime: asShortTime(row.opening_time),
    closingTime: asShortTime(row.closing_time),
    appointmentDurationMinutes: row.appointment_duration_minutes,
    dailyCapacity: row.daily_capacity,
    workingWeekdays: [...row.working_weekdays].sort((a, b) => a - b),
    bookingApproval: row.booking_approval,
    walkInsEnabled: row.walk_ins_enabled,
    consultationFeePkr: row.consultation_fee_pkr,
    onlineConsultationEnabled: row.online_consultation_enabled,
    followUpReminderHours: row.follow_up_reminder_hours,
    aiEscalationChannels: asChannels(row.ai_escalation_channels),
    notificationChannels: asChannels(row.notification_channels),
    updatedAt: row.updated_at,
  };
}

export function mapServiceRow(row: ServiceRow): ClinicServiceRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    feePkr: row.fee_pkr,
    mode: row.mode,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

/** Drops internal fields before a service is shown on the public website. */
export function toPublicService(service: ClinicServiceRecord): ClinicService {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    feePkr: service.feePkr,
    mode: service.mode,
  };
}
