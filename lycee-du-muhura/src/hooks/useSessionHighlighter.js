import { useState, useEffect } from 'react';

/**
 * Hook to highlight current and next session dynamically
 * Updates every minute to track real-time session status
 */
export const useSessionHighlighter = (timetable) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [isBreakTime, setIsBreakTime] = useState(false);

  useEffect(() => {
    const updateSessions = () => {
      const now = new Date();
      const currentTime = now.getTime();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Get today's sessions
      const todaySessions = timetable.filter(t => t.day === currentDay);
      
      // Find current session
      const current = todaySessions.find(session => {
        const start = parseTime(session.startTime);
        const end = parseTime(session.endTime);
        return currentTime >= start && currentTime <= end;
      });
      
      // Find next session
      const next = todaySessions.find(session => {
        const start = parseTime(session.startTime);
        return start > currentTime;
      });
      
      // Check if in break (between sessions)
      const nextStart = next ? parseTime(next.startTime) : null;
      const currentEnd = current ? parseTime(current.endTime) : null;
      
      const inBreak = currentEnd && nextStart && currentTime > currentEnd && currentTime < nextStart;
      
      setCurrentSession(current || null);
      setNextSession(next || null);
      setIsBreakTime(inBreak);
    };

    updateSessions();
    const interval = setInterval(updateSessions, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [timetable]);

  return { currentSession, nextSession, isBreakTime };
};

// Helper: Parse time string to timestamp
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};
