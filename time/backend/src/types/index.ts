// Type definitions for School Timetable System

export interface Class {
  id: number;
  name: string;
  level: string;
  stream: string | null;
  created_at: Date;
}

export interface Teacher {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: Date;
}

export interface Classroom {
  id: number;
  name: string;
  capacity: number | null;
  location: string | null;
  created_at: Date;
}

export interface Subject {
  id: number;
  name: string;
  code: string | null;
  created_at: Date;
}

export interface TimetableEntry {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  classroom_id: number;
  start_time: string;
  end_time: string;
  day_of_week: number;
  is_temporary: boolean;
  temporary_date: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TimetableEntryWithDetails extends TimetableEntry {
  class_name: string;
  subject_name: string;
  teacher_name: string;
  classroom_name: string;
}

export interface Announcement {
  id: number;
  title: string;
  image_path: string;
  display_order: number;
  is_active: boolean;
  expires_at: Date | null;
  created_at: Date;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'viewer';
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
}

export interface DisplayConfig {
  id: number;
  display_id: string;
  name: string | null;
  filter_classes: string | null;
  filter_levels: string | null;
  rotation_speed: number;
  theme: 'light' | 'dark';
  language: string;
  created_at: Date;
  updated_at: Date;
}

export interface CurrentSession {
  id: number;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  classroom_id: number;
  classroom_name: string;
  start_time: string;
  end_time: string;
  is_temporary: boolean;
  temporary_date: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}
