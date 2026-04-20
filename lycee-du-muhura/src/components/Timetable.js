import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Trash2, 
  Move,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Save,
  Wand2,
  CalendarDays,
  List,
  Bell,
  Settings
} from 'lucide-react';
import apiService from '../services/api';
import { useSessionHighlighter } from '../hooks/useSessionHighlighter';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';
import './Timetable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { start: '08:00', end: '09:30' },
  { start: '09:45', end: '11:15' },
  { start: '11:30', end: '13:00' },
  { start: '14:00', end: '15:30' },
  { start: '15:45', end: '17:15' }
];
const ROOMS = ['Room 101', 'Room 102', 'Room 103', 'Lab 1', 'Lab 2'];

function Timetable({ classFilter, teachers = [], subjects = [], readOnly = false }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'daily'
  const [selectedDay, setSelectedDay] = useState('Monday');
  
  // Hooks
  const { currentSession, nextSession, isBreakTime } = useSessionHighlighter(timetable);
  const { notificationSettings, updateSettings } = useNotificationScheduler(timetable);
  
  // Form states
  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:30',
    subject: '',
    teacherId: '',
    teacherName: '',
    room: 'Room 101'
  });
  
  // Auto-generate form
  const [generateForm, setGenerateForm] = useState({
    selectedSubjects: [],
    teacherAssignments: {}
  });

  useEffect(() => {
    loadTimetable();
  }, [classFilter]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const params = classFilter ? { classFilter } : {};
      const data = await apiService.request('/api/timetable', 'GET', null, params);
      setTimetable(data.timetable || []);
    } catch (err) {
      setError('Failed to load timetable');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      setConflictError(null);
      const teacher = teachers.find(t => t._id === newSlot.teacherId);
      const slotData = {
        ...newSlot,
        teacherName: teacher?.name || 'Unknown',
        class: classFilter
      };
      
      await apiService.request('/api/timetable', 'POST', slotData);
      setShowAddModal(false);
      loadTimetable();
      // Reset form
      setNewSlot({
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:30',
        subject: '',
        teacherId: '',
        teacherName: '',
        room: 'Room 101'
      });
    } catch (err) {
      if (err.message.includes('conflict') || err.status === 409) {
        setConflictError(err.message || 'Schedule conflict detected!');
      } else {
        setError('Failed to add slot');
      }
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    try {
      await apiService.request(`/api/timetable/${slotId}`, 'DELETE');
      loadTimetable();
    } catch (err) {
      setError('Failed to delete slot');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (slot) => {
    setDraggedSlot(slot);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, day, timeSlot) => {
    e.preventDefault();
    if (!draggedSlot) return;
    
    // Prevent dropping on same position
    if (draggedSlot.day === day && draggedSlot.startTime === timeSlot.start) {
      setDraggedSlot(null);
      return;
    }
    
    try {
      setConflictError(null);
      const updatedSlot = {
        day,
        startTime: timeSlot.start,
        endTime: timeSlot.end
      };
      
      await apiService.request(`/api/timetable/${draggedSlot._id}`, 'PUT', updatedSlot);
      setDraggedSlot(null);
      loadTimetable();
    } catch (err) {
      if (err.message.includes('conflict') || err.status === 409) {
        setConflictError(`Cannot move: ${err.message || 'Schedule conflict!'}`);
        setTimeout(() => setConflictError(null), 5000);
      } else {
        setError('Failed to update slot');
      }
      setDraggedSlot(null);
    }
  };

  // Auto-generate timetable
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setConflictError(null);
      
      const teacherAssignments = {};
      generateForm.selectedSubjects.forEach(subject => {
        const teacherId = generateForm.teacherAssignments[subject];
        const teacher = teachers.find(t => t._id === teacherId);
        teacherAssignments[subject] = {
          id: teacherId,
          name: teacher?.name || 'Unknown'
        };
      });
      
      const data = await apiService.request('/api/timetable/generate', 'POST', {
        class: classFilter,
        subjects: generateForm.selectedSubjects,
        teacherAssignments
      });
      
      if (data.partial) {
        setConflictError(`Partial generation: ${data.failed.length} subjects could not be scheduled due to conflicts`);
      }
      
      setShowGenerateModal(false);
      loadTimetable();
    } catch (err) {
      setError('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubjectSelection = (subject) => {
    setGenerateForm(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subject)
        ? prev.selectedSubjects.filter(s => s !== subject)
        : [...prev.selectedSubjects, subject]
    }));
  };

  const assignTeacher = (subject, teacherId) => {
    setGenerateForm(prev => ({
      ...prev,
      teacherAssignments: {
        ...prev.teacherAssignments,
        [subject]: teacherId
      }
    }));
  };

  // Get slot for specific day and time
  const getSlot = (day, timeSlot) => {
    return timetable.find(t => 
      t.day === day && 
      t.startTime === timeSlot.start && 
      t.class === classFilter
    );
  };

  // Check if a slot is being dragged
  const isDragging = (slot) => {
    return draggedSlot && draggedSlot._id === slot._id;
  };

  return (
    <div className="timetable-container">
      {/* Session Status Bar */}
      {(currentSession || nextSession || isBreakTime) && (
        <div className={`session-status-bar ${isBreakTime ? 'break' : currentSession ? 'active' : 'upcoming'}`}>
          <div className="status-content">
            {isBreakTime ? (
              <>
                <Clock size={18} />
                <span>Break Time - Next: {nextSession?.subject} at {nextSession?.startTime}</span>
              </>
            ) : currentSession ? (
              <>
                <CheckCircle size={18} />
                <span>Now: {currentSession.subject} ({currentSession.startTime} - {currentSession.endTime})</span>
              </>
            ) : (
              <>
                <Bell size={18} />
                <span>Upcoming: {nextSession?.subject} at {nextSession?.startTime}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="timetable-header">
        <h2><Calendar size={24} /> Timetable {classFilter && `- ${classFilter}`}</h2>
        <div className="timetable-actions">
          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={viewMode === 'weekly' ? 'active' : ''}
              onClick={() => setViewMode('weekly')}
            >
              <CalendarDays size={16} /> Weekly
            </button>
            <button 
              className={viewMode === 'daily' ? 'active' : ''}
              onClick={() => setViewMode('daily')}
            >
              <List size={16} /> Daily
            </button>
          </div>
          
          {/* Day Selector for Daily View */}
          {viewMode === 'daily' && (
            <select 
              value={selectedDay} 
              onChange={(e) => setSelectedDay(e.target.value)}
              className="day-selector"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          )}
          
          {!readOnly && (
            <>
              <button 
                className="btn-notification"
                onClick={() => setShowNotificationSettings(true)}
                title="Notification Settings"
              >
                <Bell size={16} />
              </button>
              <button 
                className="btn-generate"
                onClick={() => setShowGenerateModal(true)}
                disabled={!classFilter}
              >
                <Wand2 size={16} /> Auto-Generate
              </button>
              <button 
                className="btn-add"
                onClick={() => setShowAddModal(true)}
                disabled={!classFilter}
              >
                <Plus size={16} /> Add Slot
              </button>
            </>
          )}
          <button 
            className="btn-refresh"
            onClick={loadTimetable}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {conflictError && (
        <div className="conflict-alert">
          <AlertCircle size={20} />
          <span>{conflictError}</span>
          <button onClick={() => setConflictError(null)}><X size={16} /></button>
        </div>
      )}

      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {!classFilter ? (
        <div className="no-class-message">
          <Calendar size={48} />
          <p>Please select a class to view or edit the timetable</p>
        </div>
      ) : loading ? (
        <div className="loading">Loading timetable...</div>
      ) : (
        <>
          {/* Timetable Grid */}
          <div className="timetable-grid">
            {viewMode === 'weekly' ? (
              <>
                {/* Header Row - Days */}
                <div className="grid-header">
                  <div className="time-header">Time</div>
                  {DAYS.map(day => (
                    <div key={day} className="day-header">{day}</div>
                  ))}
                </div>

                {/* Time Slots */}
                {TIME_SLOTS.map((timeSlot, index) => (
                  <div key={index} className="grid-row">
                    <div className="time-cell">
                      <Clock size={14} />
                      <span>{timeSlot.start} - {timeSlot.end}</span>
                    </div>
                    {DAYS.map(day => {
                      const slot = getSlot(day, timeSlot);
                      return (
                        <div
                          key={`${day}-${index}`}
                          className={`slot-cell ${slot ? 'filled' : 'empty'} ${isDragging(slot) ? 'dragging' : ''} ${currentSession?._id === slot?._id ? 'current-session' : ''} ${nextSession?._id === slot?._id ? 'next-session' : ''} ${readOnly ? 'read-only' : ''}`}
                          onDragOver={!readOnly ? handleDragOver : undefined}
                          onDrop={!readOnly ? (e) => handleDrop(e, day, timeSlot) : undefined}
                        >
                          {slot ? (
                            <div
                              className="slot-content"
                              draggable={!readOnly}
                              onDragStart={!readOnly ? () => handleDragStart(slot) : undefined}
                            >
                              <div className="slot-subject">{slot.subject}</div>
                              <div className="slot-details">
                                <span><User size={12} /> {slot.teacherName}</span>
                                <span><MapPin size={12} /> {slot.room}</span>
                              </div>
                              {!readOnly && (
                                <div className="slot-actions">
                                  <Move size={14} className="drag-handle" title="Drag to move" />
                                  <button 
                                    onClick={() => handleDeleteSlot(slot._id)}
                                    className="delete-btn"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="empty-slot">
                              <Plus size={20} />
                            </div>
                          )}
                        </div>
                      );
                })}
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* Daily View */}
                <div className="daily-view">
                  <div className="daily-header">
                    <h3>{selectedDay}</h3>
                  </div>
                  {TIME_SLOTS.map((timeSlot, index) => {
                    const slot = getSlot(selectedDay, timeSlot);
                    return (
                      <div key={index} className={`daily-slot ${slot ? 'filled' : 'empty'} ${currentSession?._id === slot?._id ? 'current-session' : ''} ${nextSession?._id === slot?._id ? 'next-session' : ''}`}>
                        <div className="daily-time">
                          <Clock size={16} />
                          <span>{timeSlot.start} - {timeSlot.end}</span>
                        </div>
                        {slot ? (
                          <div className="daily-content">
                            <div className="daily-subject">{slot.subject}</div>
                            <div className="daily-details">
                              <span><User size={14} /> {slot.teacherName}</span>
                              <span><MapPin size={14} /> {slot.room}</span>
                            </div>
                            <div className="daily-actions">
                              <button onClick={() => handleDeleteSlot(slot._id)} className="delete-btn">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="daily-empty">
                            <span>Free period</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="timetable-legend">
            <div className="legend-item">
              <Move size={14} />
              <span>Drag & drop to move classes</span>
            </div>
            <div className="legend-item">
              <CheckCircle size={14} />
              <span>Auto-conflict detection enabled</span>
            </div>
          </div>
        </>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3><Plus size={20} /> Add New Slot</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSlot}>
              <div className="form-group">
                <label>Subject</label>
                <select 
                  value={newSlot.subject} 
                  onChange={(e) => setNewSlot({...newSlot, subject: e.target.value})}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select 
                  value={newSlot.teacherId} 
                  onChange={(e) => setNewSlot({...newSlot, teacherId: e.target.value})}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Day</label>
                  <select 
                    value={newSlot.day} 
                    onChange={(e) => setNewSlot({...newSlot, day: e.target.value})}
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <select 
                    value={`${newSlot.startTime}-${newSlot.endTime}`}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split('-');
                      setNewSlot({...newSlot, startTime: start, endTime: end});
                    }}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={`${t.start}-${t.end}`} value={`${t.start}-${t.end}`}>
                        {t.start} - {t.end}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Room</label>
                <select 
                  value={newSlot.room} 
                  onChange={(e) => setNewSlot({...newSlot, room: e.target.value})}
                >
                  {ROOMS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <Save size={16} /> Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal generate-modal">
            <div className="modal-header">
              <h3><Wand2 size={20} /> Auto-Generate Timetable</h3>
              <button onClick={() => setShowGenerateModal(false)}><X size={20} /></button>
            </div>
            <div className="generate-content">
              <p className="generate-info">
                Select subjects and assign teachers. The system will automatically 
                schedule classes while avoiding conflicts.
              </p>
              
              <div className="subjects-list">
                <h4>Select Subjects</h4>
                {subjects.map(subject => (
                  <div key={subject} className="subject-assignment">
                    <label className="subject-checkbox">
                      <input
                        type="checkbox"
                        checked={generateForm.selectedSubjects.includes(subject)}
                        onChange={() => toggleSubjectSelection(subject)}
                      />
                      <span>{subject}</span>
                    </label>
                    {generateForm.selectedSubjects.includes(subject) && (
                      <select
                        className="teacher-select"
                        value={generateForm.teacherAssignments[subject] || ''}
                        onChange={(e) => assignTeacher(subject, e.target.value)}
                        required
                      >
                        <option value="">Assign Teacher</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-generate-confirm"
                  onClick={handleGenerate}
                  disabled={generateForm.selectedSubjects.length === 0 || loading}
                >
                  {loading ? 'Generating...' : <><Wand2 size={16} /> Generate</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3><Bell size={20} /> Notification Settings</h3>
              <button onClick={() => setShowNotificationSettings(false)}><X size={20} /></button>
            </div>
            <form>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.enabled}
                    onChange={(e) => updateSettings({ enabled: e.target.checked })}
                  />
                  Enable Notifications
                </label>
              </div>
              <div className="form-group">
                <label>Session Reminder (minutes before)</label>
                <select
                  value={notificationSettings.sessionReminder}
                  onChange={(e) => updateSettings({ sessionReminder: parseInt(e.target.value) })}
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Break Reminder (minutes before break ends)</label>
                <select
                  value={notificationSettings.breakReminder}
                  onChange={(e) => updateSettings({ breakReminder: parseInt(e.target.value) })}
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNotificationSettings(false)}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timetable;
