/** Shared row/DTO shapes for the admin dashboard (client-safe). */

export interface ClassScopeInput {
  department: string;
  semester: string;
  section: string;
}

export interface AdminOverview {
  students: number;
  departments: number;
  semesters: number;
  sections: number;
  announcements: number;
  polls: number;
  imports: number;
  pendingCr: number;
}

export interface AdminStudent {
  id: string;
  student_name: string;
  usn: string;
  email: string;
  photo: string | null;
  department: string;
  semester: string;
  section: string;
  setup_complete: boolean;
  disabled: boolean;
  created_at: string;
}

export interface TimetableSlotRow {
  id: string;
  department: string;
  semester: string;
  section: string;
  day: number;
  start_time: string;
  end_time: string;
  code: string;
  name: string;
  faculty: string;
  room: string;
  session: string;
  published: boolean;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  department: string;
  semester: string;
  section: string;
  pinned: boolean;
  created_at: string;
}

export interface AdminPoll {
  id: string;
  question: string;
  department: string;
  semester: string;
  section: string;
  pinned: boolean;
  closed: boolean;
  created_at: string;
  votes: Record<string, number>;
}

export interface CrRequestRow {
  id: string;
  user_id: string;
  name: string;
  usn: string;
  reason: string;
  status: string;
  department: string;
  semester: string;
  section: string;
  created_at: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  dailyActive: number;
  imports: number;
  ocrSuccessRate: number;
  byDepartment: { label: string; value: number }[];
  bySemester: { label: string; value: number }[];
}
