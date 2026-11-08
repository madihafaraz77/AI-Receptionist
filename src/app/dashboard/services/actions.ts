"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditEvent } from "@/lib/audit";
import { CLINIC_CONTENT_TAG } from "@/lib/clinic/data";
import { parseServiceForm, type FieldErrors } from "@/lib/clinic/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ServiceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialServiceState: ServiceActionState = { status: "idle" };

const GENERIC_ERROR =
  "The service could not be saved. Please try again, or check the server logs if the problem continues.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDuplicateSlug(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23505" ||
    /duplicate key.*slug|services_slug_key/i.test(error.message ?? "")
  );
}

function servicePayload(values: {
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  feePkr: number;
  mode: "in_person" | "online";
  isActive: boolean;
  sortOrder: number;
}) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description,
    duration_minutes: values.durationMinutes,
    fee_pkr: values.feePkr,
    mode: values.mode,
    is_active: values.isActive,
    sort_order: values.sortOrder,
  };
}

export async function createServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to continue.",
    };
  }

  if (user.role !== "doctor") {
    return {
      status: "error",
      message: "Only the doctor account can manage services.",
    };
  }

  const parsed = parseServiceForm(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      errors: parsed.errors,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Supabase is not configured. Add the project keys and restart the app.",
    };
  }

  const { data: after, error } = await supabase
    .from("services")
    .insert(servicePayload(parsed.data))
    .select("*")
    .single();

  if (error) {
    if (isDuplicateSlug(error)) {
      return {
        status: "error",
        message: "Check the highlighted fields and try again.",
        errors: {
          slug: "That slug is already used by another service.",
        },
      };
    }

    console.error("[services] create failed", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "42501") {
      return {
        status: "error",
        message: "Only the doctor account can manage services.",
      };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  await writeAuditEvent({
    action: "service.created",
    actorId: user.id,
    actorType: "doctor",
    tableName: "services",
    recordId: after?.id ?? null,
    after,
  });

  updateTag(CLINIC_CONTENT_TAG);
  revalidatePath("/dashboard/services");
  revalidatePath("/");

  return {
    status: "success",
    message: `${parsed.data.name} was added to the service catalogue.`,
  };
}

export async function updateServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to continue.",
    };
  }

  if (user.role !== "doctor") {
    return {
      status: "error",
      message: "Only the doctor account can manage services.",
    };
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!UUID_PATTERN.test(id)) {
    return { status: "error", message: "That service could not be found." };
  }

  const parsed = parseServiceForm(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      errors: parsed.errors,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Supabase is not configured. Add the project keys and restart the app.",
    };
  }

  const { data: before, error: readError } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("[services] could not read the current row", {
      code: readError.code,
      message: readError.message,
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  if (!before) {
    return { status: "error", message: "That service could not be found." };
  }

  const { data: after, error } = await supabase
    .from("services")
    .update(servicePayload(parsed.data))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isDuplicateSlug(error)) {
      return {
        status: "error",
        message: "Check the highlighted fields and try again.",
        errors: {
          slug: "That slug is already used by another service.",
        },
      };
    }

    console.error("[services] update failed", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "42501") {
      return {
        status: "error",
        message: "Only the doctor account can manage services.",
      };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  if (!after) {
    return { status: "error", message: "That service could not be found." };
  }

  await writeAuditEvent({
    action: "service.updated",
    actorId: user.id,
    actorType: "doctor",
    tableName: "services",
    recordId: id,
    before,
    after,
  });

  updateTag(CLINIC_CONTENT_TAG);
  revalidatePath("/dashboard/services");
  revalidatePath("/");

  return {
    status: "success",
    message: after.is_active
      ? `${parsed.data.name} was updated.`
      : `${parsed.data.name} was updated and is now hidden from the public website.`,
  };
}
