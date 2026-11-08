import type { ConsultationMode } from "@/config/clinic";

/**
 * Server-side validation for the clinic settings and services forms.
 *
 * These functions are pure and framework-free so they can be unit tested. The
 * dashboard calls them inside Server Actions; the browser never decides whether
 * a value is acceptable.
 */

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors };

export type ClinicSettingsInput = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  doctorName: string | null;
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
};

export type ServiceInput = {
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  feePkr: number;
  mode: ConsultationMode;
  isActive: boolean;
  sortOrder: number;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHONE_PATTERN = /^[0-9+()\-.\s]{5,40}$/;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readChecked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function readNumber(formData: FormData, key: string): number | null {
  const raw = readText(formData, key);
  if (raw.length === 0) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function isInteger(value: number | null): value is number {
  return value !== null && Number.isInteger(value);
}

function minutesFromTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function validateName(
  errors: FieldErrors,
  field: string,
  label: string,
  value: string,
  min: number,
  max: number,
): void {
  if (value.length < min || value.length > max) {
    errors[field] = `${label} must be between ${min} and ${max} characters.`;
  }
}

function validateOptionalLength(
  errors: FieldErrors,
  field: string,
  label: string,
  value: string | null,
  max: number,
): void {
  if (value !== null && value.length > max) {
    errors[field] = `${label} must be ${max} characters or fewer.`;
  }
}

export function parseClinicSettingsForm(
  formData: FormData,
): ValidationResult<ClinicSettingsInput> {
  const errors: FieldErrors = {};

  const name = readText(formData, "name");
  validateName(errors, "name", "Clinic name", name, 2, 120);

  const doctorName = readOptionalText(formData, "doctorName");
  validateOptionalLength(errors, "doctorName", "Doctor name", doctorName, 120);

  const address = readOptionalText(formData, "address");
  validateOptionalLength(errors, "address", "Address", address, 300);

  const phone = readOptionalText(formData, "phone");
  validateOptionalLength(errors, "phone", "Phone number", phone, 40);
  if (phone !== null && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a phone number using digits, spaces, +, -, ( or ).";
  }

  const email = readOptionalText(formData, "email");
  validateOptionalLength(errors, "email", "Email address", email, 200);
  if (email !== null && !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const timezone = readOptionalText(formData, "timezone");
  validateOptionalLength(errors, "timezone", "Timezone", timezone, 64);
  if (timezone !== null && !isValidTimeZone(timezone)) {
    errors.timezone =
      "Enter a valid IANA timezone, for example Asia/Karachi.";
  }

  const openingTime = readText(formData, "openingTime");
  const closingTime = readText(formData, "closingTime");

  if (!TIME_PATTERN.test(openingTime)) {
    errors.openingTime = "Enter an opening time in 24-hour HH:MM format.";
  }

  if (!TIME_PATTERN.test(closingTime)) {
    errors.closingTime = "Enter a closing time in 24-hour HH:MM format.";
  }

  if (
    !errors.openingTime &&
    !errors.closingTime &&
    minutesFromTime(closingTime) <= minutesFromTime(openingTime)
  ) {
    errors.closingTime = "Closing time must be after opening time.";
  }

  const appointmentDurationMinutes = readNumber(
    formData,
    "appointmentDurationMinutes",
  );
  if (
    !isInteger(appointmentDurationMinutes) ||
    appointmentDurationMinutes < 5 ||
    appointmentDurationMinutes > 240
  ) {
    errors.appointmentDurationMinutes =
      "Appointment length must be a whole number between 5 and 240 minutes.";
  } else if (
    !errors.openingTime &&
    !errors.closingTime &&
    appointmentDurationMinutes >
      minutesFromTime(closingTime) - minutesFromTime(openingTime)
  ) {
    errors.appointmentDurationMinutes =
      "Appointment length cannot be longer than the clinic's opening window.";
  }

  const dailyCapacity = readNumber(formData, "dailyCapacity");
  if (!isInteger(dailyCapacity) || dailyCapacity < 1 || dailyCapacity > 100) {
    errors.dailyCapacity =
      "Daily capacity must be a whole number between 1 and 100.";
  }

  const workingWeekdays = Array.from(
    new Set(
      formData
        .getAll("workingWeekdays")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 7),
    ),
  ).sort((a, b) => a - b);

  if (workingWeekdays.length === 0) {
    errors.workingWeekdays = "Choose at least one working day.";
  }

  const bookingApproval = readText(formData, "bookingApproval");
  if (bookingApproval !== "automatic" && bookingApproval !== "manual") {
    errors.bookingApproval = "Choose a valid booking approval mode.";
  }

  const consultationFeePkr = readNumber(formData, "consultationFeePkr");
  if (
    !isInteger(consultationFeePkr) ||
    consultationFeePkr < 0 ||
    consultationFeePkr > 1_000_000
  ) {
    errors.consultationFeePkr =
      "Consultation fee must be a whole number between 0 and 1,000,000.";
  }

  const followUpReminderHours = readNumber(formData, "followUpReminderHours");
  if (
    !isInteger(followUpReminderHours) ||
    followUpReminderHours < 1 ||
    followUpReminderHours > 720
  ) {
    errors.followUpReminderHours =
      "Follow-up reminder must be a whole number between 1 and 720 hours.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      address,
      phone,
      email,
      timezone,
      doctorName,
      openingTime: openingTime as string,
      closingTime: closingTime as string,
      appointmentDurationMinutes: appointmentDurationMinutes as number,
      dailyCapacity: dailyCapacity as number,
      workingWeekdays,
      bookingApproval: bookingApproval as "automatic" | "manual",
      walkInsEnabled: readChecked(formData, "walkInsEnabled"),
      consultationFeePkr: consultationFeePkr as number,
      onlineConsultationEnabled: readChecked(
        formData,
        "onlineConsultationEnabled",
      ),
      followUpReminderHours: followUpReminderHours as number,
    },
  };
}

export function parseServiceForm(formData: FormData): ValidationResult<ServiceInput> {
  const errors: FieldErrors = {};

  const name = readText(formData, "name");
  validateName(errors, "name", "Service name", name, 2, 120);

  const slug = readText(formData, "slug").toLowerCase();
  if (!SLUG_PATTERN.test(slug) || slug.length < 2 || slug.length > 80) {
    errors.slug =
      "Use a short lowercase slug, for example follow-up-consultation.";
  }

  const description = readText(formData, "description");
  if (description.length < 10 || description.length > 600) {
    errors.description =
      "Description must be between 10 and 600 characters. Keep it factual and avoid medical claims.";
  }

  const durationMinutes = readNumber(formData, "durationMinutes");
  if (
    !isInteger(durationMinutes) ||
    durationMinutes < 5 ||
    durationMinutes > 240
  ) {
    errors.durationMinutes =
      "Duration must be a whole number between 5 and 240 minutes.";
  }

  const feePkr = readNumber(formData, "feePkr");
  if (!isInteger(feePkr) || feePkr < 0 || feePkr > 1_000_000) {
    errors.feePkr = "Fee must be a whole number between 0 and 1,000,000.";
  }

  const mode = readText(formData, "mode");
  if (mode !== "in_person" && mode !== "online") {
    errors.mode = "Choose a valid consultation mode.";
  }

  const sortOrder = readNumber(formData, "sortOrder");
  if (!isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999) {
    errors.sortOrder =
      "Sort order must be a whole number between 0 and 999.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      description,
      durationMinutes: durationMinutes as number,
      feePkr: feePkr as number,
      mode: mode as ConsultationMode,
      isActive: readChecked(formData, "isActive"),
      sortOrder: sortOrder as number,
    },
  };
}
