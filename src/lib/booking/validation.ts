/**
 * Framework-free validation for the public booking Server Actions.
 *
 * The browser may disable fields, but it never decides whether a value is
 * valid. The server re-reads everything from the database.
 */

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors };

export type SlotRequest = {
  serviceId: string;
  appointmentDate: string;
};

export type BookingDetails = SlotRequest & {
  startTime: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED = /^[0-9+()\-.\s]{7,40}$/;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function isCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateServiceAndDate(
  serviceId: string,
  appointmentDate: string,
  errors: FieldErrors,
): void {
  if (!UUID_PATTERN.test(serviceId)) {
    errors.serviceId = "Choose a consultation service.";
  }

  if (!isCalendarDate(appointmentDate)) {
    errors.appointmentDate = "Choose a valid appointment date.";
  }
}

export function parseSlotRequestForm(
  formData: FormData,
): ValidationResult<SlotRequest> {
  const serviceId = readText(formData, "serviceId");
  const appointmentDate = readText(formData, "appointmentDate");
  const errors: FieldErrors = {};

  validateServiceAndDate(serviceId, appointmentDate, errors);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: { serviceId, appointmentDate } };
}

export function parseBookingDetailsForm(
  formData: FormData,
): ValidationResult<BookingDetails> {
  const serviceId = readText(formData, "serviceId");
  const appointmentDate = readText(formData, "appointmentDate");
  const startTime = readText(formData, "startTime");
  const fullName = readText(formData, "fullName");
  const phone = readText(formData, "phone");
  const email = readOptionalText(formData, "email");
  const notes = readOptionalText(formData, "notes");
  const errors: FieldErrors = {};

  validateServiceAndDate(serviceId, appointmentDate, errors);

  if (!TIME_PATTERN.test(startTime)) {
    errors.startTime = "Choose an available appointment time.";
  }

  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = "Enter a full name between 2 and 120 characters.";
  }

  if (!PHONE_ALLOWED.test(phone)) {
    errors.phone =
      "Enter a phone number using digits, spaces, +, -, ( or ).";
  } else if (normalizePhone(phone).length < 7 || normalizePhone(phone).length > 15) {
    errors.phone = "Enter 7 to 15 digits for the phone number.";
  }

  if (email !== null && (!EMAIL_PATTERN.test(email) || email.length > 200)) {
    errors.email = "Enter a valid email address.";
  }

  if (notes !== null && notes.length > 500) {
    errors.notes = "Keep notes to 500 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      serviceId,
      appointmentDate,
      startTime,
      fullName,
      phone,
      email,
      notes,
    },
  };
}
