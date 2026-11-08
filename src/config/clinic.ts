/**
 * Central clinic configuration.
 *
 * IMPORTANT: These values are the confirmed launch defaults for the MVP.
 * In Milestone 3 this object becomes the seed/fallback for clinic_settings
 * in Supabase. The database will be the source of truth; the dashboard will
 * edit those records. Nothing else in the app should hardcode clinic details.
 *
 * Values that the clinic owner has NOT supplied (address, phone, email,
 * doctor name, timezone) are intentionally `null`. Do not invent them.
 */

export type ConsultationMode = "in_person" | "online";

export type ClinicService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  feePkr: number;
  mode: ConsultationMode;
};

export type Weekday = {
  /** ISO weekday: 1 = Monday, 7 = Sunday */
  value: number;
  short: string;
  long: string;
};

export const WEEKDAYS: Weekday[] = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 7, short: "Sun", long: "Sunday" },
];

export type NotificationChannel = "dashboard" | "email" | "whatsapp";

export type ClinicConfig = {
  name: string;
  shortName: string;
  description: string;
  openingTime: string;
  closingTime: string;
  appointmentDurationMinutes: number;
  dailyCapacity: number;
  workingWeekdays: number[];
  bookingApproval: "automatic" | "manual";
  walkInsEnabled: boolean;
  consultationFeePkr: number;
  onlineConsultationEnabled: boolean;
  followUpReminderHours: number;
  aiEscalationChannels: NotificationChannel[];
  notificationChannels: NotificationChannel[];
  timezone: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  doctorName: string | null;
};

export const clinicConfig: ClinicConfig = {
  name: "Nissa Homeopathic Clinic",
  shortName: "Nissa",
  /** A short, non-clinical description used in navigation and metadata. */
  description:
    "Considered homeopathic care with a calm, modern clinic experience — in person and online.",

  // ---------------------------------------------------------------------------
  // Schedule (confirmed)
  // ---------------------------------------------------------------------------
  openingTime: "11:00",
  closingTime: "17:00",
  appointmentDurationMinutes: 45,
  dailyCapacity: 8,
  workingWeekdays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
  bookingApproval: "automatic",
  walkInsEnabled: false,

  // ---------------------------------------------------------------------------
  // Consultations (confirmed)
  // ---------------------------------------------------------------------------
  consultationFeePkr: 500,
  onlineConsultationEnabled: true,
  followUpReminderHours: 24,

  // ---------------------------------------------------------------------------
  // Notifications & AI (confirmed defaults)
  // ---------------------------------------------------------------------------
  aiEscalationChannels: ["dashboard", "email", "whatsapp"],
  notificationChannels: ["dashboard", "email", "whatsapp"],

  // ---------------------------------------------------------------------------
  // Not supplied yet — configure in Clinic Settings (Milestone 3)
  // ---------------------------------------------------------------------------
  timezone: null,
  address: null,
  phone: null,
  email: null,
  doctorName: null,
};

/**
 * Launch service catalogue. Services become database-managed in Milestone 3.
 * These descriptions are deliberately factual and make no medical claims.
 */
export const defaultServices: ClinicService[] = [
  {
    id: "homeopathic-consultation",
    name: "Homeopathic Consultation",
    description:
      "A 45-minute in-person visit with the doctor to discuss your concerns, history and a personalised plan for your care.",
    durationMinutes: 45,
    feePkr: 500,
    mode: "in_person",
  },
  {
    id: "online-consultation",
    name: "Online Consultation",
    description:
      "A 45-minute consultation for patients who prefer to speak with the doctor from home. Availability is confirmed when you book.",
    durationMinutes: 45,
    feePkr: 500,
    mode: "online",
  },
  {
    id: "follow-up-consultation",
    name: "Follow-up Consultation",
    description:
      "A 45-minute review for existing patients to discuss progress, ongoing concerns and next steps with the doctor.",
    durationMinutes: 45,
    feePkr: 500,
    mode: "in_person",
  },
];

export function workingWeekdayLabelsFor(days: number[]): Weekday[] {
  return WEEKDAYS.filter((day) => days.includes(day.value));
}

function isConsecutiveWeekdays(days: Weekday[]): boolean {
  return days.every(
    (day, index) => index === 0 || day.value === days[index - 1].value + 1,
  );
}

/**
 * Human summary of the working week for any settings object. The public pages
 * use this with database values; the exported constant below uses the confirmed
 * launch defaults.
 */
export function workingWeekdaySummaryFor(days: number[]): string {
  const labels = workingWeekdayLabelsFor(days);

  if (labels.length === 0) return "No working days configured";
  if (labels.length === 7) return "Every day";
  if (labels.length === 1) return labels[0].short;

  if (isConsecutiveWeekdays(labels)) {
    return `${labels[0].short} – ${labels.at(-1)!.short}`;
  }

  return labels.map((day) => day.short).join(", ");
}

export const workingWeekdayLabels = workingWeekdayLabelsFor(
  clinicConfig.workingWeekdays,
);

export const workingWeekdaySummary = workingWeekdaySummaryFor(
  clinicConfig.workingWeekdays,
);

/** Formats a 24-hour "HH:mm" value as a friendly 12-hour time. */
export function formatClinicTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Clinic hours summary for any settings object. */
export function clinicHoursLabelFor(
  settings: Pick<ClinicConfig, "openingTime" | "closingTime">,
): string {
  return `${formatClinicTime(settings.openingTime)} – ${formatClinicTime(
    settings.closingTime,
  )}`;
}

export const clinicHoursLabel = clinicHoursLabelFor(clinicConfig);

export function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}
