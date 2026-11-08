import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import {
  clinicHoursLabelFor,
  formatPkr,
  workingWeekdaySummaryFor,
  type ClinicConfig,
} from "@/config/clinic";
import { publicNavigation } from "@/config/navigation";

export function SiteFooter({ settings }: { settings: ClinicConfig }) {
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);
  const contactDetails = [
    { icon: MapPin, value: settings.address },
    { icon: Phone, value: settings.phone },
    { icon: Mail, value: settings.email },
  ].filter(
    (detail): detail is { icon: LucideIcon; value: string } =>
      Boolean(detail.value),
  );

  return (
    <footer className="mt-auto bg-brand-deep text-primary-foreground">
      <div className="container-page grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div className="max-w-sm">
          <Logo href="/" tone="inverse" />
          <p className="mt-5 text-sm leading-6 text-primary-foreground/70">
            {settings.description}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1.5 text-xs text-primary-foreground/80">
            <Sparkles className="size-3.5" />
            {settings.onlineConsultationEnabled
              ? "Online consultations are available"
              : "In-person consultations"}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {publicNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/book"
                className="inline-flex items-center gap-1 text-primary-foreground/75 transition-colors hover:text-primary-foreground"
              >
                Book an appointment
                <ArrowUpRight className="size-3.5" />
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
            Visit
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
            <li className="flex items-start gap-2.5">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-primary-foreground/50" />
              <span>
                {weekdaySummary}
                <br />
                {hoursLabel}
              </span>
            </li>
            <li>
              {settings.appointmentDurationMinutes}-minute appointments
            </li>
            <li>{formatPkr(settings.consultationFeePkr)} consultation fee</li>
            <li>
              {settings.onlineConsultationEnabled
                ? "In-person and online"
                : "In-person only"}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
            Clinic details
          </h2>
          <div className="mt-4 flex items-start gap-2.5 text-sm text-primary-foreground/75">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary-foreground/50" />
            <div className="space-y-1.5">
              {contactDetails.length > 0 ? (
                contactDetails.map((detail) => (
                  <p
                    key={detail.value}
                    className="flex items-start gap-2 break-words"
                  >
                    <detail.icon className="mt-0.5 size-3.5 shrink-0" />
                    {detail.value}
                  </p>
                ))
              ) : (
                <p>
                  Address and contact details will be published once the clinic
                  owner configures them.
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-primary-foreground/45">
            {settings.bookingApproval === "automatic"
              ? "Booking approval is automatic."
              : "Bookings are reviewed by the clinic before they are confirmed."}{" "}
            {settings.walkInsEnabled
              ? "Walk-ins are accepted."
              : "Walk-ins are not available; please book ahead."}
          </p>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-primary-foreground/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {settings.name}. All rights reserved.</p>
          <p>AI receptionist and clinic management MVP</p>
        </div>
      </div>
    </footer>
  );
}
