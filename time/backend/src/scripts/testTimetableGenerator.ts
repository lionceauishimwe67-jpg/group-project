import { generateTimetableFromChronogram } from '../controllers/aiTimetableGenerator';
import { ChronogramData, ReferenceData, TimeSlot } from '../types/timetable';

// ============================================================
// Test helpers
// ============================================================
function makeReferenceData(overrides?: Partial<ReferenceData>): ReferenceData {
  return {
    teachers: [
      { id: 1, name: 'Teacher A', phone: '0780000001' },
      { id: 2, name: 'Teacher B', phone: '0780000002' },
      { id: 3, name: 'Teacher C', phone: '0780000003' },
      { id: 4, name: 'Teacher D', phone: '0780000004' },
    ],
    subjects: [
      { id: 1, name: 'Mathematics', code: 'MATH' },
      { id: 2, name: 'English', code: 'ENG' },
      { id: 3, name: 'Physics', code: 'PHY' },
      { id: 4, name: 'Computer Science', code: 'CS' },
      { id: 5, name: 'French', code: 'FRE' },
    ],
    classrooms: [
      { id: 1, name: 'Room 1' },
      { id: 2, name: 'Room 2' },
    ],
    teacherSubjects: [
      { teacher_id: 1, subject_id: 1 },
      { teacher_id: 2, subject_id: 2 },
      { teacher_id: 3, subject_id: 3 },
      { teacher_id: 4, subject_id: 4 },
      { teacher_id: 1, subject_id: 5 },
    ],
    ...overrides,
  };
}

function makeTimeSlots(): TimeSlot[] {
  return [
    { label: 'P1', startTime: '08:10', endTime: '08:50' },
    { label: 'P2', startTime: '08:50', endTime: '09:30' },
    { label: 'Break', startTime: '09:30', endTime: '09:50', isBreak: true },
    { label: 'P3', startTime: '09:50', endTime: '10:30' },
    { label: 'P4', startTime: '10:30', endTime: '11:10' },
    { label: 'P5', startTime: '11:10', endTime: '11:50' },
    { label: 'Lunch', startTime: '11:50', endTime: '12:50', isLunch: true },
    { label: 'P6', startTime: '12:50', endTime: '13:30' },
    { label: 'P7', startTime: '13:30', endTime: '14:10' },
  ];
}

// ============================================================
// Test 1: Basic generation with valid data
// ============================================================
async function testBasicGeneration() {
  console.log('TEST 1: Basic generation with valid data');

  const chronogram: ChronogramData = {
    className: 'Test Class',
    subjects: [
      { name: 'Mathematics', periodsPerWeek: 4, teacherName: 'Teacher A' },
      { name: 'English', periodsPerWeek: 3, teacherName: 'Teacher B' },
      { name: 'Physics', periodsPerWeek: 3, teacherName: 'Teacher C' },
    ],
    timeSlots: makeTimeSlots(),
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };

  const ref = makeReferenceData();
  const result = await generateTimetableFromChronogram(chronogram, 1, ref);

  console.assert(result.entries.length === 10, `Expected 10 entries, got ${result.entries.length}`);
  console.assert(result.conflicts.length === 0, `Expected 0 conflicts, got ${result.conflicts.length}`);
  console.log(`  Entries: ${result.entries.length}, Conflicts: ${result.conflicts.length}`);
  console.log('  PASSED\n');
}

// ============================================================
// Test 2: Empty teacher ID handling (NITCC() style)
// ============================================================
async function testEmptyTeacherId() {
  console.log('TEST 2: Empty teacher ID handling');

  const chronogram: ChronogramData = {
    className: 'Test Class',
    subjects: [
      { name: 'Mathematics', periodsPerWeek: 2, teacherName: 'Teacher A' },
      { name: 'Computer Science', periodsPerWeek: 2 }, // No teacher
    ],
    timeSlots: makeTimeSlots(),
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };

  const ref = makeReferenceData();
  const result = await generateTimetableFromChronogram(chronogram, 1, ref);

  // CS should be auto-assigned to Teacher D (least busy)
  const csEntries = result.entries.filter((e) => e.subject_id === 4);
  console.assert(csEntries.length === 2, `Expected 2 CS entries, got ${csEntries.length}`);
  console.log(`  CS entries: ${csEntries.length}, Auto-assigned teacher: ${csEntries[0]?.teacher_id}`);
  console.log('  PASSED\n');
}

// ============================================================
// Test 3: Teacher unavailability constraints
// ============================================================
async function testTeacherConstraints() {
  console.log('TEST 3: Teacher unavailability constraints');

  const chronogram: ChronogramData = {
    className: 'Test Class',
    subjects: [
      { name: 'Mathematics', periodsPerWeek: 2, teacherName: 'Teacher A' },
    ],
    timeSlots: makeTimeSlots(),
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };

  const ref = makeReferenceData({
    teacherConstraints: [
      {
        teacher_id: 1,
        day_of_week: 1, // Monday
        start_time: '08:00',
        end_time: '09:00',
        is_available: 0, // Unavailable
        max_periods_per_day: 6,
      },
    ],
  });

  const result = await generateTimetableFromChronogram(chronogram, 1, ref);

  // Should not schedule Math on Monday during 08:10-08:50
  const mondayMorning = result.entries.filter(
    (e) => e.day_of_week === 1 && e.start_time === '08:10'
  );
  console.assert(mondayMorning.length === 0, `Teacher should be unavailable Monday morning`);
  console.log('  PASSED\n');
}

// ============================================================
// Test 4: Impossible schedule (too many periods, not enough slots)
// ============================================================
async function testImpossibleSchedule() {
  console.log('TEST 4: Impossible schedule detection');

  const chronogram: ChronogramData = {
    className: 'Test Class',
    subjects: [
      { name: 'Mathematics', periodsPerWeek: 10, teacherName: 'Teacher A' },
      { name: 'English', periodsPerWeek: 10, teacherName: 'Teacher B' },
      { name: 'Physics', periodsPerWeek: 10, teacherName: 'Teacher C' },
    ],
    timeSlots: [
      { label: 'P1', startTime: '08:10', endTime: '08:50' },
      { label: 'P2', startTime: '08:50', endTime: '09:30' },
    ],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };

  const ref = makeReferenceData();
  const result = await generateTimetableFromChronogram(chronogram, 1, ref);

  console.assert(result.conflicts.length > 0, 'Should have conflicts for impossible schedule');
  console.log(`  Conflicts: ${result.conflicts.length}`);
  console.log('  PASSED\n');
}

// ============================================================
// Test 5: Multiple subjects, fair distribution
// ============================================================
async function testFairDistribution() {
  console.log('TEST 5: Fair subject distribution');

  const chronogram: ChronogramData = {
    className: 'Test Class',
    subjects: [
      { name: 'Mathematics', periodsPerWeek: 4, teacherName: 'Teacher A' },
      { name: 'English', periodsPerWeek: 4, teacherName: 'Teacher B' },
      { name: 'Physics', periodsPerWeek: 4, teacherName: 'Teacher C' },
      { name: 'Computer Science', periodsPerWeek: 4, teacherName: 'Teacher D' },
    ],
    timeSlots: makeTimeSlots(),
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };

  const ref = makeReferenceData();
  const result = await generateTimetableFromChronogram(chronogram, 1, ref);

  // Check no teacher has more than 6 periods in a single day
  const teacherDayCounts = new Map<string, number>();
  for (const entry of result.entries) {
    const key = `${entry.teacher_id}-${entry.day_of_week}`;
    teacherDayCounts.set(key, (teacherDayCounts.get(key) || 0) + 1);
  }

  let maxPerDay = 0;
  for (const count of teacherDayCounts.values()) {
    if (count > maxPerDay) maxPerDay = count;
  }

  console.assert(maxPerDay <= 6, `Teacher has ${maxPerDay} periods in one day (max 6)`);
  console.log(`  Max periods per teacher per day: ${maxPerDay}`);
  console.log('  PASSED\n');
}

// ============================================================
// Test 6: Malformed upload handling
// ============================================================
async function testMalformedData() {
  console.log('TEST 6: Malformed data handling');

  const chronogram: ChronogramData = {
    className: '',
    subjects: [],
    timeSlots: [],
    days: [],
  };

  const ref = makeReferenceData();
  const result = await generateTimetableFromChronogram(chronogram, 1, ref);

  console.assert(result.conflicts.length > 0, 'Should have conflicts for empty data');
  console.log(`  Conflicts: ${result.conflicts.join(', ')}`);
  console.log('  PASSED\n');
}

// ============================================================
// Run all tests
// ============================================================
async function runAllTests() {
  console.log('=== AI Timetable Generator Tests ===\n');

  try {
    await testBasicGeneration();
    await testEmptyTeacherId();
    await testTeacherConstraints();
    await testImpossibleSchedule();
    await testFairDistribution();
    await testMalformedData();

    console.log('=== All tests passed ===');
  } catch (error: any) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

runAllTests();
