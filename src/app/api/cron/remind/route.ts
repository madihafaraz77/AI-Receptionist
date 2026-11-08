import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorised cron request" },
      { status: 401 },
    );
  }

  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase secret key is not configured" },
      { status: 503 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: settings } = await admin
    .from("clinic_settings")
    .select("timezone, follow_up_reminder_hours")
    .eq("id", true)
    .maybeSingle();

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: followUps, error } = await admin
    .from("follow_ups")
    .select("id, patient_id, due_at, reminder_hours")
    .eq("status", "scheduled")
    .lte("due_at", horizon.toISOString())
    .order("due_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[cron/remind] could not read follow-ups", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { ok: false, error: "Reminder lookup failed" },
      { status: 500 },
    );
  }

  const patientIds = Array.from(
    new Set((followUps ?? []).map((row) => row.patient_id)),
  );
  let patientMap = new Map<
    string,
    { full_name: string; reference: string; phone: string }
  >();

  if (patientIds.length > 0) {
    const { data: patients, error: patientsError } = await admin
      .from("patients")
      .select("id, full_name, reference, phone")
      .in("id", patientIds);

    if (patientsError) {
      console.error("[cron/remind] could not read patients", {
        code: patientsError.code,
        message: patientsError.message,
      });
      return NextResponse.json(
        { ok: false, error: "Patient lookup failed" },
        { status: 500 },
      );
    }

    patientMap = new Map(
      (patients ?? []).map((patient) => [
        patient.id,
        {
          full_name: patient.full_name,
          reference: patient.reference,
          phone: patient.phone,
        },
      ]),
    );
  }

  let created = 0;

  for (const followUp of followUps ?? []) {
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("template", "follow_up_reminder")
      .eq("related_table", "follow_ups")
      .eq("related_id", followUp.id)
      .limit(1);

    if (existing && existing.length > 0) {
      continue;
    }

    const patient = patientMap.get(followUp.patient_id);

    if (!patient) {
      continue;
    }

    const dueAt = new Date(followUp.due_at);
    const hoursUntil = Math.max(
      0,
      Math.floor((dueAt.getTime() - now.getTime()) / (60 * 60 * 1000)),
    );

    const { error: insertError } = await admin.from("notifications").insert({
      channel: "dashboard",
      recipient: patient.reference,
      template: "follow_up_reminder",
      payload: {
        title: "Follow-up reminder",
        detail: `${patient.full_name} follow-up is due in ${hoursUntil} hour${hoursUntil === 1 ? "" : "s"}.`,
        patient_reference: patient.reference,
        due_at: followUp.due_at,
        timezone: settings?.timezone ?? null,
      },
      status: "queued",
      related_table: "follow_ups",
      related_id: followUp.id,
    });

    if (insertError) {
      console.error("[cron/remind] could not create reminder notification", {
        followUpId: followUp.id,
        code: insertError.code,
        message: insertError.message,
      });
    } else {
      created += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    checked: followUps?.length ?? 0,
  });
}
