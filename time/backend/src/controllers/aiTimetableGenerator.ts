import { query, queryOne, run } from '../config/database';
import { standardSlotsToChronogram, getSchedulableSlots, enforceStandardTimeSlots } from '../config/schoolTimetableFormat';

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
  isAssembly?: boolean;
  teachable?: boolean;
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

function normalizeRoomName(value: string | undefined | null): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getClassRoomCodes(className?: string): string[] {
  const normalized = normalizeRoomName(className).toUpperCase();
  if (!normalized) return [];

  const codes = new Set<string>([normalized]);
  const withoutLevel = normalized.replace(/^(?:L|S)\d+/, '');
  if (withoutLevel && withoutLevel !== normalized) codes.add(withoutLevel);

  return Array.from(codes).filter(Boolean);
}

function getDesignatedClassroomsForClass(classrooms: any[], className?: string): any[] {
  const classKey = normalizeRoomName(className);
  const classRoomKey = `${classKey}room`;
  const codes = getClassRoomCodes(className).map(normalizeRoomName);

  const ranked = classrooms
    .map((room: any) => {
      const roomKey = normalizeRoomName(room?.name);
      let rank = 100;
      if (roomKey === classRoomKey || roomKey === classKey) {
        rank = 0;
      } else if (codes.some((code) => code && (roomKey === code || roomKey === `${code}room`))) {
        rank = 1;
      }
      return { room, rank };
    })
    .filter(({ rank }) => rank < 100)
    .sort((a, b) => {
      const rankDiff = a.rank - b.rank;
      if (rankDiff !== 0) return rankDiff;
      return String(a.room?.name || '').localeCompare(String(b.room?.name || ''));
    });

  const exactClassRooms = ranked.filter(({ rank }) => rank === 0);
  return (exactClassRooms.length > 0 ? exactClassRooms : ranked).map(({ room }) => room);
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
  referenceData: { teachers: any[]; subjects: any[]; classrooms: any[]; teacherSubjects: any[]; teacherClasses?: any[]; teacherConstraints?: TeacherConstraint[] },
  existingEntries: TimetableEntry[] = []
): Promise<{ entries: TimetableEntry[], conflicts: string[], warnings: string[] }> {
  const conflicts: string[] = [];
  const warnings: string[] = [];
  const entries: TimetableEntry[] = [];

  chronogram = enforceStandardTimeSlots(chronogram);
  const { subjects, timeSlots } = chronogram;
  const workingDays = [1, 2, 3, 4, 5]; // Mon-Fri
  const nonBreakSlots = getSchedulableSlots(timeSlots);
  const teacherConstraints = referenceData.teacherConstraints || [];
  const teacherClasses = referenceData.teacherClasses || [];
  const classroomChoices = getDesignatedClassroomsForClass(referenceData.classrooms || [], chronogram.className);

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

  if (classroomChoices.length === 0) {
    return {
      entries,
      conflicts: [`No designated room found for "${chronogram.className || `class ${classId}`}". Create a classroom like "${chronogram.className} Room" before generating.`],
      warnings
    };
  }

  const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const teacherHasSubject = (teacherId: number, subjectId: number) =>
    referenceData.teacherSubjects.some((ts: any) => ts.teacher_id === teacherId && ts.subject_id === subjectId);
  const teacherHasClass = (teacherId: number) =>
    teacherClasses.some((tc: any) => tc.teacher_id === teacherId && tc.class_id === classId);
  const teacherMatchesProfile = (teacherId: number, subjectId: number) =>
    teacherHasSubject(teacherId, subjectId) && teacherHasClass(teacherId);

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
      })
      || (() => {
        // Try matching by code patterns (e.g., NITIA402 matches NITIA501)
        const codeMatch = s.name.match(/^([A-Z]{3,6})\d{3}$/);
        if (codeMatch) {
          const prefix = codeMatch[1];
          return referenceData.subjects.find((sub: any) =>
            sub.code?.toUpperCase().startsWith(prefix) || sub.name?.toUpperCase().startsWith(prefix)
          );
        }
        return null;
      })();
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

    if (dbTeacher && dbSubject && !teacherMatchesProfile(dbTeacher.id, dbSubject.id)) {
      conflicts.push(`Teacher "${dbTeacher.name}" cannot teach "${s.name}" in "${chronogram.className}" because the subject or class is not selected in Teacher Profile.`);
      dbTeacher = null;
    }

    // If no valid teacher from chronogram, auto-match from Teacher Profile subject + class assignments
    if (!dbTeacher && dbSubject) {
      const teacherIds = referenceData.teacherSubjects
        .filter((ts: any) => ts.subject_id === dbSubject.id)
        .map((ts: any) => ts.teacher_id)
        .filter((teacherId: number) => teacherMatchesProfile(teacherId, dbSubject.id));

      if (teacherIds.length > 0) {
        teacherIds.sort((a: number, b: number) => {
          const aWorkload = existingEntries.filter(e => e.teacher_id === a).length + entries.filter(e => e.teacher_id === a).length;
          const bWorkload = existingEntries.filter(e => e.teacher_id === b).length + entries.filter(e => e.teacher_id === b).length;
          return aWorkload - bWorkload;
        });

        dbTeacher = referenceData.teachers.find((t: any) => t.id === teacherIds[0]);
        if (dbTeacher) {
          warnings.push(`Auto-assigned teacher "${dbTeacher.name}" for subject "${s.name}" from Teacher Profile`);
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
  const classSlots = new Map<number, Set<string>>(); // classId -> Set<"day-start-end">
  const subjectDayCounts = new Map<number, Map<number, number>>(); // subjectId -> day -> count
  const teacherDayCounts = new Map<number, Map<number, number>>(); // teacherId -> day -> count

  // Pre-populate with existing entries from other classes to prevent cross-class conflicts
  for (const existing of existingEntries) {
    if (existing.class_id === classId) continue;
    const slotKey = `${existing.day_of_week}-${existing.start_time}-${existing.end_time}`;
    if (!teacherSlots.has(existing.teacher_id)) teacherSlots.set(existing.teacher_id, new Set());
    if (!classroomSlots.has(existing.classroom_id)) classroomSlots.set(existing.classroom_id, new Set());
    if (!classSlots.has(existing.class_id)) classSlots.set(existing.class_id, new Set());
    teacherSlots.get(existing.teacher_id)!.add(slotKey);
    classroomSlots.get(existing.classroom_id)!.add(slotKey);
    classSlots.get(existing.class_id)!.add(slotKey);
  }

  // Helper functions
  function isSlotAvailable(teacherId: number, classroomId: number, day: number, slot: TimeSlot): boolean {
    const slotKey = `${day}-${slot.startTime}-${slot.endTime}`;
    return !teacherSlots.get(teacherId)?.has(slotKey) &&
           !classroomSlots.get(classroomId)?.has(slotKey) &&
           !classSlots.get(classId)?.has(slotKey);
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
    if (!classSlots.has(classId)) classSlots.set(classId, new Set());
    teacherSlots.get(teacherId)!.add(slotKey);
    classroomSlots.get(classroomId)!.add(slotKey);
    classSlots.get(classId)!.add(slotKey);
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

  function hasConsecutiveTeacherLesson(teacherId: number, day: number, slotIndex: number): boolean {
    const previous = nonBreakSlots[slotIndex - 1];
    const next = nonBreakSlots[slotIndex + 1];
    const teacherDaySlots = teacherSlots.get(teacherId);
    if (!teacherDaySlots) return false;
    return Boolean(
      (previous && teacherDaySlots.has(`${day}-${previous.startTime}-${previous.endTime}`)) ||
      (next && teacherDaySlots.has(`${day}-${next.startTime}-${next.endTime}`))
    );
  }

  function orderedPlacements(subjectId: number, teacherId: number) {
    const placements: Array<{ day: number; slot: TimeSlot; slotIndex: number; classroomId: number; consecutivePenalty: number }> = [];

    for (let slotIndex = 0; slotIndex < nonBreakSlots.length; slotIndex++) {
      const slot = nonBreakSlots[slotIndex];
      for (const day of workingDays) {
        if (getSubjectDayCount(subjectId, day) >= 2) continue;
        if (getTeacherDayCount(teacherId, day) >= getMaxPeriodsPerDay(teacherId, day)) continue;
        if (!isTeacherAvailable(teacherId, day, slot)) continue;

        for (const classroom of classroomChoices) {
          if (isSlotAvailable(teacherId, classroom.id, day, slot)) {
            placements.push({
              day,
              slot,
              slotIndex,
              classroomId: classroom.id,
              consecutivePenalty: hasConsecutiveTeacherLesson(teacherId, day, slotIndex) ? 1 : 0
            });
            break;
          }
        }
      }
    }

    return placements.sort((a, b) => {
      const subjectSpread = getSubjectDayCount(subjectId, a.day) - getSubjectDayCount(subjectId, b.day);
      if (subjectSpread !== 0) return subjectSpread;
      const consecutive = a.consecutivePenalty - b.consecutivePenalty;
      if (consecutive !== 0) return consecutive;
      const teacherLoad = getTeacherDayCount(teacherId, a.day) - getTeacherDayCount(teacherId, b.day);
      if (teacherLoad !== 0) return teacherLoad;
      if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
      return a.day - b.day;
    });
  }

  // Greedy scheduling with constraints
  for (const subject of prioritized) {
    let remaining = subject.periodsPerWeek || 3;
    const subjectId = subject.dbSubject!.id;
    const teacherId = subject.dbTeacher!.id;

    while (remaining > 0) {
      const placement = orderedPlacements(subjectId, teacherId)[0];
      if (!placement) break;

      entries.push({
        day_of_week: placement.day,
        start_time: placement.slot.startTime,
        end_time: placement.slot.endTime,
        class_id: classId,
        subject_id: subjectId,
        teacher_id: teacherId,
        classroom_id: placement.classroomId,
      });
      markSlot(teacherId, placement.classroomId, placement.day, placement.slot);
      incSubjectDayCount(subjectId, placement.day);
      incTeacherDayCount(teacherId, placement.day);
      remaining--;
    }

    if (remaining > 0) {
      conflicts.push(`Could not place ${remaining} periods for "${subject.name}" - insufficient slots or constraints.`);
    }
  }

  return { entries, conflicts, warnings };
}

async function buildSubjectsFromDatabase(
  classId: number,
  dbSubjects: any[],
  teacherSubjects: any[],
  teachers: any[]
): Promise<Subject[]> {
  const existing = await query<{ subject_id: number }[]>(
    `SELECT DISTINCT subject_id FROM timetable WHERE class_id = ? AND is_active = 1`,
    [classId]
  );

  const subjectIds = existing.length > 0
    ? existing.map((row) => row.subject_id)
    : dbSubjects
        .filter((s) => teacherSubjects.some((ts) => ts.subject_id === s.id))
        .map((s) => s.id);

  const picked = dbSubjects.filter((s) => subjectIds.includes(s.id));
  const source = picked.length > 0 ? picked : dbSubjects;

  return source.map((s) => {
    const rel = teacherSubjects.find((ts) => ts.subject_id === s.id);
    const teacher = rel ? teachers.find((t) => t.id === rel.teacher_id) : null;
    return {
      name: s.name,
      teacher: teacher?.name,
      periodsPerWeek: 3
    };
  });
}

async function persistTimetableGeneration(
  classId: number,
  className: string,
  entries: TimetableEntry[],
  conflicts: string[],
  warnings: string[],
  uploadId?: number | null,
  userId?: number | null
) {
  const genResult = await run(
    `INSERT INTO timetable_generations (name, class_id, chronogram_upload_id, generated_by, generation_config, validation_status, validation_errors, generated_timetable, conflicts, is_current)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `Chronogram ${new Date().toISOString().slice(0, 10)} ${className}`,
      classId,
      uploadId ?? null,
      userId ?? null,
      JSON.stringify({ source: 'chronogram' }),
      conflicts.length === 0 ? 'valid' : 'warning',
      JSON.stringify(warnings),
      JSON.stringify(entries),
      JSON.stringify(conflicts),
      0
    ]
  );
  return genResult.lastID as number;
}

function normalizeTimeSlotObject(raw: any, index: number): TimeSlot | null {
  if (!raw || typeof raw !== 'object') return null;
  const startTime = raw.startTime || raw.start_time;
  const endTime = raw.endTime || raw.end_time;
  if (!startTime || !endTime) return null;
  return {
    label: raw.label || `Period ${index + 1}`,
    startTime: String(startTime).slice(0, 5),
    endTime: String(endTime).slice(0, 5),
    isBreak: Boolean(raw.isBreak || raw.is_break),
    isLunch: Boolean(raw.isLunch || raw.is_lunch)
  };
}

function buildChronogramFromTimeSlotsPayload(body: any, className: string, subjects: Subject[]): ChronogramData {
  const days = Array.isArray(body.days) && body.days.length > 0 ? body.days : DEFAULT_DAYS;
  const chronogramSubjects = Array.isArray(body.subjects) && body.subjects.length > 0
    ? body.subjects.map((s: any) => ({
        name: s.name,
        teacher: s.teacher || s.teacherName,
        teacherName: s.teacherName,
        teacherNumber: s.teacherNumber,
        periodsPerWeek: Number(s.periodsPerWeek || s.hours_per_week || 2)
      }))
    : subjects;

  return {
    className,
    subjects: chronogramSubjects,
    timeSlots: standardSlotsToChronogram(),
    days
  };
}

// Enhanced API endpoint for chronogram-based generation
export async function generateTimetableFromChronogramHandler(req: any, res: any) {
  try {
    const body = req.body as any;
    const directPayload = body as JsonInputPayload;
    let chronogram: ChronogramData | null = null;
    let classId: number | undefined = body.classId ? Number(body.classId) : undefined;
    let uploadId: number | undefined = body.uploadId ? Number(body.uploadId) : undefined;

    if (directPayload?.classes && directPayload?.subjects) {
      chronogram = buildChronogramFromJsonPayload(directPayload);
      classId = directPayload.classId || directPayload.classes[0]?.id;
      if (!classId) {
        return res.status(400).json({
          success: false,
          error: 'classId is required in JSON template (or pick a matching class in classes array)'
        });
      }
    } else if (Array.isArray(body.timeSlots) || Array.isArray(body.time_slots)) {
      if (!classId) {
        return res.status(400).json({ success: false, error: 'classId is required when using timeSlots chronogram' });
      }
      const classRecord = await queryOne<{ id: number; name: string }>('SELECT id, name FROM classes WHERE id = ?', [classId]);
      if (!classRecord) {
        return res.status(404).json({ success: false, error: 'Class not found' });
      }
      const teachers = await query<any[]>('SELECT id, name, phone FROM teachers ORDER BY name');
      const subjects = await query<any[]>('SELECT id, name, code FROM subjects ORDER BY name');
      const teacherSubjects = await query<any[]>('SELECT teacher_id, subject_id FROM teacher_subjects');
      const dbSubjects = await buildSubjectsFromDatabase(classId, subjects, teacherSubjects, teachers);
      chronogram = buildChronogramFromTimeSlotsPayload(body, classRecord.name, dbSubjects);
    } else if (uploadId && classId) {
      const upload = await queryOne<{ extracted_data: string }>(
        'SELECT extracted_data FROM chronogram_uploads WHERE id = ?',
        [uploadId]
      );

      if (!upload) {
        return res.status(404).json({ success: false, error: 'Upload not found' });
      }

      try {
        const parsed = JSON.parse(upload.extracted_data);
        if (parsed.classes && Array.isArray(parsed.classes)) {
          const classRecord = await queryOne<{ id: number; name: string }>('SELECT id, name FROM classes WHERE id = ?', [classId]);
          chronogram = parsed.classes.find((c: ChronogramData) =>
            c.className?.toLowerCase() === classRecord?.name?.toLowerCase() ||
            classRecord?.name?.toLowerCase().includes(c.className?.toLowerCase() || '') ||
            c.className?.toLowerCase().includes(classRecord?.name?.toLowerCase() || '')
          ) || parsed.classes[0];
        } else {
          chronogram = parsed as ChronogramData;
        }
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid chronogram data' });
      }
    } else if (classId) {
      const classRecord = await queryOne<{ id: number; name: string }>('SELECT id, name FROM classes WHERE id = ?', [classId]);
      if (!classRecord) {
        return res.status(404).json({ success: false, error: 'Class not found' });
      }
      const teachers = await query<any[]>('SELECT id, name, phone FROM teachers ORDER BY name');
      const subjects = await query<any[]>('SELECT id, name, code FROM subjects ORDER BY name');
      const teacherSubjects = await query<any[]>('SELECT teacher_id, subject_id FROM teacher_subjects');
      const dbSubjects = await buildSubjectsFromDatabase(classId, subjects, teacherSubjects, teachers);
      chronogram = buildChronogramFromTimeSlotsPayload(body, classRecord.name, dbSubjects);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide classId, JSON template (subjects), or uploadId + classId'
      });
    }

    if (!chronogram) {
      return res.status(400).json({ success: false, error: 'Invalid timetable payload' });
    }

    chronogram = enforceStandardTimeSlots(chronogram);

    if (!classId) {
      return res.status(400).json({ success: false, error: 'classId is required' });
    }

    const classRecord = await queryOne<{ id: number; name: string }>('SELECT id, name FROM classes WHERE id = ?', [classId]);
    if (!classRecord) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    chronogram = { ...chronogram, className: classRecord.name };

    const teachers = await query<any[]>('SELECT id, name, phone FROM teachers ORDER BY name');
    const subjects = await query<any[]>('SELECT id, name, code FROM subjects ORDER BY name');
    const classrooms = await query<any[]>('SELECT id, name FROM classrooms ORDER BY name');
    const teacherSubjects = await query<any[]>('SELECT teacher_id, subject_id FROM teacher_subjects');
    const teacherClasses = await query<any[]>('SELECT teacher_id, class_id FROM teacher_classes');

    if (chronogram.subjects.length === 0) {
      const dbSubjects = await buildSubjectsFromDatabase(classId, subjects, teacherSubjects, teachers);
      chronogram = { ...chronogram, subjects: dbSubjects };
    }

    const teacherConstraints = directPayload?.classes && directPayload?.subjects
      ? buildTeacherAvailabilityConstraints(directPayload, teachers, chronogram.days || DEFAULT_DAYS)
      : [];

    const existingEntries = await query<{ class_id: number; subject_id: number; teacher_id: number; classroom_id: number; day_of_week: number; start_time: string; end_time: string }[]>(
      'SELECT class_id, subject_id, teacher_id, classroom_id, day_of_week, start_time, end_time FROM timetable'
    );

    const result = await generateTimetableFromChronogram(chronogram, classId, {
      teachers,
      subjects,
      classrooms,
      teacherSubjects,
      teacherClasses,
      teacherConstraints
    }, existingEntries);

    const generationId = await persistTimetableGeneration(
      classId,
      classRecord.name,
      result.entries,
      result.conflicts,
      result.warnings,
      uploadId,
      req.user?.userId
    );

    res.json({
      success: true,
      data: {
        generationId,
        entries: result.entries,
        conflicts: result.conflicts,
        warnings: result.warnings,
        entryCount: result.entries.length,
        className: classRecord.name
      },
      message: result.conflicts.length === 0
        ? `Generated ${result.entries.length} timetable entries successfully`
        : `Generated ${result.entries.length} entries with ${result.conflicts.length} conflicts`
    });

  } catch (error: any) {
    console.error('Error generating timetable from chronogram:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate timetable: ' + (error?.message || 'unknown error')
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
  const subjects: Subject[] = payload.subjects.map((sub) => ({
    name: sub.name,
    teacher: sub.teacher,
    periodsPerWeek: Number(sub.hours_per_week) || 2
  }));

  return {
    className: targetClass?.name || 'Unknown Class',
    subjects,
    timeSlots: standardSlotsToChronogram(),
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
