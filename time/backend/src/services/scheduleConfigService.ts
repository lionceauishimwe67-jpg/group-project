import { query, queryOne, run } from '../config/database';
import { TimeSlot, SchoolScheduleConfig } from '../types/timetable';

// Default school schedule for Lycee Saint Alexandre Sauli de Muhura
const DEFAULT_SCHEDULE: SchoolScheduleConfig = {
  assemblyTime: { start: '07:50', end: '08:10' },
  schoolStart: '07:50',
  schoolEnd: '17:00',
  periods: [
    { label: 'Period 1', startTime: '08:10', endTime: '08:50', isBreak: false, isLunch: false },
    { label: 'Period 2', startTime: '08:50', endTime: '09:30', isBreak: false, isLunch: false },
    { label: 'Period 3', startTime: '09:30', endTime: '10:10', isBreak: false, isLunch: false },
    { label: 'Period 4', startTime: '10:25', endTime: '11:05', isBreak: false, isLunch: false },
    { label: 'Period 5', startTime: '11:05', endTime: '11:45', isBreak: false, isLunch: false },
    { label: 'Period 6', startTime: '11:45', endTime: '12:25', isBreak: false, isLunch: false },
    { label: 'Period 7', startTime: '13:30', endTime: '14:10', isBreak: false, isLunch: false },
    { label: 'Period 8', startTime: '14:10', endTime: '14:50', isBreak: false, isLunch: false },
    { label: 'Period 9', startTime: '14:50', endTime: '15:30', isBreak: false, isLunch: false },
    { label: 'Period 10', startTime: '15:40', endTime: '16:20', isBreak: false, isLunch: false },
    { label: 'Period 11', startTime: '16:20', endTime: '17:00', isBreak: false, isLunch: false },
  ],
  breaks: [
    { label: 'Morning Break', startTime: '10:10', endTime: '10:25', isBreak: true, isLunch: false },
    { label: 'Afternoon Break', startTime: '15:30', endTime: '15:40', isBreak: true, isLunch: false },
  ],
  lunchTime: { start: '12:25', end: '13:30' },
};

class ScheduleConfigService {
  private cache: SchoolScheduleConfig | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getSchedule(): Promise<SchoolScheduleConfig> {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const config = await queryOne<{ value: string }>(
        "SELECT value FROM system_state WHERE key = 'school_schedule'"
      );

      if (config?.value) {
        this.cache = JSON.parse(config.value);
      } else {
        this.cache = { ...DEFAULT_SCHEDULE };
        await run(
          "INSERT OR IGNORE INTO system_state (key, value) VALUES ('school_schedule', ?)",
          [JSON.stringify(DEFAULT_SCHEDULE)]
        );
      }

      this.cacheExpiry = now + this.CACHE_TTL;
      return this.cache as SchoolScheduleConfig;
    } catch {
      this.cache = { ...DEFAULT_SCHEDULE };
      this.cacheExpiry = now + this.CACHE_TTL;
      return this.cache as SchoolScheduleConfig;
    }
  }

  async getTimeSlots(): Promise<TimeSlot[]> {
    const schedule = await this.getSchedule();
    const slots: TimeSlot[] = [];

    if (schedule.assemblyTime) {
      slots.push({
        label: 'Assembly',
        startTime: schedule.assemblyTime.start,
        endTime: schedule.assemblyTime.end,
        isBreak: false,
        isLunch: false,
      });
    }

    slots.push(...schedule.periods);
    slots.push(...schedule.breaks);

    if (schedule.lunchTime) {
      slots.push({
        label: 'Lunch Break',
        startTime: schedule.lunchTime.start,
        endTime: schedule.lunchTime.end,
        isBreak: false,
        isLunch: true,
      });
    }

    return slots;
  }

  async updateSchedule(config: Partial<SchoolScheduleConfig>): Promise<SchoolScheduleConfig> {
    const current = await this.getSchedule();
    const updated = { ...current, ...config };

    await run(
      "UPDATE system_state SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'school_schedule'",
      [JSON.stringify(updated)]
    );

    this.cache = updated;
    this.cacheExpiry = Date.now() + this.CACHE_TTL;
    return updated;
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}

export const scheduleConfigService = new ScheduleConfigService();
