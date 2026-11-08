import type { Route } from "next";
import {
  Bot,
  CalendarDays,
  CalendarCheck2,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  Settings2,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PublicNavItem = {
  label: string;
  href: Route;
};

export type DashboardNavItem = {
  label: string;
  href: Route;
  icon: LucideIcon;
  description: string;
  /** Milestone in which the module becomes functional. */
  milestone: number;
  badge?: string;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export const publicNavigation: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "AI Receptionist", href: "/ai-receptionist" },
  { label: "Contact", href: "/contact" },
];

export const dashboardNavigation: DashboardNavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Today at a glance",
        milestone: 1,
      },
      {
        label: "Appointments",
        href: "/dashboard/appointments",
        icon: CalendarDays,
        description: "Calendar, booking and capacity",
        milestone: 5,
      },
      {
        label: "Patients",
        href: "/dashboard/patients",
        icon: Users,
        description: "Profiles, history and attachments",
        milestone: 6,
      },
    ],
  },
  {
    label: "Clinical care",
    items: [
      {
        label: "Consultations",
        href: "/dashboard/consultations",
        icon: Stethoscope,
        description: "Notes, prescriptions and progress",
        milestone: 6,
      },
      {
        label: "Follow-ups",
        href: "/dashboard/follow-ups",
        icon: CalendarCheck2,
        description: "Reviews and 24-hour reminders",
        milestone: 6,
      },
    ],
  },
  {
    label: "Engagement",
    items: [
      {
        label: "AI Receptionist",
        href: "/dashboard/ai-receptionist",
        icon: Bot,
        description: "Conversations and human handover",
        milestone: 8,
        badge: "1",
      },
      {
        label: "Patient Feedback",
        href: "/dashboard/feedback",
        icon: MessageSquareText,
        description: "Review and respond to feedback",
        milestone: 9,
      },
    ],
  },
  {
    label: "Clinic",
    items: [
      {
        label: "Clinic Settings",
        href: "/dashboard/settings",
        icon: Settings2,
        description: "Hours, capacity, fees and policies",
        milestone: 3,
      },
      {
        label: "Services",
        href: "/dashboard/services",
        icon: ClipboardList,
        description: "Catalogue, fees and availability",
        milestone: 3,
      },
    ],
  },
];

export const secondaryDashboardLinks: PublicNavItem[] = [
  { label: "Public website", href: "/" },
  { label: "AI receptionist page", href: "/ai-receptionist" },
];

export const dashboardQuickActions = [
  {
    label: "New appointment",
    href: "/dashboard/appointments" as Route,
    icon: CalendarDays,
  },
  {
    label: "Add patient",
    href: "/dashboard/patients" as Route,
    icon: Users,
  },
  {
    label: "Open AI inbox",
    href: "/dashboard/ai-receptionist" as Route,
    icon: Bot,
  },
  {
    label: "Record consultation",
    href: "/dashboard/consultations" as Route,
    icon: ClipboardList,
  },
];
