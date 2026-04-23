import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { timetableApi, announcementApi } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { Announcement, Language } from '../../types';
import { t } from '../../utils/translations';
import './Display.css';

interface DisplayProps {
  language?: Language;
  filterClassId?: number;
  filterLevel?: string;
  rotationSpeed?: number;
}

interface TimetableEntry {
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
  day_of_week: number;
  is_temporary: number;
  temporary_date: string | null;
  is_active: number;
}

const Display: React.FC<DisplayProps> = ({
  language = 'en',
  filterClassId,
  filterLevel,
  rotationSpeed = 5000,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current schedule period based on time
  const getCurrentSchedulePeriod = (now: Date): 'first-lunch' | 'lunch' | 'afternoon-break' | 'day-ended' | 'etude' | 'school-hours' | null => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeMinutes = hours * 60 + minutes;

    // Morning Break: 10:10 AM - 10:25 AM (610 - 625 minutes)
    if (timeMinutes >= 610 && timeMinutes < 625) {
      return 'first-lunch';
    }

    // Lunch Break: 12:25 PM - 1:25 PM (745 - 785 minutes)
    if (timeMinutes >= 745 && timeMinutes < 785) {
      return 'lunch';
    }

    // Afternoon Break: 3:30 PM - 3:45 PM (930 - 945 minutes)
    if (timeMinutes >= 930 && timeMinutes < 945) {
      return 'afternoon-break';
    }

    // Etude Time: 6:30 PM - 8:25 PM (1110 - 1225 minutes)
    if (timeMinutes >= 1110 && timeMinutes < 1225) {
      return 'etude';
    }

    // Day Ended: 5:00 PM onwards (900 minutes) until etude starts
    if (timeMinutes >= 900 && timeMinutes < 1110) {
      return 'day-ended';
    }

    // School hours: 8:00 AM - 5:00 PM with no scheduled session
    if (timeMinutes >= 480 && timeMinutes < 900) {
      return 'school-hours';
    }

    return null;
  };

  // Get countdown for etude time
  const getEtudeCountdown = (now: Date): string => {
    const etudeStart = new Date();
    etudeStart.setHours(18, 30, 0, 0);

    const etudeEnd = new Date();
    etudeEnd.setHours(20, 25, 0, 0);

    if (now > etudeEnd) {
      return 'ENDED';
    } else if (now < etudeStart) {
      const diff = etudeStart.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      const diff = etudeEnd.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Get remaining time for breaks
  const getBreakCountdown = (now: Date, endHour: number, endMinute: number): string => {
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);
    const diff = endTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get time until etude starts
  const getTimeUntilEtude = (now: Date): string => {
    const etudeStart = new Date();
    etudeStart.setHours(18, 30, 0, 0);
    const diff = etudeStart.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const schedulePeriod = getCurrentSchedulePeriod(currentTime);

  // Fetch full day timetable with polling
  const fetchSessions = useCallback(async () => {
    const params: any = {};
    if (filterClassId) params.classId = filterClassId;
    if (filterLevel) params.level = filterLevel;

    if (viewMode === 'week') {
      // Fetch weekly data
      const response = await timetableApi.getWeek(params);
      return response.data.data;
    } else {
      // Fetch single day data
      params.dayOfWeek = selectedDay;
      const response = await timetableApi.getToday(params);
      return response.data.data;
    }
  }, [filterClassId, filterLevel, selectedDay, viewMode]);

  const {
    data: sessions,
    loading: sessionsLoading,
    error: sessionsError,
    lastUpdated,
  } = usePolling<TimetableEntry[]>({
    fetchFn: fetchSessions,
    interval: 5000,
  });

  // Fetch announcements with polling
  const fetchAnnouncements = useCallback(async () => {
    const response = await announcementApi.getAll();
    return response.data.data || response.data;
  }, []);

  const { data: announcements } = usePolling<Announcement[]>({
    fetchFn: fetchAnnouncements,
    interval: 30000,
  });

  // Slideshow rotation
  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % announcements.length);
    }, rotationSpeed);

    return () => clearInterval(timer);
  }, [announcements, rotationSpeed]);

  // Format time for display
  const formatTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }, [currentTime]);

  const formatDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [currentTime]);

  // Build timetable grid: time slots x classes
  const timetableGrid = useMemo(() => {
    if (!sessions || sessions.length === 0) return { timeSlots: [], classes: [], grid: {} };

    // Define time slot order from Excel file
    const timeSlotOrder = [
      "7:50'-8:10'",
      "8:10-8:50",
      "8:50-9:30",
      "9:30-10:10",
      "10:10-10:25",
      "10:25-11:05",
      "11:05-11:45",
      "11:45-12:25",
      "12:25-13:30",
      "13:30-14:10",
      "14:10-14:50",
      "14:50-15:30",
      "15:30-15:40",
      "15:40-16:20",
      "16:20-17:00"
    ];

    // Handle weekly data structure (object with day keys)
    if (viewMode === 'week' && typeof sessions === 'object' && !Array.isArray(sessions)) {
      // Flatten weekly data into array with proper typing
      const weeklySessions = sessions as Record<number, TimetableEntry[]>;
      const allEntries = Object.values(weeklySessions).flat() as TimetableEntry[];

      // Get unique classes sorted by name
      const classes = [...new Set(allEntries.map(s => s.class_name))].sort();

      // Get unique time slots in the defined order
      const allTimeSlots = [...new Set(allEntries.map(s => `${s.start_time}-${s.end_time}`))];
      const timeSlotKeys = timeSlotOrder.filter(slot => allTimeSlots.includes(slot));

      // Build grid: key = "startTime-endTime|className|dayOfWeek" -> entry
      const grid: Record<string, TimetableEntry> = {};
      allEntries.forEach(entry => {
        const key = `${entry.start_time}-${entry.end_time}|${entry.class_name}|${entry.day_of_week}`;
        grid[key] = entry;
      });

      return { timeSlots: timeSlotKeys, classes, grid };
    }

    // Handle single day data structure (array)
    const sessionsArray = Array.isArray(sessions) ? sessions : [];

    // Get unique classes sorted by name
    const classes = [...new Set(sessionsArray.map(s => s.class_name))].sort();

    // Get unique time slots in the defined order
    const allTimeSlots = [...new Set(sessionsArray.map(s => `${s.start_time}-${s.end_time}`))];
    const timeSlotKeys = timeSlotOrder.filter(slot => allTimeSlots.includes(slot));

    // Build grid: key = "startTime-endTime|className" -> entry
    const grid: Record<string, TimetableEntry> = {};
    sessionsArray.forEach(entry => {
      const key = `${entry.start_time}-${entry.end_time}|${entry.class_name}`;
      grid[key] = entry;
    });

    return { timeSlots: timeSlotKeys, classes, grid };
  }, [sessions, viewMode]);

  // Check if a session is currently happening
  const isCurrentSession = (startTime: string, endTime: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    return timeStr >= startTime && timeStr <= endTime;
  };

  // Get current session for real-time display
  const getCurrentSession = () => {
    if (!sessions) return null;
    
    // Handle weekly data (object)
    if (typeof sessions === 'object' && !Array.isArray(sessions)) {
      const weeklySessions = sessions as Record<number, TimetableEntry[]>;
      const today = new Date().getDay();
      const todaySessions = weeklySessions[today] || [];
      
      if (todaySessions.length === 0) return null;
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      return todaySessions.find(s => timeStr >= s.start_time && timeStr <= s.end_time) || null;
    }
    
    // Handle single day data (array)
    if (Array.isArray(sessions) && sessions.length === 0) return null;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    return sessions.find(s => timeStr >= s.start_time && timeStr <= s.end_time) || null;
  };

  const currentSession = getCurrentSession();

  // Get next session
  const getNextSession = () => {
    if (!sessions) return null;
    
    // Handle weekly data (object)
    if (typeof sessions === 'object' && !Array.isArray(sessions)) {
      const weeklySessions = sessions as Record<number, TimetableEntry[]>;
      const today = new Date().getDay();
      const todaySessions = weeklySessions[today] || [];
      
      if (todaySessions.length === 0) return null;
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      const futureSessions = todaySessions
        .filter(s => s.start_time > timeStr)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      return futureSessions[0] || null;
    }
    
    // Handle single day data (array)
    if (Array.isArray(sessions) && sessions.length === 0) return null;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const futureSessions = sessions
      .filter(s => s.start_time > timeStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return futureSessions[0] || null;
  };

  const nextSession = getNextSession();

  // Get countdown for a session
  const getSessionCountdown = (startTime: string): string => {
    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    const sessionStart = new Date();
    sessionStart.setHours(hours, minutes, 0, 0);
    
    if (sessionStart <= now) return '00:00:00';
    
    const diff = sessionStart.getTime() - now.getTime();
    const hoursDiff = Math.floor(diff / (1000 * 60 * 60));
    const minutesDiff = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsDiff = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hoursDiff.toString().padStart(2, '0')}:${minutesDiff.toString().padStart(2, '0')}:${secondsDiff.toString().padStart(2, '0')}`;
  };

  // Get subject-based color
  const getSubjectColor = (subjectName: string): string => {
    const colors = [
      '#1976d2', '#e91e63', '#9c27b0', '#673ab7', '#009688',
      '#4caf50', '#ff9800', '#ff5722', '#795548', '#607d8b'
    ];
    const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Connection status
  const connectionStatus = sessionsError ? 'error' : 'connected';

  if (sessionsLoading && !sessions) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('loading', language)}</p>
      </div>
    );
  }

  return (
    <div className="display-container">
      {/* Timetable Section */}
      <div className="display-timetable">
        <div className="display-header">
          <div className="display-header-left">
            <img 
              src="/uploads/announcements/logo.jpg" 
              alt="School Logo" 
              className="display-logo"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="display-title">TIMETABLE</h1>
          </div>
          <div className="display-header-center">
            <div className="display-date">{formatDate}</div>
            <div className="display-time">{formatTime}</div>
            <div className="day-navigation">
              <button
                className={`day-btn ${selectedDay === new Date().getDay() && viewMode === 'day' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDay(new Date().getDay());
                  setViewMode('day');
                }}
              >
                Today
              </button>
              <button
                className={`day-btn ${selectedDay === (new Date().getDay() + 1) % 7 && viewMode === 'day' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDay((new Date().getDay() + 1) % 7);
                  setViewMode('day');
                }}
              >
                Tomorrow
              </button>
              <button
                className={`day-btn ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
            </div>
            {nextSession && selectedDay === new Date().getDay() && (
              <div className="next-session-info">
                <span className="next-session-label">Next: {nextSession.subject_name} ({nextSession.start_time})</span>
                <span className="next-session-countdown">{getSessionCountdown(nextSession.start_time)}</span>
              </div>
            )}
          </div>
          <div className="display-header-right">
            <a href="/admin" className="admin-link">Admin</a>
          </div>
        </div>

        {(schedulePeriod === 'first-lunch' || schedulePeriod === 'lunch' || schedulePeriod === 'afternoon-break' || schedulePeriod === 'etude') ? (
          <div className="no-sessions">
            <div className="no-sessions-icon">{schedulePeriod === 'etude' ? '�' : '☕'}</div>
            {schedulePeriod === 'first-lunch' && (
              <>
                <p className="no-sessions-text">Morning Break</p>
                <div className="schedule-info">
                  <div className="schedule-row">
                    <span className="schedule-label">Time:</span>
                    <span className="schedule-time">10:10 AM - 10:25 AM</span>
                  </div>
                </div>
                <div className="etude-countdown">
                  <div className="countdown-label">Break ends in:</div>
                  <div className="countdown-timer">{getBreakCountdown(currentTime, 10, 25)}</div>
                </div>
              </>
            )}
            {schedulePeriod === 'lunch' && (
              <>
                <p className="no-sessions-text">Lunch Break</p>
                <div className="schedule-info">
                  <div className="schedule-row">
                    <span className="schedule-label">Time:</span>
                    <span className="schedule-time">12:25 PM - 1:25 PM</span>
                  </div>
                </div>
                <div className="etude-countdown">
                  <div className="countdown-label">Break ends in:</div>
                  <div className="countdown-timer">{getBreakCountdown(currentTime, 13, 25)}</div>
                </div>
              </>
            )}
            {schedulePeriod === 'afternoon-break' && (
              <>
                <p className="no-sessions-text">Afternoon Break</p>
                <div className="schedule-info">
                  <div className="schedule-row">
                    <span className="schedule-label">Time:</span>
                    <span className="schedule-time">3:30 PM - 3:45 PM</span>
                  </div>
                </div>
                <div className="etude-countdown">
                  <div className="countdown-label">Break ends in:</div>
                  <div className="countdown-timer">{getBreakCountdown(currentTime, 15, 45)}</div>
                </div>
              </>
            )}
            {schedulePeriod === 'etude' && (
              <>
                <p className="no-sessions-text">Etude Time</p>
                <div className="schedule-info">
                  <div className="schedule-row">
                    <span className="schedule-label">Time:</span>
                    <span className="schedule-time">6:30 PM - 8:25 PM</span>
                  </div>
                </div>
                <div className="etude-countdown">
                  <div className="countdown-label">{getEtudeCountdown(currentTime) === 'ENDED' ? 'Etude Ended' : 'Time Remaining:'}</div>
                  <div className="countdown-timer">{getEtudeCountdown(currentTime)}</div>
                </div>
              </>
            )}
          </div>
        ) : sessions && sessions.length === 0 ? (
          <div className="no-sessions">
            <div className="no-sessions-icon">📚</div>
            {schedulePeriod === 'day-ended' && (
              <>
                <p className="no-sessions-text">Day Ended</p>
                <div className="schedule-info">
                  <div className="schedule-row">
                    <span className="schedule-label">Next:</span>
                    <span className="schedule-time">Etude Time 6:30 PM - 8:25 PM</span>
                  </div>
                </div>
                <div className="etude-countdown">
                  <div className="countdown-label">Etude starts in:</div>
                  <div className="countdown-timer">{getTimeUntilEtude(currentTime)}</div>
                </div>
              </>
            )}
            {schedulePeriod === 'school-hours' && (
              <>
                <p className="no-sessions-text">No Sessions Scheduled</p>
                <div className="schedule-info">
                  <div className="schedule-row">
                    <span className="schedule-label">Morning Break:</span>
                    <span className="schedule-time">10:10 AM - 10:25 AM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Lunch Break:</span>
                    <span className="schedule-time">12:25 PM - 1:25 PM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Afternoon Break:</span>
                    <span className="schedule-time">3:30 PM - 3:45 PM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Day Ends:</span>
                    <span className="schedule-time">5:00 PM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Etude Time:</span>
                    <span className="schedule-time">6:30 PM - 8:25 PM</span>
                  </div>
                </div>
              </>
            )}
            {schedulePeriod === null && (
              <>
                <p className="no-sessions-text">No Sessions Scheduled</p>
                <div className="schedule-info">
                  <div className="schedule-row">
                    <span className="schedule-label">Morning Break:</span>
                    <span className="schedule-time">10:10 AM - 10:25 AM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Lunch Break:</span>
                    <span className="schedule-time">12:25 PM - 1:25 PM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Afternoon Break:</span>
                    <span className="schedule-time">3:30 PM - 3:45 PM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Day Ends:</span>
                    <span className="schedule-time">5:00 PM</span>
                  </div>
                  <div className="schedule-row">
                    <span className="schedule-label">Etude Time:</span>
                    <span className="schedule-time">6:30 PM - 8:25 PM</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : schedulePeriod === 'day-ended' ? (
          <div className="no-sessions">
            <div className="no-sessions-icon">🏁</div>
            <p className="no-sessions-text">Day Ended</p>
            <div className="schedule-info">
              <div className="schedule-row">
                <span className="schedule-label">Next:</span>
                <span className="schedule-time">Etude Time 6:30 PM - 8:25 PM</span>
              </div>
            </div>
            <div className="etude-countdown">
              <div className="countdown-label">Etude starts in:</div>
              <div className="countdown-timer">{getTimeUntilEtude(currentTime)}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Show full timetable with columns and rows */}
            {viewMode === 'week' ? (
              // Weekly view
              <div className="weekly-timetable-wrapper">
                {!sessions || typeof sessions !== 'object' || Array.isArray(sessions) ? (
                  <div className="no-sessions">
                    <div className="no-sessions-icon">📚</div>
                    <p className="no-sessions-text">No weekly data available</p>
                  </div>
                ) : (
                  Object.entries(sessions as unknown as Record<number, TimetableEntry[]>).map(([day, daySessions]) => {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayNum = parseInt(day);

                    // Ensure daySessions is an array
                    const daySessionsArray = Array.isArray(daySessions) ? daySessions : [];

                    // Define time slot order from Excel file
                    const timeSlotOrder = [
                      "7:50'-8:10'",
                      "8:10-8:50",
                      "8:50-9:30",
                      "9:30-10:10",
                      "10:10-10:25",
                      "10:25-11:05",
                      "11:05-11:45",
                      "11:45-12:25",
                      "12:25-13:30",
                      "13:30-14:10",
                      "14:10-14:50",
                      "14:50-15:30",
                      "15:30-15:40",
                      "15:40-16:20",
                      "16:20-17:00"
                    ];

                    // Build grid for this day
                    const classes = [...new Set(daySessionsArray.map(s => s.class_name))].sort();
                    const allTimeSlots = [...new Set(daySessionsArray.map(s => `${s.start_time}-${s.end_time}`))];
                    const timeSlotKeys = timeSlotOrder.filter(slot => allTimeSlots.includes(slot));
                    const grid: Record<string, TimetableEntry> = {};
                    daySessionsArray.forEach(entry => {
                      const key = `${entry.start_time}-${entry.end_time}|${entry.class_name}`;
                      grid[key] = entry;
                    });

                    if (daySessionsArray.length === 0) return null;

                    return (
                      <div key={day} className="day-section">
                        <h3 className="day-title">{dayNames[dayNum]}</h3>
                        <div className="timetable-table-wrapper">
                          <table className="timetable-table">
                            <thead>
                              <tr>
                                <th className="time-header">TIME</th>
                                {classes.map(cls => (
                                  <th key={cls} className="class-header">{cls}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {timeSlotKeys.map(slot => {
                                const [start, end] = slot.split('-');
                                return (
                                  <tr key={slot}>
                                    <td className="time-cell">
                                      <span className="time-range">{start}</span>
                                      <span className="time-sep">-</span>
                                      <span className="time-range">{end}</span>
                                    </td>
                                    {classes.map(cls => {
                                      const key = `${slot}|${cls}`;
                                      const entry = grid[key];
                                      const subjectColor = entry ? getSubjectColor(entry.subject_name) : 'transparent';
                                      const hasTeacher = entry && entry.teacher_name && entry.teacher_name !== 'null';
                                      // Check if teacher is currently scheduled (within time slot)
                                      const [start, end] = slot.split('-');
                                      const isTeacherScheduled = hasTeacher && isCurrentSession(start, end);
                                      return (
                                        <td key={cls} className={`cell ${entry ? 'has-session' : 'empty'} ${hasTeacher ? 'has-teacher' : 'no-teacher'}`} style={{ backgroundColor: entry ? subjectColor : 'transparent' }}>
                                          {entry ? (
                                            <div className="cell-content">
                                              <div className="cell-subject">{entry.subject_name}</div>
                                              <div className="cell-teacher">
                                                {entry.teacher_name || 'No Teacher'}
                                                {isTeacherScheduled && <span className="teacher-indicator active">✓</span>}
                                              </div>
                                              <div className="cell-room">{entry.classroom_name}</div>
                                            </div>
                                          ) : (
                                            <div className="cell-empty">-</div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : timetableGrid.classes.length > 0 && timetableGrid.timeSlots.length > 0 ? (
              // Single day view
              <div className="timetable-table-wrapper">
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th className="time-header">TIME</th>
                      {timetableGrid.classes.map(cls => (
                        <th key={cls} className="class-header">{cls}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timetableGrid.timeSlots.map(slot => {
                      const [start, end] = slot.split('-');
                      const isCurrent = isCurrentSession(start, end);
                      return (
                        <tr key={slot} className={isCurrent ? 'current-row' : ''}>
                          <td className="time-cell">
                            <span className="time-range">{start}</span>
                            <span className="time-sep">-</span>
                            <span className="time-range">{end}</span>
                            {isCurrent && <span className="now-indicator">NOW</span>}
                          </td>
                          {timetableGrid.classes.map(cls => {
                            const key = `${slot}|${cls}`;
                            const entry = timetableGrid.grid[key];
                            const subjectColor = entry ? getSubjectColor(entry.subject_name) : 'transparent';
                            const hasTeacher = entry && entry.teacher_name && entry.teacher_name !== 'null';
                            // Check if teacher is currently scheduled (within time slot)
                            const isTeacherScheduled = hasTeacher && isCurrentSession(start, end);
                            return (
                              <td key={cls} className={`cell ${isCurrent ? 'current-cell' : ''} ${entry ? 'has-session' : 'empty'} ${hasTeacher ? 'has-teacher' : 'no-teacher'}`} style={{ backgroundColor: entry ? subjectColor : 'transparent' }}>
                                {entry ? (
                                  <div className="cell-content">
                                    <div className="cell-subject">{entry.subject_name}</div>
                                    <div className="cell-teacher">
                                      {entry.teacher_name || 'No Teacher'}
                                      {isTeacherScheduled && <span className="teacher-indicator active">✓</span>}
                                    </div>
                                    <div className="cell-room">{entry.classroom_name}</div>
                                  </div>
                                ) : (
                                  <div className="cell-empty">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-sessions">
                <div className="no-sessions-icon">📚</div>
                <p className="no-sessions-text">No Timetable Data Available</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Announcements Section */}
      <div className="display-announcements">
        <div className="announcements-header">
          <h2 className="announcements-title">{t('announcements', language)}</h2>
        </div>
        
        <div className="slideshow-container">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className={`announcement-slide ${index === currentSlide ? 'active' : ''}`}
              >
                {announcement.image_url ? (
                  <img
                    src={announcement.image_url}
                    alt={announcement.title}
                    className="announcement-image"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div className="announcement-text-only" style={{ display: announcement.image_url ? 'none' : 'flex' }}>
                  <div className="announcement-icon">📢</div>
                  <div className="announcement-text-content">
                    <h3 className="announcement-title">{announcement.title}</h3>
                  </div>
                </div>
                {announcement.image_url && (
                  <div className="announcement-overlay">
                    <h3 className="announcement-title">{announcement.title}</h3>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="announcement-slide active">
              <div className="no-sessions" style={{ padding: '40px' }}>
                <div className="no-sessions-icon">📢</div>
                <p className="no-sessions-text">No announcements</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-indicator">
          <span className={`status-dot ${connectionStatus}`}></span>
          <span>{connectionStatus === 'connected' ? 'Live' : t('connectionError', language)}</span>
        </div>
        <div>
          {t('lastUpdated', language)}:{' '}
          {lastUpdated?.toLocaleTimeString() || '--'}
        </div>
      </div>
    </div>
  );
};

export default Display;
