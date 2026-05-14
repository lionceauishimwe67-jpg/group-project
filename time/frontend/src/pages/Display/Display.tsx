import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { timetableApi, announcementApi } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { useSocket } from '../../context/SocketContext';
import { useBellSound } from '../../hooks/useBellSound';
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
  const { bellTriggered, bellData, joinDisplayRoom, announcementUpdated } = useSocket();
  const { playBellSound } = useBellSound();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Join display room for WebSocket updates
  useEffect(() => {
    joinDisplayRoom();
  }, [joinDisplayRoom]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // No schedule period banners in live-only mode.

  // Fetch current active teaching sessions in real time
  const fetchSessions = useCallback(async () => {
    const params: any = {};
    if (filterClassId) params.classId = filterClassId;
    if (filterLevel) params.level = filterLevel;
    const response = await timetableApi.getCurrentSessions(params);
    return response.data.data;
  }, [filterClassId, filterLevel]);

  const {
    data: sessions,
    loading: sessionsLoading,
    error: sessionsError,
    lastUpdated,
    refresh: refreshSessions,
  } = usePolling<TimetableEntry[]>({
    fetchFn: fetchSessions,
    interval: 5000,
  });

  const fetchAnnouncements = useCallback(async () => {
    const response = await announcementApi.getAll();
    return response.data.data || response.data;
  }, [announcementRefreshKey]);

  const {
    data: announcements,
  } = usePolling<Announcement[]>({
    fetchFn: fetchAnnouncements,
    interval: 60000,
  });

  useEffect(() => {
    if (announcementUpdated > 0) {
      setAnnouncementRefreshKey(prev => prev + 1);
      setCurrentSlide(0);
    }
  }, [announcementUpdated]);

  useEffect(() => {
    if (bellTriggered) {
      playBellSound();
    }
  }, [bellTriggered, playBellSound]);

  const photoAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return announcements.filter(a => ((a as any).has_image_data || a.image_data || a.image_path || a.image_url) && !a.title.toLowerCase().includes('logo'));
  }, [announcements]);

  const logoAnnouncement = useMemo(() => {
    if (!announcements) return null;
    return announcements.find(a => ((a as any).has_image_data || a.image_data || a.image_path || a.image_url) && a.title.toLowerCase().includes('logo'));
  }, [announcements]);

  const logoImageUrl = useMemo(() => {
    if (!logoAnnouncement) return null;
    return logoAnnouncement.image_url || logoAnnouncement.image_data || logoAnnouncement.image_path || null;
  }, [logoAnnouncement]);

  const textAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return announcements.filter(a => !((a as any).has_image_data || a.image_data || a.image_path || a.image_url));
  }, [announcements]);

  useEffect(() => {
    const totalAnnouncements = (photoAnnouncements?.length || 0) + (textAnnouncements?.length || 0);
    if (totalAnnouncements <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalAnnouncements);
    }, rotationSpeed);

    return () => clearInterval(timer);
  }, [photoAnnouncements, textAnnouncements, rotationSpeed]);

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

  const getTimeRemainingUntil = (endTime: string, now: Date = new Date()): string => {
    const [hours, minutes] = endTime.split(':').map(Number);
    const end = new Date(now);
    end.setHours(hours, minutes, 0, 0);

    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'ENDED';

    const totalSeconds = Math.floor(diff / 1000);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  const activeLessons = useMemo(() => {
    return sessions || [];
  }, [sessions]);

  const currentSession = useMemo(() => {
    return activeLessons.length > 0 ? activeLessons[0] : null;
  }, [activeLessons]);

  // Auto-refresh when the soonest active session ends
  useEffect(() => {
    if (!activeLessons.length || !refreshSessions) return;
    const now = new Date();
    const endTimes = activeLessons.map(lesson => {
      const [h, m] = lesson.end_time.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }).filter(t => t > now.getTime());

    if (!endTimes.length) return;
    const nextEnd = Math.min(...endTimes);
    const delay = nextEnd - now.getTime() + 2000; // 2s after end

    if (delay > 0 && delay < 300000) {
      const timer = setTimeout(() => {
        refreshSessions();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [activeLessons, refreshSessions]);

  // Get subject-based color
  const getSubjectColor = (subjectName: string): string => {
    const colors = [
      '#1976d2', '#e91e63', '#9c27b0', '#673ab7', '#009688',
      '#4caf50', '#ff9800', '#ff5722', '#795548', '#607d8b'
    ];
    const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // ÉTUDE (Study Hall) time detection
  const isEtudeTime = useMemo(() => {
    const now = currentTime;
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentMinutes = hour * 60 + minute;
    // Etude: 18:30 - 20:25
    const etudeStart = 18 * 60 + 30;
    const etudeEnd = 20 * 60 + 25;
    return currentMinutes >= etudeStart && currentMinutes < etudeEnd;
  }, [currentTime]);

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
      {/* Bell Trigger Notification Overlay */}
      {bellTriggered && (
        <div className="bell-notification-overlay">
          <div className="bell-notification-content">
            <div className="bell-icon">🔔</div>
            <h2 className="bell-title">BELL RINGING</h2>
            <p className="bell-reason">{bellData?.reason || 'Manual trigger'}</p>
            <div className="bell-pulse"></div>
          </div>
        </div>
      )}

      <div className="display-main">
        {/* Timetable Section */}
        <div className="display-timetable">
          <div className="display-header">
            <div className="display-header-left">
              {logoImageUrl && (
                <img
                  className="display-logo"
                  src={logoImageUrl}
                  alt={logoAnnouncement?.title || 'Logo'}
                />
              )}
              <h1 className="display-title">LIVE TIMETABLE</h1>
            </div>
            <div className="display-header-center">
              <div className="display-date">{formatDate}</div>
              <div className="display-time">{formatTime}</div>
            </div>
            <div className="display-header-right">
              <a href="/admin" className="admin-link">Admin</a>
            </div>
          </div>

          {/* Étude / Study Hall Banner */}
          {isEtudeTime && (
            <div className="etude-banner">
              <div className="etude-icon">📖</div>
              <div className="etude-content">
                <div className="etude-label">ÉTUDE / STUDY HALL</div>
                <div className="etude-status">Students are currently in study period</div>
                <div className="etude-time">6:30 PM - 8:25 PM</div>
              </div>
              <div className="etude-pulse"></div>
            </div>
          )}

          <div className="live-sessions-wrapper">
            <div className="live-highlight-title">
              {isEtudeTime ? 'Study Period in Progress' : activeLessons.length > 0 ? 'Teachers Currently in Class' : 'No Active Sessions'}
            </div>
            {activeLessons.length > 0 ? (
              <div className="live-sessions-grid">
                {activeLessons.map((lesson) => {
                  const isTemporary = lesson.is_temporary === 1;
                  const temporaryDate = lesson.temporary_date ? new Date(lesson.temporary_date).toLocaleDateString('en-US') : null;

                  return (
                    <div
                      key={lesson.id}
                      className="live-session-card"
                      style={{ borderLeftColor: getSubjectColor(lesson.subject_name) }}
                    >
                      <div className="live-session-teacher-name">{lesson.teacher_name}</div>
                      <div className="live-session-badges">
                        <span className="session-badge now-badge">Now</span>
                        {isTemporary && <span className="session-badge temp-badge">Temporary</span>}
                      </div>
                      <div className="live-session-top">
                        <div className="live-session-subject">{lesson.subject_name}</div>
                        <div className="live-session-time">
                          {lesson.start_time} - {lesson.end_time}
                        </div>
                      </div>
                      <div className="live-session-mid">
                        <div className="live-session-class">Class: {lesson.class_name}</div>
                        <div className="live-session-classroom">Room: {lesson.classroom_name}</div>
                      </div>
                      <div className="live-session-bottom">
                        <div className="live-session-countdown">
                          {getTimeRemainingUntil(lesson.end_time, currentTime) === 'ENDED' ? 'Just ended' : `Ends in ${getTimeRemainingUntil(lesson.end_time, currentTime)}`}
                        </div>
                      </div>
                      {temporaryDate && (
                        <div className="session-note">Temporary date: {temporaryDate}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="live-highlight-empty">
                No active teaching sessions at the moment.
              </div>
            )}
          </div>
      </div>

        <div className="display-announcements">
          <div className="announcements-header">
            <h2 className="announcements-title">{t('announcements', language)}</h2>
          </div>
          {(!photoAnnouncements.length && !textAnnouncements.length) ? (
            <div className="announcement-empty-state">
              <div className="announcement-empty-icon">📢</div>
              <p className="announcement-empty-text">No announcements</p>
            </div>
          ) : (
            <div className="unified-slideshow">
              <div className="slideshow-progress">
                {Array.from({ length: photoAnnouncements.length + textAnnouncements.length }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`progress-dot ${idx === currentSlide % (photoAnnouncements.length + textAnnouncements.length) ? 'active' : ''}`}
                  />
                ))}
              </div>
              {[...photoAnnouncements, ...textAnnouncements].map((announcement, index) => {
                const isActive = index === currentSlide % (photoAnnouncements.length + textAnnouncements.length);
                const hasImage = !!(announcement.image_url || announcement.image_data || announcement.image_path);
                const imageUrl = announcement.image_url || announcement.image_data || announcement.image_path;

                return (
                  <div
                    key={announcement.id}
                    className={`unified-announcement-slide ${isActive ? 'active' : ''}`}
                  >
                    <div className={`unified-card ${hasImage ? 'has-image' : 'text-only'}`}>
                      {hasImage && (
                        <div className="unified-card-image">
                          <img
                            src={imageUrl}
                            alt={announcement.title || 'Announcement'}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className={`unified-card-text ${hasImage ? 'with-image' : 'standalone'}`}>
                        <h3 className="unified-card-title">{announcement.title}</h3>
                        {announcement.text_content && (
                          <p className="unified-card-body">{announcement.text_content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
