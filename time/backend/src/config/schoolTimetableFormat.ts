/** Standard school timetable slots — must match frontend/src/config/schoolTimetableFormat.ts */

export interface SchoolTimeSlot {
  label: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  isLunch?: boolean;
  isAssembly?: boolean;
  fixedByDay?: Partial<Record<1 | 2 | 3 | 4 | 5, string>>;
  teachable?: boolean;
}

export const STANDARD_SCHOOL_SLOTS: SchoolTimeSlot[] = [
  { label: 'ASSEMBLY', startTime: '07:50', endTime: '08:10', isAssembly: true, teachable: false },
  { label: 'Period 1', startTime: '08:10', endTime: '08:50', teachable: true },
  { label: 'Period 2', startTime: '08:50', endTime: '09:30', teachable: true },
  { label: 'Period 3', startTime: '09:30', endTime: '10:10', teachable: true },
  { label: 'BREAK', startTime: '10:10', endTime: '10:25', isBreak: true, teachable: false },
  { label: 'Period 4', startTime: '10:25', endTime: '11:05', teachable: true },
  { label: 'Period 5', startTime: '11:05', endTime: '11:55', teachable: true },
  { label: 'Period 6', startTime: '11:55', endTime: '12:25', teachable: true },
  { label: 'LUNCH', startTime: '12:25', endTime: '13:30', isLunch: true, teachable: false },
  { label: 'Period 7', startTime: '13:30', endTime: '14:10', teachable: true },
  { label: 'Period 8', startTime: '14:10', endTime: '14:50', teachable: true },
  { label: 'Period 9', startTime: '14:50', endTime: '15:30', teachable: true },
  { label: 'BREAK', startTime: '15:30', endTime: '15:40', isBreak: true, teachable: false },
  { label: 'Period 10', startTime: '15:40', endTime: '16:20', teachable: true },
  {
    label: 'Afternoon',
    startTime: '16:20',
    endTime: '17:00',
    teachable: false,
    fixedByDay: { 2: 'DEBATE', 3: 'CPD', 5: 'SPORT' },
  },
];

export function isTeachableSlot(slot: SchoolTimeSlot): boolean {
  if (slot.teachable === false) return false;
  if (slot.isBreak || slot.isLunch || slot.isAssembly) return false;
  if (slot.fixedByDay && Object.keys(slot.fixedByDay).length > 0) return false;
  return true;
}

export interface ChronogramTimeSlot {
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  isLunch: boolean;
  isAssembly?: boolean;
}

export function standardSlotsToChronogram(): ChronogramTimeSlot[] {
  return STANDARD_SCHOOL_SLOTS.map((s) => ({
    label: s.label,
    startTime: s.startTime,
    endTime: s.endTime,
    isBreak: Boolean(s.isBreak),
    isLunch: Boolean(s.isLunch),
    isAssembly: Boolean(s.isAssembly),
  }));
}

/** Slots where AI may assign subjects (excludes assembly, breaks, lunch, fixed afternoon) */
/** Force chronogram to use the fixed school timetable slots only */
export function enforceStandardTimeSlots<T extends { timeSlots?: unknown[] }>(chronogram: T): T & { timeSlots: ChronogramTimeSlot[] } {
  return { ...chronogram, timeSlots: standardSlotsToChronogram() };
}

export function getSchedulableSlots<T extends { isBreak?: boolean; isLunch?: boolean; isAssembly?: boolean; startTime?: string; endTime?: string; teachable?: boolean }>(
  timeSlots: T[]
): T[] {
  return timeSlots.filter((s) => {
    if (s.isBreak || s.isLunch || s.isAssembly) return false;
    if (s.teachable === false) return false;
    if (s.startTime === '16:20' && s.endTime === '17:00') return false;
    if (s.startTime === '07:50' && s.endTime === '08:10') return false;
    return true;
  });
}
