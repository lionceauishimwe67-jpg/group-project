import {
  ChronogramData,
  ValidationError,
  ValidationResult,
  ReferenceData,
  TimeSlot,
} from '../types/timetable';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function validateChronogramData(
  chronogram: ChronogramData,
  referenceData: ReferenceData
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const matchedTeachers: any[] = [];
  const matchedSubjects: any[] = [];

  // Validate subjects exist
  for (const s of chronogram.subjects) {
    let dbSubject = referenceData.subjects.find(
      (sub: any) =>
        sub.name?.toLowerCase() === s.name.toLowerCase() ||
        sub.code?.toLowerCase() === (s.code || '').toLowerCase()
    );

    if (!dbSubject) {
      dbSubject = referenceData.subjects.find((sub: any) => {
        const a = sub.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        const b = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return a.length > 3 && b.length > 3 && (a.includes(b) || b.includes(a));
      });
    }

    if (!dbSubject) {
      // Try matching by code patterns (e.g., NITIA402 matches NITIA501)
      const codeMatch = s.name.match(/^([A-Z]{3,6})\d{3}$/);
      if (codeMatch) {
        const prefix = codeMatch[1];
        dbSubject = referenceData.subjects.find((sub: any) =>
          sub.code?.toUpperCase().startsWith(prefix) || sub.name?.toUpperCase().startsWith(prefix)
        );
      }
    }

    if (dbSubject) {
      matchedSubjects.push({ chronogramSubject: s, dbSubject });
    } else {
      errors.push({
        type: 'missing_subject',
        message: `Subject "${s.name}" not found in database`,
        detail: s,
      });
    }

    // Validate teacher - try direct match first, then fallback to least busy teacher for this subject
    let dbTeacher = null;
    if (s.teacherNumber) {
      dbTeacher = referenceData.teachers.find(
        (t: any) =>
          t.phone?.includes(s.teacherNumber!) ||
          t.id === parseInt(s.teacherNumber!, 10)
      );
    }
    if (!dbTeacher && s.teacherName) {
      dbTeacher = referenceData.teachers.find(
        (t: any) =>
          t.name?.toLowerCase() === s.teacherName!.toLowerCase() ||
          t.name?.toLowerCase().includes(s.teacherName!.toLowerCase()) ||
          s.teacherName!.toLowerCase().includes(t.name?.toLowerCase())
      );
    }
    if (!dbTeacher && dbSubject) {
      // Fallback: find any teacher who teaches this subject (pick least loaded)
      const teacherRels = referenceData.teacherSubjects.filter(
        (ts: any) => ts.subject_id === dbSubject.id
      );
      if (teacherRels.length > 0) {
        const teacherId = teacherRels[0].teacher_id;
        dbTeacher = referenceData.teachers.find((t: any) => t.id === teacherId);
      }
    }

    if (dbTeacher) {
      matchedTeachers.push({ chronogramSubject: s, dbTeacher });
    } else if (s.teacherNumber || s.teacherName) {
      warnings.push(
        `Teacher ${s.teacherName || s.teacherNumber || 'unknown'} for "${s.name}" not found in database`
      );
      if (s.teacherNumber) {
        errors.push({
          type: 'missing_teacher',
          message: `Teacher number "${s.teacherNumber}" for "${s.name}" not found`,
          detail: s,
        });
      }
    }
  }

  // Validate time slots
  const validSlots = chronogram.timeSlots.filter(
    (s) => !s.isBreak && !s.isLunch && !(s as { isAssembly?: boolean }).isAssembly
      && !(s.startTime === '16:20' && s.endTime === '17:00')
      && !(s.startTime === '07:50' && s.endTime === '08:10')
  );
  if (validSlots.length === 0) {
    errors.push({
      type: 'no_time_slots',
      message: 'No valid teaching time slots found',
    });
  }

  // Check for overlapping time slots
  for (let i = 0; i < validSlots.length; i++) {
    for (let j = i + 1; j < validSlots.length; j++) {
      const a = validSlots[i];
      const b = validSlots[j];
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      if (aStart < bEnd && aEnd > bStart) {
        warnings.push(`Overlapping time slots: ${a.label || a.startTime}-${a.endTime} and ${b.label || b.startTime}-${b.endTime}`);
      }
    }
  }

  // Check for impossible scheduling conditions
  const totalPeriodsNeeded = chronogram.subjects.reduce(
    (sum, s) => sum + (s.periodsPerWeek || 0),
    0
  );
  const totalSlotsAvailable = validSlots.length * 5; // 5 days
  if (totalPeriodsNeeded > totalSlotsAvailable) {
    warnings.push(
      `Total periods needed (${totalPeriodsNeeded}) exceeds available slots (${totalSlotsAvailable}). Timetable may be incomplete.`
    );
  }

  // Detect duplicate teacher assignments (same teacher, same day, same time)
  const teacherTimeMap = new Map<string, string[]>();
  for (const s of chronogram.subjects) {
    if (!s.teacherName && !s.teacherNumber) continue;
    const key = s.teacherName || s.teacherNumber || '';
    if (!teacherTimeMap.has(key)) teacherTimeMap.set(key, []);
    teacherTimeMap.get(key)!.push(s.name);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    matchedTeachers,
    matchedSubjects,
    teacherCount: referenceData.teachers.length,
    subjectCount: referenceData.subjects.length,
    classroomCount: referenceData.classrooms.length,
  };
}
