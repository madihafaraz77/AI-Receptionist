"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditEvent } from "@/lib/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

import type { PatientActionState } from "./action-state";

const GENERIC_ERROR =
  "The patient could not be saved. Please try again or check the server logs.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED = /^[0-9+()\-.\s]{7,40}$/;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function isDateKey(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

async function requireClinicUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false as const,
      message: "Your session has expired. Sign in again to continue.",
    };
  }

  if (user.role !== "doctor" && user.role !== "staff") {
    return {
      ok: false as const,
      message: "Only an active clinic user can manage patients.",
    };
  }

  return { ok: true as const, user };
}

export async function createPatientAction(
  _previousState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const authorised = await requireClinicUser();

  if (!authorised.ok) {
    return { status: "error", message: authorised.message };
  }

  const fullName = readText(formData, "fullName");
  const phone = readText(formData, "phone");
  const email = readOptionalText(formData, "email");
  const dateOfBirth = readOptionalText(formData, "dateOfBirth");
  const gender = readOptionalText(formData, "gender");
  const address = readOptionalText(formData, "address");
  const adminNotes = readOptionalText(formData, "adminNotes");

  if (fullName.length < 2 || fullName.length > 120) {
    return {
      status: "error",
      message: "Enter the patient's full name (2–120 characters).",
    };
  }

  if (!PHONE_ALLOWED.test(phone) || normalizePhone(phone).length > 15) {
    return {
      status: "error",
      message: "Enter a valid phone number, including country and city.",
    };
  }

  if (normalizePhone(phone).length < 7) {
    return {
      status: "error",
      message: "Enter 7 to 15 digits for the phone number.",
    };
  }

  if (email && (!EMAIL_PATTERN.test(email) || email.length > 200)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  if (dateOfBirth && !isDateKey(dateOfBirth)) {
    return { status: "error", message: "Enter a valid date of birth." };
  }

  if (address && address.length > 300) {
    return { status: "error", message: "Keep the address to 300 characters." };
  }

  if (adminNotes && adminNotes.length > 500) {
    return {
      status: "error",
      message: "Keep non-clinical notes to 500 characters.",
    };
  }

  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    return {
      status: "error",
      message:
        "Patient creation needs the server-side Supabase secret key. Add it and restart the app.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("create_patient_record", {
    p_full_name: fullName,
    p_phone: phone,
    p_email: email,
    p_date_of_birth: dateOfBirth,
    p_gender: gender,
    p_address: address,
    p_admin_notes: adminNotes,
    p_created_by: authorised.user.id,
  });

  if (error) {
    console.error("[patients] create failed", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "42501" || error.message?.includes("ACTOR_NOT_ALLOWED")) {
      return {
        status: "error",
        message: "Only an active doctor or staff member can create patient records.",
      };
    }

    if (error.message?.includes("INVALID_PHONE")) {
      return { status: "error", message: "Enter 7 to 15 digits for the phone number." };
    }

    if (error.message?.includes("INVALID_EMAIL")) {
      return { status: "error", message: "Enter a valid email address." };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  const reference =
    typeof (data as { reference?: string } | null)?.reference === "string"
      ? (data as { reference: string }).reference
      : "NIS-UNKNOWN";

  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Patient record created (${reference}).`,
  };
}

export async function uploadPatientAttachmentAction(
  _previousState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const authorised = await requireClinicUser();

  if (!authorised.ok) {
    return { status: "error", message: authorised.message };
  }

  const patientId = readText(formData, "patientId");
  const file = formData.get("attachment");

  if (!UUID_PATTERN.test(patientId)) {
    return { status: "error", message: "That patient could not be found." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a PDF or image to upload." };
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return {
      status: "error",
      message: "Attachments must be PDF, JPEG, PNG or WebP.",
    };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      status: "error",
      message: "Attachments must be 10 MB or smaller.",
    };
  }

  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    return {
      status: "error",
      message:
        "Attachment upload needs the server-side Supabase secret key. Add it and restart the app.",
    };
  }

  const extension =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp";
  const storagePath = `${patientId}/${crypto.randomUUID()}.${extension}`;
  const admin = createSupabaseAdminClient();
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from("patient-attachments")
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[patients/attachments] storage upload failed", {
      code: uploadError.name,
      message: uploadError.message,
    });
    return {
      status: "error",
      message: "The file could not be uploaded. Try again with a smaller file.",
    };
  }

  const { data: attachment, error: insertError } = await admin
    .from("patient_attachments")
    .insert({
      patient_id: patientId,
      storage_path: storagePath,
      file_name: file.name.slice(0, 255),
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: authorised.user.id,
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("[patients/attachments] metadata insert failed", {
      code: insertError.code,
      message: insertError.message,
    });
    await admin.storage.from("patient-attachments").remove([storagePath]);
    return {
      status: "error",
      message: "The file could not be recorded. Nothing was saved.",
    };
  }

  await writeAuditEvent({
    action: "patient_attachment.uploaded",
    actorId: authorised.user.id,
    actorType: authorised.user.role,
    tableName: "patient_attachments",
    recordId: attachment?.id ?? null,
    after: attachment,
  });

  revalidatePath("/dashboard/patients");

  return {
    status: "success",
    message: `${file.name} attached to the private patient record.`,
  };
}
