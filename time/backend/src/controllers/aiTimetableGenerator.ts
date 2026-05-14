import { query, queryOne } from '../config/database';

// AI Timetable Generator - Handles chronogram format and user input
interface Subject {
  name: string;
  teacher?: string;
  teacherName?: string;
  teacherNumber?: string;
  teacherId?: number;
  periodsPerWeek: number;
  dbSubject?: any;
  dbTeacher?: any;
}

interface TimeSlot {
  label?: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  isLunch?: boolean;
}

interface ChronogramData {
  className?: string;
  subjects: Subject[];
  timeSlots: TimeSlot[];
  days?: string[];
}

interface TeacherConstraint {
  teacher_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: number;
  max_periods_per_day: number;
}

interface JsonInputClass {
  id: number;
  name: string;
  level?: string;
  students?: number;
}

interface JsonInputSubject {
  name: string;
  teacher?: string;
  hours_per_week: number;
  availability?: string;
}

interface JsonInputPayload {
  days?: string[];
  classes: JsonInputClass[];
  subjects: JsonInputSubject[];
  rules?: string[];
  time_slots?: string[];
  classId?: number;
}

const DEFAULT_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

interface TimetableEntry {
  class_id: number;
  subject_id: number;
  teacher_id: number;
  classroom_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ChronogramData {
  className?: string;
  subjects: Subject[];
  timeSlots: TimeSlot[];
  days?: string[];
}

interface TeacherConstraint {
  teacher_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: number;
  max_periods_per_day: number;
}

// Enhanced AI timetable generator for chronogram format
export async function generateTimetableFromChronogram(
  chronogram: ChronogramData,
  classId: number,
  referenceData: { teachers: any[]; subjects: any[]; classrooms: any[]; teacherSubjects: any[]; teacherConstraints?: TeacherConstraint[] }
): Promise<{ entries: TimetableEntry[], conflicts: string[], warnings: string[] }> {
  const conflicts: string[] = [];
  const warnings: string[] = [];
  const entries: TimetableEntry[] = [];

  const { subjects, timeSlots } = chronogram;
  const workingDays = [1, 2, 3, 4, 5]; // Mon-Fri
  const nonBreakSlots = timeSlots.filter(s => !s.isBreak && !s.isLunch);
  const teacherConstraints = referenceData.teacherConstraints || [];

  console.log('DEBUG: AI Generator - Chronogram received:', {
    className: chronogram.className,
    subjectsCount: subjects?.length || 0,
    timeSlotsCount: timeSlots?.length || 0,
    subjects: subjects?.slice(0, 3) || [],
    timeSlots: timeSlots?.slice(0, 3) || []
  });

  if (subjects.length === 0) {
    return { entries, conflicts: ['No subjects found in chronogram'], warnings };
  }

  const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const findSubject = (s: Subject) => {
    const subjectName = s.name.toLowerCase();
    const normalizedSubject = normalizeName(s.name);
    const subjectCode = s.dbSubject?.code?.toLowerCase();

    return referenceData.subjects.find((sub: any) => sub.name?.toLowerCase() === subjectName)
      || (subjectCode ? referenceData.subjects.find((sub: any) => sub.code?.toLowerCase() === subjectCode) : null)
      || referenceData.subjects.find((sub: any) => sub.code?.toLowerCase() === subjectName)
      || referenceData.subjects.find((sub: any) => normalizeName(sub.name || '') === normalizedSubject)
      || referenceData.subjects.find((sub: any) => {
        const candidate = normalizeName(sub.name || '');
        return candidate.length > 3 && normalizedSubject.length > 3 &&
          (candidate.includes(normalizedSubject) || normalizedSubject.includes(candidate));
      });
  };

  // Map chronogram subjects to DB subjects and teachers
  const mappedSubjects = subjects.map(s => {
    let dbSubject = findSubject(s);

    // Find teacher by number or name (from chronogram)
    let dbTeacher = null;
    if (s.teacherNumber) {
      dbTeacher = referenceData.teachers.find((t: any) =>
        t.phone?.includes(s.teacherNumber!) || t.id === parseInt(s.teacherNumber!, 10) || t.name?.includes(s.teacherNumber!)
      );
    }
    const teacherName = s.teacher || s.teacherName;
    if (!dbTeacher && teacherName) {
      dbTeacher = referenceData.teachers.find((t: any) =>
        t.name?.toLowerCase() === teacherName.toLowerCase() ||
        t.name?.toLowerCase().includes(teacherName.toLowerCase()) ||
        teacherName.toLowerCase().includes(t.name?.toLowerCase())
      );
    }

    // If no teacher from chronogram, auto-match from teacher_subjects
    if (!dbTeacher && dbSubject) {
      // Find all teachers who teach this subject
      const teacherSubjectRels = referenceData.teacherSubjects.filter((ts: any) => ts.subject_id === dbSubject.id);
      
      if (teacherSubjectRels.length > 0) {
        // Get all teacher IDs
        const teacherIds = teacherSubjectRels.map((ts: any) => ts.teacher_id);
        
        // Calculate workload for each teacher (count existing entries)
        const teacherWorkloads = teacherIds.map(teacherId => {
          const workload = entries.filter(e => e.teacher_id === teacherId).length;
          return { teacherId, workload };
        });

        // Sort by workload (least busy first)
        teacherWorkloads.sort((a, b) => a.workload - b.workload);

        // Select the least busy teacher
        const selectedTeacherId = teacherWorkloads[0].teacherId;
        dbTeacher = referenceData.teachers.find((t: any) => t.id === selectedTeacherId);

        if (dbTeacher) {
          warnings.push(`Auto-assigned teacher "${dbTeacher.name}" for subject "${s.name}" (least busy)`);
        }
      }
    }

    return { ...s, dbSubject, dbTeacher };
  });

  // Validate teachers and subjects
  for (const ms of mappedSubjects) {
    if (!ms.dbSubject) {
      warnings.push(`Subject "${ms.name}" not found in database. It will be created or skipped.`);
    }
    if (!ms.dbTeacher) {
      conflicts.push(`No teacher assigned for "${ms.name}" - no matching teacher found in database.`);
    }
  }

  // Filter out unmapped subjects and teachers
  const validSubjects = mappedSubjects.filter(ms => ms.dbSubject && ms.dbTeacher);
  if (validSubjects.length === 0) {
    return { entries, conflicts: ['No valid subject-teacher pairs found'], warnings };
  }

  // Priority: core subjects first, then by hours
  const CORE_SUBJECTS = ['MATH', 'ENGLISH', 'FRENCH', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'];
  const prioritized = [...validSubjects].sort((a, b) => {
    const aCore = CORE_SUBJECTS.some(c => a.name.toLowerCase().includes(c)) ? 1 : 0;
    const bCore = CORE_SUBJECTS.some(c => b.name.toLowerCase().includes(c)) ? 1 : 0;
    if (bCore !== aCore) return bCore - aCore;
    return (b.periodsPerWeek || 0) - (a.periodsPerWeek || 0);
  });

  // Conflict tracking structures
  const teacherSlots = new Map<number, Set<string>>(); // teacherId -> Set<"day-start-end">
  const classroomSlots = new Map<number, Set<string>>(); // classroomId -> Set<"day-start-end">
  const subjectDayCounts = new Map<number, Map<number, number>>(); // subjectId -> day -> count
  const teacherDayCounts = new Map<number, Map<number, number>>(); // teacherId -> day -> count

  // Helper functions
  function isSlotAvailable(teacherId: number, classroomId: number, day: number, slot: TimeSlot): boolean {
    const slotKey = `${day}-${slot.startTime}-${slot.endTime}`;
    return !teacherSlots.get(teacherId)?.has(slotKey) && 
           !classroomSlots.get(classroomId)?.has(slotKey);
  }

  function isTeacherAvailable(teacherId: number, day: number, slot: TimeSlot): boolean {
    const constraints = teacherConstraints.filter(c => c.teacher_id === teacherId && c.day_of_week === day);
    
    for (const constraint of constraints) {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      const constraintStart = timeToMinutes(constraint.start_time);
      const constraintEnd = timeToMinutes(constraint.end_time);

      if (constraint.is_available === 0) {
        if (constraint.start_time && constraint.end_time) {
          if (slotStart < constraintEnd && slotEnd > constraintStart) {
            return false;
          }
          continue;
        }
        return false;
      }

      if (constraint.start_time && constraint.end_time) {
        if (slotStart < constraintEnd && slotEnd > constraintStart) {
          return false;
        }
      }
    }
    
    return true;
  }

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function getMaxPeriodsPerDay(teacherId: number, day: number): number {
    const constraint = teacherConstraints.find(c => c.teacher_id === teacherId && c.day_of_week === day);
    return constraint?.max_periods_per_day || 6; // Default to 6 periods per day
  }

  function markSlot(teacherId: number, classroomId: number, day: number, slot: TimeSlot) {
    const slotKey = `${day}-${slot.startTime}-${slot.endTime}`;
    if (!teacherSlots.has(teacherId)) teacherSlots.set(teacherId, new Set());
    if (!classroomSlots.has(classroomId)) classroomSlots.set(classroomId, new Set());
    teacherSlots.get(teacherId)!.add(slotKey);
    classroomSlots.get(classroomId)!.add(slotKey);
  }

  function getSubjectDayCount(subjectId: number, day: number): number {
    return subjectDayCounts.get(subjectId)?.get(day) || 0;
  }

  function incSubjectDayCount(subjectId: number, day: number) {
    if (!subjectDayCounts.has(subjectId)) subjectDayCounts.set(subjectId, new Map());
    const dayMap = subjectDayCounts.get(subjectId)!;
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  }

  function getTeacherDayCount(teacherId: number, day: number): number {
    return teacherDayCounts.get(teacherId)?.get(day) || 0;
  }

  function incTeacherDayCount(teacherId: number, day: number) {
    if (!teacherDayCounts.has(teacherId)) teacherDayCounts.set(teacherId, new Map());
    const dayMap = teacherDayCounts.get(teacherId)!;
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  }

  // Greedy scheduling with constraints
  for (const subject of prioritized) {
    let remaining = subject.periodsPerWeek || 2;
    const subjectId = subject.dbSubject!.id;
    const teacherId = subject.dbTeacher!.id;

    for (const day of workingDays) {
      if (remaining <= 0) break;
      if (getSubjectDayCount(subjectId, day) >= 3) continue; // Max 3 per day per subject
      if (getTeacherDayCount(teacherId, day) >= 6) continue; // Max 6 per day per teacher

      for (const slot of nonBreakSlots) {
        if (remaining <= 0) break;
        if (getSubjectDayCount(subjectId, day) >= 3) break;

        let classroomId = referenceData.classrooms[0]?.id || 1;
        let foundClassroom = false;
        
        for (const classroom of referenceData.classrooms) {
          if (isSlotAvailable(teacherId, classroom.id, day, slot)) {
            classroomId = classroom.id;
            foundClassroom = true;
            break;
          }
        }
        
        if (!foundClassroom) continue;

        const entry: TimetableEntry = {
          day_of_week: day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          class_id: classId,
          subject_id: subjectId,
          teacher_id: teacherId,
          classroom_id: classroomId,
        };

        entries.push(entry);
        markSlot(teacherId, classroomId, day, slot);
        incSubjectDayCount(subjectId, day);
        incTeacherDayCount(teacherId, day);
        remaining--;
      }
    }

    if (remaining > 0) {
      conflicts.push(`Could not place ${remaining} periods for "${subject.name}" - insufficient slots or constraints.`);
    }
  }

  return { entries, conflicts, warnings };
}

// Enhanced API endpoint for chronogram-based generation
export async function generateTimetableFromChronogramHandler(req: any, res: any) {
  try {
    const body = req.body as any;
    const directPayload = body as JsonInputPayload;
    let chronogram: ChronogramData | null = null;
    let classId: number | undefined;

    if (directPayload?.classes && directPayload?.subjects) {
      chronogram = buildChronogramFromJsonPayload(directPayload);
      classId = directPayload.classId || directPayload.classes[0]?.id;
    } else {
      const { uploadId, classId: requestedClassId } = body;
      if (!uploadId || !requestedClassId) {
        return res.status(400).json({ 
          success: false, 
          error: 'uploadId and classId are required for chronogram upload mode' 
        });
      }

      const upload = await queryOne<{ extracted_data: string }>(
        'SELECT extracted_data FROM chronogram_uploads WHERE id = ?',
        [uploadId]
      );

      if (!upload) {
        return res.status(404).json({ success: false, error: 'Upload not found' });
      }

      try {
        const parsed = JSON.parse(upload.extracted_data);
        chronogram = parsed.classes?.[0] || parsed;
      } catch (error) {
        return res.status(400).json({ success: false, error: 'Invalid chronogram data' });
      }

      classId = requestedClassId;
    }

    if (!chronogram) {
      return res.status(400).json({ success: false, error: 'Invalid timetable payload' });
    }

    const teachers = await query<any[]>('SELECT id, name, phone FROM teachers ORDER BY name');
    const subjects = await query<any[]>('SELECT id, name, code FROM subjects ORDER BY name');
    const classrooms = await query<any[]>('SELECT id, name FROM classrooms ORDER BY name');
    const teacherSubjects = await query<any[]>('SELECT teacher_id, subject_id FROM teacher_subjects');

    const teacherConstraints = directPayload?.classes && directPayload?.subjects
      ? buildTeacherAvailabilityConstraints(directPayload, teachers, chronogram.days || DEFAULT_DAYS)
      : [];

    const result = await generateTimetableFromChronogram(chronogram, classId ?? 0, {
      teachers,
      subjects,
      classrooms,
      teacherSubjects,
      teacherConstraints
    });

    res.json({
      success: true,
      entries: result.entries,
      conflicts: result.conflicts,
      warnings: result.warnings,
      summary: {
        totalEntries: result.entries.length,
        totalConflicts: result.conflicts.length,
        totalWarnings: result.warnings.length,
        className: chronogram.className
      }
    });

  } catch (error) {
    console.error('Error generating timetable from chronogram:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate timetable' 
    });
  }
}

function parseTimeSlot(value: string): TimeSlot | null {
  const trimmed = String(value || '').trim();
  const match = trimmed.match(/(\d{1,2})[:\.](\d{2})\s*[-–—~to]+\s*(\d{1,2})[:\.](\d{2})/i);
  if (!match) return null;
  return {
    startTime: `${match[1].padStart(2,'0')}:${match[2]}`,
    endTime: `${match[3].padStart(2,'0')}:${match[4]}`,
    label: trimmed,
    isBreak: false,
    isLunch: false
  };
}

function buildChronogramFromJsonPayload(payload: JsonInputPayload): ChronogramData {
  const targetClass = payload.classes.find(c => c.id === payload.classId) || payload.classes[0];
  const days = Array.isArray(payload.days) && payload.days.length > 0 ? payload.days : DEFAULT_DAYS;
  const timeSlots = Array.isArray(payload.time_slots) && payload.time_slots.length > 0
    ? payload.time_slots.map(parseTimeSlot).filter(Boolean) as TimeSlot[]
    : [];

  const subjects: Subject[] = payload.subjects.map((sub) => ({
    name: sub.name,
    teacher: sub.teacher,
    periodsPerWeek: Number(sub.hours_per_week) || 2
  }));

  return {
    className: targetClass?.name || 'Unknown Class',
    subjects,
    timeSlots: timeSlots.length > 0 ? timeSlots : [{ label: 'Period 1', startTime: '08:00', endTime: '09:00' }, { label: 'Period 2', startTime: '09:00', endTime: '10:00' }, { label: 'Period 3', startTime: '10:30', endTime: '11:30' }],
    days
  };
}

function buildTeacherAvailabilityConstraints(
  payload: JsonInputPayload,
  teachers: any[],
  days: string[]
): TeacherConstraint[] {
  const constraints: TeacherConstraint[] = [];
  const availabilityRanges: Record<string, { start: string; end: string }[]> = {
    morning: [{ start: '12:00', end: '23:59' }],
    afternoon: [{ start: '00:00', end: '11:59' }],
    'full day': []
  };

  for (const subject of payload.subjects) {
    if (!subject.teacher || !subject.availability) continue;
    const teacher = teachers.find((t: any) => t.name?.toLowerCase().includes(subject.teacher!.toLowerCase()));
    if (!teacher) continue;
    const key = String(subject.availability).trim().toLowerCase();
    const ranges = availabilityRanges[key] || [];
    if (ranges.length === 0) continue;

    for (const dayIdx of [1, 2, 3, 4, 5]) {
      for (const range of ranges) {
        constraints.push({
          teacher_id: teacher.id,
          day_of_week: dayIdx,
          start_time: range.start,
          end_time: range.end,
          is_available: 0,
          max_periods_per_day: 6
        });
      }
    }
  }

  return constraints;
}
