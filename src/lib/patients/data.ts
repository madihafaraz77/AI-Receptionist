import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  PatientAttachment,
  PatientSummary,
  PatientsData,
} from "./types";

type PatientRow = {
  id: string;
  reference: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  admin_notes: string | null;
};

type AttachmentRow = {
  id: string;
  patient_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
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

  console.error("[patients] Supabase query failed", {
    code: error.code,
    message,
  });

  return { status: "error" };
}

function mapRow(row: PatientRow): PatientSummary {
  return {
    id: row.id,
    reference: row.reference,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    adminNotes: row.admin_notes,
  };
}

/**
 * Loads patient list and attachment metadata. Attachment objects remain in the
 * private bucket; short-lived signed URLs are generated only for authenticated
 * clinic users and never embedded in public output.
 */
export async function getPatients(query: string): Promise<PatientsData> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const trimmed = query.trim().slice(0, 80);
  let patientsQuery = supabase
    .from("patients")
    .select(
      "id, reference, full_name, phone, email, date_of_birth, gender, address, admin_notes",
    )
    .order("full_name", { ascending: true })
    .limit(100);

  if (trimmed) {
    patientsQuery = patientsQuery.or(
      `full_name.ilike.%${trimmed}%,reference.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`,
    );
  }

  const patientsResult = await patientsQuery;

  const patientsError = classifyError(patientsResult.error);
  if (patientsError) return patientsError;

  const patients = ((patientsResult.data ?? []) as PatientRow[]).map(mapRow);
  let attachments: PatientAttachment[] = [];

  const patientIds = patients.map((patient) => patient.id);

  if (patientIds.length > 0) {
    const attachmentsResult = await supabase
      .from("patient_attachments")
      .select("id, patient_id, storage_path, file_name, mime_type, size_bytes")
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    const attachmentsError = classifyError(attachmentsResult.error);
    if (attachmentsError) return attachmentsError;

    const rows = (attachmentsResult.data ?? []) as AttachmentRow[];
    const config = getSupabaseConfig();

    if (config?.secretKey) {
      const admin = createSupabaseAdminClient();

      attachments = await Promise.all(
        rows.map(async (row) => {
          const { data } = await admin.storage
            .from("patient-attachments")
            .createSignedUrl(row.storage_path, 60 * 15);

          return {
            id: row.id,
            patientId: row.patient_id,
            fileName: row.file_name,
            mimeType: row.mime_type,
            sizeBytes: row.size_bytes,
            storagePath: row.storage_path,
            signedUrl: data?.signedUrl ?? null,
          };
        }),
      );
    } else {
      attachments = rows.map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        fileName: row.file_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        storagePath: row.storage_path,
        signedUrl: null,
      }));
    }
  }

  return {
    status: "ok",
    patients,
    attachments,
    query: trimmed,
  };
}
