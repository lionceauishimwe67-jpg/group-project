// Shared types for the AI Timetable Generation system
// Single source of truth - no duplicates

export interface TimeSlot {
  label?: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  isLunch?: boolean;
}

export interface ChronogramSubject {
  name: string;
  code?: string;
  periodsPerWeek: number;
  teacherNumber?: string;
  teacherName?: string;
  teacherId?: number;
  priority?: number;
}

export interface ChronogramData {
  className?: string;
  classId?: number;
  subjects: ChronogramSubject[];
  timeSlots: TimeSlot[];
  days: string[];
  rawText?: string;
}

export interface MultiClassChronogram {
  classes: ChronogramData[];
  rawText?: string;
}

export interface TeacherConstraint {
  teacher_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: number;
  max_periods_per_day: number;
}

export interface TimetableEntry {
  class_id: number;
  subject_id: number;
  teacher_id: number;
  classroom_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface GenerationResult {
  entries: TimetableEntry[];
  conflicts: string[];
  warnings: string[];
}

export interface ClassGenerationResult {
  className: string;
  classId: number;
  entries: TimetableEntry[];
  conflicts: string[];
  warnings: string[];
  success: boolean;
  entryCount: number;
}

export interface BatchGenerationResult {
  totalClasses: number;
  successfulClasses: number;
  failedClasses: number;
  totalEntries: number;
  totalConflicts: number;
  totalWarnings: number;
  results: ClassGenerationResult[];
}

export interface JsonInputClass {
  id: number;
  name: string;
  level?: string;
  students?: number;
}

export interface JsonInputSubject {
  name: string;
  teacher?: string;
  hours_per_week: number;
  availability?: string;
}

export interface JsonInputPayload {
  days?: string[];
  classes: JsonInputClass[];
  subjects: JsonInputSubject[];
  rules?: string[];
  time_slots?: string[];
  classId?: number;
}

export interface ReferenceData {
  teachers: any[];
  subjects: any[];
  classrooms: any[];
  teacherSubjects: any[];
  teacherConstraints?: TeacherConstraint[];
}

export interface ValidationError {
  type: string;
  message: string;
  detail?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  matchedTeachers: any[];
  matchedSubjects: any[];
  teacherCount: number;
  subjectCount: number;
  classroomCount: number;
}

// Configurable school schedule
export interface SchoolScheduleConfig {
  assemblyTime?: { start: string; end: string };
  periods: TimeSlot[];
  breaks: TimeSlot[];
  lunchTime?: { start: string; end: string };
  schoolStart: string;
  schoolEnd: string;
}
