import React, { useState, useEffect, useMemo } from 'react';
import { timetableApi } from '../../services/api';
import { TimetableEntry } from '../../types';
import './FullTimetableView.css';

// Session types for color coding
export enum SessionType {
  LESSON = 'lesson',
  BREAK = 'break',
  FREE = 'free',
  SPECIAL = 'special'
}

// Determine session type based on subject name
const getSessionType = (subjectName: string): SessionType => {
  const upperName = subjectName.toUpperCase();
  
  if (upperName.includes('BREAK') || upperName.includes('LUNCH') || upperName.includes('RECESS')) {
    return SessionType.BREAK;
  }
  
  if (upperName.includes('FREE') || upperName.includes('STUDY') || upperName.includes('SELF')) {
    return SessionType.FREE;
  }
  
  if (upperName.includes('ASSEMBLY') || upperName.includes('EVENT') || upperName.includes('MEETING')) {
    return SessionType.SPECIAL;
  }
  
  return SessionType.LESSON;
};

// TimetableCell component
const TimetableCell: React.FC<{
  entry: TimetableEntry | null;
  isCurrent: boolean;
}> = ({ entry, isCurrent }) => {
  if (!entry) {
    return <div className="empty-cell">-</div>;
  }

  const sessionType = getSessionType(entry.subject_name);
  
  return (
    <div className={`entry-card ${sessionType} ${isCurrent ? 'current' : ''}`}>
      <div className="entry-subject">{entry.subject_name}</div>
      <div className="entry-teacher">{entry.teacher_name}</div>
      <div className="entry-room">{entry.classroom_name}</div>
      <div className="entry-time">
        {entry.start_time} - {entry.end_time}
      </div>
    </div>
  );
};

// TimetableGrid component
const TimetableGrid: React.FC<{
  weeklyData: Record<number, TimetableEntry[]>;
  timeSlots: string[];
  daysOfWeek: Array<{ value: number; label: string; short: string }>;
  selectedDay: number;
  currentSessions: TimetableEntry[];
}> = ({ weeklyData, timeSlots, daysOfWeek, selectedDay, currentSessions }) => {
  const getAllClasses = () => {
    const allClasses = new Set<string>();
    Object.values(weeklyData).forEach(entries => {
      entries.forEach(entry => allClasses.add(entry.class_name));
    });
    return Array.from(allClasses).sort();
  };

  const getEntryForSlot = (day: number, timeSlot: string, className: string): TimetableEntry | null => {
    const dayEntries = weeklyData[day] || [];
    return dayEntries.find(entry => entry.start_time === timeSlot && entry.class_name === className) || null;
  };

  const isCurrentSession = (entry: TimetableEntry): boolean => {
    return currentSessions.some(
      current => current.id === entry.id || 
      (current.start_time === entry.start_time && current.class_name === entry.class_name)
    );
  };

  return (
    <div className="timetable-grid">
      <div className="time-column">
        <div className="corner-cell">Time</div>
        {timeSlots.map(slot => (
          <div key={slot} className="time-slot">{slot}</div>
        ))}
      </div>

      {getAllClasses().map(className => (
        <div key={className} className="class-column">
          <div className="class-header">
            <div className="class-name">{className}</div>
          </div>
          {timeSlots.map(slot => {
            const entry = getEntryForSlot(selectedDay, slot, className);
            return (
              <div key={slot} className="schedule-cell">
                <TimetableCell 
                  entry={entry} 
                  isCurrent={entry ? isCurrentSession(entry) : false}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const FullTimetableView: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<Record<number, TimetableEntry[]>>({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  });
  const [referenceData, setReferenceData] = useState<any>(null);
  const [currentSessions, setCurrentSessions] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedTeacher, setSelectedTeacher] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ];

  const timeSlots = [
    '08:10', '08:50', '09:30', '10:10', '10:25', '11:05', '11:45', '12:25', '13:30', '14:10', '14:50', '15:30', '15:40', '16:20', '17:00'
  ];

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedTeacher, selectedSubject]);

  // Fetch current sessions for real-time highlighting
  useEffect(() => {
    const fetchCurrentSessions = async () => {
      try {
        const params: any = {};
        if (selectedClass) params.classId = Number(selectedClass);
        const response = await timetableApi.getCurrentSessions(params);
        setCurrentSessions(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch current sessions:', err);
      }
    };

    fetchCurrentSessions();
    const interval = setInterval(fetchCurrentSessions, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedClass]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedClass) params.classId = Number(selectedClass);
      
      const [weeklyRes, refRes] = await Promise.all([
        timetableApi.getWeek(params),
        timetableApi.getReferenceData(),
      ]);

      setWeeklyData(weeklyRes.data.data);
      setReferenceData(refRes.data.data);
      
      // Filter by teacher if selected
      if (selectedTeacher) {
        const filtered: Record<number, TimetableEntry[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        Object.keys(weeklyRes.data.data).forEach(day => {
          filtered[Number(day)] = weeklyRes.data.data[Number(day)].filter(
            (entry: TimetableEntry) => entry.teacher_id === Number(selectedTeacher)
          );
        });
        setWeeklyData(filtered);
      }

      // Filter by subject if selected
      if (selectedSubject) {
        const filtered: Record<number, TimetableEntry[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        Object.keys(weeklyData).forEach(day => {
          filtered[Number(day)] = weeklyData[Number(day)].filter(
            (entry: TimetableEntry) => entry.subject_id === Number(selectedSubject)
          );
        });
        setWeeklyData(filtered);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };


  const getClassLevel = (className: string) => {
    const match = className.match(/^(L\d|S\d)/);
    return match ? match[1] : 'Other';
  };

  const groupedClasses = useMemo(() => {
    return referenceData?.classes?.reduce((acc: any, cls: any) => {
      const level = getClassLevel(cls.name);
      if (!acc[level]) acc[level] = [];
      acc[level].push(cls);
      return acc;
    }, {}) || {};
  }, [referenceData]);

  if (loading) return <div className="timetable-view-loading">Loading timetable...</div>;

  if (error) return <div className="timetable-view-error">Error: {error}</div>;

  return (
    <div className="full-timetable-view">
      <div className="timetable-view-header">
        <h1>Full Timetable View</h1>
        <div className="view-controls">
          <button
            className={`view-mode-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly View
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            Daily View
          </button>
        </div>
      </div>

      <div className="timetable-filters">
        <div className="filter-group">
          <label>Filter by Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All Classes</option>
            {Object.entries(groupedClasses).map(([level, classes]: [string, any]) => (
              <optgroup key={level} label={level}>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Teacher:</label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All Teachers</option>
            {referenceData?.teachers?.map((teacher: any) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All Subjects</option>
            {referenceData?.subjects?.map((subject: any) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <div className="weekly-timetable">
          <div className="day-selector">
            {daysOfWeek.map(day => (
              <button
                key={day.value}
                className={`day-btn ${selectedDay === day.value ? 'active' : ''}`}
                onClick={() => setSelectedDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>

          <TimetableGrid
            weeklyData={weeklyData}
            timeSlots={timeSlots}
            daysOfWeek={daysOfWeek}
            selectedDay={selectedDay}
            currentSessions={currentSessions}
          />
        </div>
      ) : (
        <div className="daily-timetable">
          <div className="day-selector">
            {daysOfWeek.map(day => (
              <button
                key={day.value}
                className={`day-btn ${selectedDay === day.value ? 'active' : ''}`}
                onClick={() => setSelectedDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="daily-schedule">
            <h2>{daysOfWeek.find(d => d.value === selectedDay)?.label}</h2>
            <div className="daily-list">
              {weeklyData[selectedDay]?.length > 0 ? (
                weeklyData[selectedDay].map((entry, index) => (
                  <div key={entry.id} className="daily-entry">
                    <div className="entry-time">
                      <span className="start-time">{entry.start_time}</span>
                      <span className="time-separator">-</span>
                      <span className="end-time">{entry.end_time}</span>
                    </div>
                    <div className="entry-details">
                      <div className="entry-class">{entry.class_name}</div>
                      <div className="entry-subject">{entry.subject_name}</div>
                      <div className="entry-teacher">Teacher: {entry.teacher_name}</div>
                      <div className="entry-room">Room: {entry.classroom_name}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-classes">No classes scheduled for this day</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="timetable-summary">
        <h3>Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Classes:</span>
            <span className="stat-value">
              {Object.values(weeklyData).reduce((sum, entries) => sum + entries.length, 0)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Days:</span>
            <span className="stat-value">
              {Object.values(weeklyData).filter(entries => entries.length > 0).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Current Sessions:</span>
            <span className="stat-value">{currentSessions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Classes per Day (avg):</span>
            <span className="stat-value">
              {Object.values(weeklyData).filter(entries => entries.length > 0).length > 0
                ? (Object.values(weeklyData).reduce((sum, entries) => sum + entries.length, 0) / 
                   Object.values(weeklyData).filter(entries => entries.length > 0).length).toFixed(1)
                : 0}
            </span>
          </div>
        </div>
      </div>

      <div className="timetable-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item lesson">
            <span className="legend-color"></span>
            <span>Lessons</span>
          </div>
          <div className="legend-item break">
            <span className="legend-color"></span>
            <span>Breaks</span>
          </div>
          <div className="legend-item free">
            <span className="legend-color"></span>
            <span>Free Time</span>
          </div>
          <div className="legend-item special">
            <span className="legend-color"></span>
            <span>Special Sessions</span>
          </div>
          <div className="legend-item current">
            <span className="legend-color"></span>
            <span>Current Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullTimetableView;
