/** Types mirroring backend Swagger schemas */

export type SessionChannel = "web" | "voice" | "api";
export type SessionStatus =
  | "initiated"
  | "collecting"
  | "confirmed"
  | "booked"
  | "failed";

export interface User {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  _id: string;
  userId?: string;
  channel: SessionChannel;
  userName?: string;
  email?: string;
  meetingTitle?: string;
  timezone?: string;
  proposedStart?: string;
  durationMinutes?: number;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStatus {
  confirmationEmail?: "pending" | "sent" | "skipped" | "failed";
  reminders?: "scheduled" | "skipped" | "failed";
}

export interface Event {
  _id: string;
  sessionId?: string;
  userId?: string;
  provider?: string;
  calendarId?: string;
  title: string;
  attendeeName?: string;
  description?: string;
  start: string;
  end: string;
  timezone?: string;
  googleEventId?: string;
  htmlLink?: string;
  notificationStatus?: NotificationStatus;
  reminderConfig?: { enabled?: boolean; offsetsMinutes?: number[] };
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  success: false;
  error: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ListResponse<T> {
  success?: boolean;
  data?: T[];
  total?: number;
}

export interface WebhookToolCallPayload {
  type?: string;
  toolName?: string;
  arguments?: {
    attendee_name?: string;
    attendee_email?: string;
    title?: string;
    start_iso?: string;
    duration_minutes?: number;
    timezone?: string;
    description?: string;
    reminders_enabled?: boolean;
    reminder_offsets_minutes?: number[];
  };
}
