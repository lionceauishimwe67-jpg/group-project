import { io } from '../server';

// Day End Scheduler - Automatically clears timetable display at end of day
// and resets for the next day

const SCHOOL_END_TIME = '17:00'; // 5:00 PM - regular school ends
const ETUDE_END_TIME = '20:25'; // 8:25 PM - etude ends (final end of day)
const SCHOOL_START_TIME = '08:10'; // 8:10 AM - school starts

let dayEndedEmitted = false;
let dayResetEmitted = false;
let lastCheckedDate = '';

export const startDayEndScheduler = () => {
  console.log('Day-end scheduler started');

  const checkDayEnd = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const currentDate = now.toDateString();

    // Reset flags on new day
    if (currentDate !== lastCheckedDate) {
      lastCheckedDate = currentDate;
      dayEndedEmitted = false;
      dayResetEmitted = false;
    }

    // Emit day-ended event after etude ends (20:25)
    if (currentTime >= ETUDE_END_TIME && !dayEndedEmitted) {
      dayEndedEmitted = true;
      console.log('School day has ended - emitting day-ended event');
      
      io.to('display').emit('day-ended', {
        message: 'School day has ended',
        endTime: ETUDE_END_TIME,
        nextStartTime: SCHOOL_START_TIME,
        date: currentDate,
        timestamp: now.toISOString()
      });
    }

    // Emit day-reset event when school starts in the morning (08:10)
    if (currentTime >= SCHOOL_START_TIME && currentTime < SCHOOL_START_TIME.replace('0', '1') && !dayResetEmitted && now.getDay() >= 1 && now.getDay() <= 5) {
      dayResetEmitted = true;
      console.log('New school day starting - emitting day-reset event');
      
      io.to('display').emit('day-reset', {
        message: 'New school day has started',
        startTime: SCHOOL_START_TIME,
        dayOfWeek: now.getDay(),
        date: currentDate,
        timestamp: now.toISOString()
      });
    }
  };

  // Check every 30 seconds
  const interval = setInterval(checkDayEnd, 30000);
  
  // Initial check
  checkDayEnd();

  return interval;
};

// Manual trigger for day-end (for testing)
export const triggerDayEnd = () => {
  const now = new Date();
  io.to('display').emit('day-ended', {
    message: 'School day has ended (manual trigger)',
    endTime: ETUDE_END_TIME,
    nextStartTime: SCHOOL_START_TIME,
    date: now.toDateString(),
    timestamp: now.toISOString()
  });
};

// Manual trigger for day-reset (for testing)
export const triggerDayReset = () => {
  const now = new Date();
  io.to('display').emit('day-reset', {
    message: 'New school day has started (manual trigger)',
    startTime: SCHOOL_START_TIME,
    dayOfWeek: now.getDay(),
    date: now.toDateString(),
    timestamp: now.toISOString()
  });
};
