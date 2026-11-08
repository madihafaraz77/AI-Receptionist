/**
 * Dashboard view models.
 *
 * These are the shapes the UI renders. They are deliberately narrow: database
 * rows and Supabase responses never reach Client Components directly.
 */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type AppointmentType = "in_person" | "online";

export type BookingSource = "website" | "ai_receptionist" | "staff";

export type NotificationChannel = "dashboard" | "email" | "whatsapp";

export type NotificationStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "not_connected";

export type DashboardAppointment = {
  id: string;
  time: string;
  patientName: string;
  patientReference: string;
  type: AppointmentType;
  status: AppointmentStatus;
  source: BookingSource;
  feePkr: number;
};

export type ManagedAppointment = {
  id: string;
  reference: string;
  time: string;
  endTime: string;
  patientName: string;
  patientReference: string;
  patientPhone: string;
  serviceName: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  source: BookingSource;
  feePkr: number;
  notes: string | null;
};

export type DashboardAppointmentsData =
  | {
      status: "ok";
      timezone: string;
      timezoneConfigured: boolean;
      selectedDate: string;
      statusFilter: AppointmentStatus | "all";
      appointments: ManagedAppointment[];
      capacityUsed: number;
      capacityTotal: number;
    }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };

export type ManagedFollowUp = {
  id: string;
  patientName: string;
  patientReference: string;
  patientPhone: string;
  dueAt: string;
  dueLabel: string;
  time: string;
  reminderHours: number;
  status: "scheduled" | "sent" | "completed" | "cancelled";
  notes: string | null;
  overdue: boolean;
};

export type AiConversationStatus =
  | "active"
  | "needs_human"
  | "handed_over"
  | "closed";

export type DashboardAiMessage = {
  id: string;
  role: "visitor" | "assistant" | "system" | "tool";
  content: string;
  safetyFlag: string | null;
  createdAtLabel: string;
};

export type DashboardAiConversation = {
  id: string;
  title: string;
  status: AiConversationStatus;
  channel: string;
  assignedTo: string | null;
  startedAtLabel: string;
  lastMessageAtLabel: string;
  messageCount: number;
  messages: DashboardAiMessage[];
};

export type DashboardAiInboxData =
  | {
      status: "ok";
      timezone: string;
      timezoneConfigured: boolean;
      statusFilter: AiConversationStatus | "all";
      conversations: DashboardAiConversation[];
    }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };

export type DashboardFollowUpsData =
  | {
      status: "ok";
      timezone: string;
      timezoneConfigured: boolean;
      statusFilter: ManagedFollowUp["status"] | "all";
      followUps: ManagedFollowUp[];
    }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };

export type DashboardFollowUp = {
  id: string;
  patientName: string;
  dueLabel: string;
  time: string;
  reminderStatus: "scheduled" | "sent";
};

export type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  timeLabel: string;
};

export type DashboardConversation = {
  id: string;
  patientName: string;
  summary: string;
  lastMessageAt: string;
};

export type DashboardStats = {
  todayAppointments: number;
  upcomingAppointments: number;
  registeredPatients: number;
  completedConsultations: number;
  capacityUsed: number;
  capacityTotal: number;
  aiConversationsNeedingAttention: number;
  pendingFeedback: number;
};

export type DashboardData =
  | {
      status: "ok";
      timezone: string;
      timezoneConfigured: boolean;
      appointmentDurationMinutes: number;
      stats: DashboardStats;
      appointments: DashboardAppointment[];
      followUps: DashboardFollowUp[];
      notifications: DashboardNotification[];
      conversations: DashboardConversation[];
    }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };
